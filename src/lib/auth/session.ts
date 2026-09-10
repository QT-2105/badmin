import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { requireTenantContext } from '@/lib/tenant-context';
import { AUTH_COOKIE_NAME } from './constants';
import { normalizeUserRole, normalizeUserStatus, type AuthUser } from './permissions';

export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

type UserRow = {
  id: string;
  club_id: string;
  username: string | null;
  email: string | null;
  email_normalized: string | null;
  phone: string | null;
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
    clubId: row.club_id,
    username: row.username,
    email: row.email_normalized ? row.email : null,
    phone: row.phone,
    displayName: row.display_name,
    role: normalizeUserRole(row.role),
    status: normalizeUserStatus(row.status)
  };
}

export async function createAuthSession(userId: string, requestedClubId?: string): Promise<{ token: string; expiresAt: Date }> {
  const clubId = requestedClubId ?? requireTenantContext('auth.session.create.compatibility').clubId;
  const token = createRawSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.$transaction(async (tx) => {
    const user = await tx.app_users.findFirst({ where: { id: userId, club_id: clubId }, select: { id: true } });
    if (!user) throw new AppError('Không tìm thấy tài khoản.', 404);
    await tx.auth_sessions.deleteMany({ where: { club_id: clubId, expires_at: { lte: new Date() } } });
    await tx.auth_sessions.create({
      data: {
        club_id: clubId,
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
  const session = await prisma.auth_sessions.findFirst({
    where: { token_hash: tokenHash(token) },
    include: { app_users: true }
  });

  if (!session || session.expires_at.getTime() <= Date.now()) {
    if (session) {
      await prisma.auth_sessions.deleteMany({ where: { id: session.id, club_id: session.club_id } }).catch(() => undefined);
    }
    return null;
  }

  if (session.app_users.club_id !== session.club_id || session.app_users.status !== 'ACTIVE') return null;
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
