import { NextResponse } from 'next/server';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { AUTH_COOKIE_NAME } from './constants';
import { getCurrentUserByToken, getCurrentUserFromCookies } from './session';
import { getRoutePermission, hasAnyRole, hasPermission, type AuthUser, type PermissionKey, type UserRole } from './permissions';
import { getPermissionsForRole } from '@/repositories/role-permissions-repository';
import { getControlClubFoundation } from '@/repositories/control-club-repository';
import { evaluateClubFeature, getEffectiveEntitlement, logEntitlementDecision } from '@/lib/entitlements';
import type { EntitlementFeatureKey } from '@/lib/entitlements/types';
import { establishTenantContext } from '@/lib/tenant-context';

export class AuthError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 401, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
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
  establishTenantContext({ clubId: user.clubId, userId: user.id }, 'auth.api');
  return user;
}

const PERMISSION_FEATURES: Record<PermissionKey, EntitlementFeatureKey> = {
  'dashboard.view': 'dashboard',
  'schedule.view': 'schedule',
  'schedule.manage': 'schedule',
  'session.view': 'schedule',
  'session.operate': 'session.runtime',
  'session.complete': 'session.completion',
  'finance.view': 'finance',
  'finance.manage': 'finance',
  'inventory.view': 'inventory',
  'inventory.manage': 'inventory',
  'settings.manage': 'settings',
  'users.manage': 'users'
};

type ApiEntitlementOptions = {
  feature?: EntitlementFeatureKey;
  activeSessionId?: string;
  activeSessionPlayerId?: string;
  allowActiveSessionContinuation?: boolean;
};

export async function requireApiPermission(
  request: Request,
  permission: PermissionKey,
  options: ApiEntitlementOptions = {}
): Promise<AuthUser> {
  const user = await requireApiUser(request);
  if (!hasPermission(user, permission)) {
    throw new AuthError('Tài khoản không có quyền thực hiện thao tác này.', 403);
  }
  const feature = options.feature ?? PERMISSION_FEATURES[permission];
  const decision = await evaluateClubFeature(user.clubId, feature, options);
  logEntitlementDecision(user.clubId, feature, decision);
  if (!decision.allowed) {
    throw new AuthError('Tính năng này hiện không được kích hoạt cho CLB.', 403, 'FEATURE_NOT_ENTITLED');
  }
  return { ...user, entitlement: decision.entitlement };
}

export function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthError)) return null;
  return NextResponse.json(
    { error: error.message, ...(error.code ? { code: error.code } : {}) },
    { status: error.status }
  );
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

const getCachedControlClubFoundation = cache((clubId: string) => getControlClubFoundation(clubId));

export async function requireTenantPageUser(clubCode: string, pathname: string): Promise<AuthUser> {
  const normalizedCode = clubCode.normalize('NFKC').trim().toLowerCase();
  const requestedPath = `/${normalizedCode}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const baseUser = await getCurrentUserFromCookies();
  const user = baseUser ? await withPermissions(baseUser) : null;
  if (!user) redirect(`/login?next=${encodeURIComponent(requestedPath)}` as Route);

  const club = await getCachedControlClubFoundation(user.clubId);
  if (!club || club.code !== normalizedCode) notFound();
  const permission = getRoutePermission(requestedPath);
  if (!hasPermission(user, permission)) redirect(`/${club.code}/dashboard` as Route);
  const feature = getPageFeature(pathname, permission);
  const activeSessionId = getSessionIdFromPath(pathname);
  const decision = await evaluateClubFeature(user.clubId, feature, {
    activeSessionId,
    allowActiveSessionContinuation: Boolean(activeSessionId)
  });
  logEntitlementDecision(user.clubId, feature, decision);
  if (!decision.allowed) notFound();
  return { ...user, entitlement: decision.entitlement };
}

export async function redirectLegacyPage(pathname: string): Promise<never> {
  const user = await getCurrentUserFromCookies();
  if (!user) redirect(`/login?next=${encodeURIComponent(pathname)}` as Route);
  establishTenantContext({ clubId: user.clubId, userId: user.id }, 'auth.page.redirect');
  const club = await getCachedControlClubFoundation(user.clubId);
  if (!club) redirect('/login' as Route);
  redirect(`/${club.code}${pathname}` as Route);
}

async function getAuthorizedUser(token: string | null): Promise<AuthUser | null> {
  const user = await getCurrentUserByToken(token);
  return user ? withPermissions(user) : null;
}

async function withPermissions(user: AuthUser): Promise<AuthUser> {
  establishTenantContext({ clubId: user.clubId, userId: user.id }, 'auth.permissions');
  return {
    ...user,
    permissions: await getPermissionsForRole(user.role, user.clubId)
  };
}

function getPageFeature(pathname: string, permission: PermissionKey): EntitlementFeatureKey {
  const normalized = normalizePermissionPath(pathname);
  if (/^\/sessions\/[^/]+\/runtime(?:\/|$)/.test(normalized)) return 'session.runtime';
  return PERMISSION_FEATURES[permission];
}

function normalizePermissionPath(pathname: string): string {
  return `/${pathname.split('?')[0].split('#')[0].split('/').filter(Boolean).join('/')}`;
}

function getSessionIdFromPath(pathname: string): string | undefined {
  const match = normalizePermissionPath(pathname).match(/^\/sessions\/([^/]+)/);
  return match?.[1];
}

export async function withEffectiveEntitlement(user: AuthUser): Promise<AuthUser> {
  return { ...user, entitlement: await getEffectiveEntitlement(user.clubId) };
}
