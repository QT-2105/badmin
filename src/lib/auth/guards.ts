import { NextResponse } from 'next/server';
import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { AUTH_COOKIE_NAME } from './constants';
import { getCurrentUserByToken, getCurrentUserFromCookies } from './session';
import { getRoutePermission, hasAnyRole, hasPermission, type AuthUser, type PermissionKey, type UserRole } from './permissions';
import { getPermissionsForRole } from '@/repositories/role-permissions-repository';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function getBearerlessCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : null;
}

export async function requireApiUser(request: Request, roles?: UserRole[]): Promise<AuthUser> {
  const token = getBearerlessCookie(request, AUTH_COOKIE_NAME);
  const user = await getAuthorizedUser(token);
  if (!user) {
    throw new AuthError('Vui lòng đăng nhập để tiếp tục.', 401);
  }
  if (roles && !hasAnyRole(user, roles)) {
    throw new AuthError('Tài khoản không có quyền thực hiện thao tác này.', 403);
  }
  return user;
}

export async function requireApiPermission(request: Request, permission: PermissionKey): Promise<AuthUser> {
  const user = await requireApiUser(request);
  if (!hasPermission(user, permission)) {
    throw new AuthError('Tài khoản không có quyền thực hiện thao tác này.', 403);
  }
  return user;
}

export function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthError)) return null;
  return NextResponse.json({ error: error.message }, { status: error.status });
}

export async function requirePageUser(pathname: string): Promise<AuthUser> {
  const baseUser = await getCurrentUserFromCookies();
  const user = baseUser ? await withPermissions(baseUser) : null;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(pathname)}` as Route);
  }

  const permission = getRoutePermission(pathname);
  if (!hasPermission(user, permission)) {
    redirect('/dashboard');
  }

  return user;
}

async function getAuthorizedUser(token: string | null): Promise<AuthUser | null> {
  const user = await getCurrentUserByToken(token);
  return user ? withPermissions(user) : null;
}

async function withPermissions(user: AuthUser): Promise<AuthUser> {
  return {
    ...user,
    permissions: await getPermissionsForRole(user.role)
  };
}
