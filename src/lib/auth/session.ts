import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { AUTH_COOKIE_NAME } from './constants';
import { normalizeUserRole, normalizeUserStatus, type AuthUser } from './permissions';

export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
};

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createRawSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: normalizeUserRole(row.role),
    status: normalizeUserStatus(row.status)
  };
}

export async function createAuthSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createRawSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.auth_sessions.deleteMany({ where: { expires_at: { lte: new Date() } } });
    await tx.auth_sessions.create({
      data: {
        user_id: userId,
        token_hash: tokenHash(token),
        expires_at: expiresAt
      }
    });
  });

  return { token, expiresAt };
}

export async function getCurrentUserByToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null;
  const session = await prisma.auth_sessions.findUnique({
    where: { token_hash: tokenHash(token) },
    include: { app_users: true }
  });

  if (!session || session.expires_at.getTime() <= Date.now()) {
    if (session) {
      await prisma.auth_sessions.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  if (session.app_users.status !== 'ACTIVE') return null;
  return toAuthUser(session.app_users);
}

export async function getCurrentUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  return getCurrentUserByToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function destroyAuthSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await prisma.auth_sessions.deleteMany({ where: { token_hash: tokenHash(token) } });
}

export function setAuthCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}
