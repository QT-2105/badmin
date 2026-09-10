import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { verifyPassword } from '@/lib/auth/password';
import { assertLoginAllowed, clearLoginAttempts, getLoginRateLimitKey, recordFailedLogin } from '@/lib/auth/rate-limit';
import { createAuthSession, setAuthCookie, toAuthUser } from '@/lib/auth/session';
import { AppError } from '@/lib/app-error';
import { getAuthUserByIdentifier, touchLastLogin } from '@/repositories/auth-users-repository';
import { findLoginClubByCode, getControlClubFoundation, isClubLoginRolloutAllowed } from '@/repositories/control-club-repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const clubCode = String(payload?.clubCode ?? '').trim().toLowerCase();
    const identifier = String(payload?.identifier ?? payload?.email ?? '').trim();
    const password = String(payload?.password ?? '');
    if (!identifier || !password) {
      throw new AppError('Vui lòng nhập tên đăng nhập và mật khẩu.', 400);
    }
    const resolvedClub = clubCode
      ? await findLoginClubByCode(clubCode)
      : await getControlClubFoundation();
    const club = resolvedClub && ['ACTIVE', 'GRACE_PERIOD'].includes(resolvedClub.status) ? resolvedClub : null;
    if (!club) throw new AppError('Thông tin CLB hoặc tài khoản đăng nhập không hợp lệ.', 401);
    const genericError = `Tài khoản đăng nhập không hợp lệ hoặc không thuộc CLB ${club.name}. Vui lòng kiểm tra lại.`;
    const rateLimitKey = getLoginRateLimitKey(request, club.id, identifier);
    assertLoginAllowed(rateLimitKey);

    let user = null;
    try {
      user = await getAuthUserByIdentifier(club.id, identifier);
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 400) throw error;
    }
    if (!isClubLoginRolloutAllowed(club.id) || !user || user.status !== 'ACTIVE') {
      recordFailedLogin(rateLimitKey);
      throw new AppError(genericError, 401);
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      recordFailedLogin(rateLimitKey);
      throw new AppError(genericError, 401);
    }

    const { token, expiresAt } = await createAuthSession(user.id, club.id);
    await touchLastLogin(user.id, club.id);
    clearLoginAttempts(rateLimitKey);
    const response = NextResponse.json({
      user: toAuthUser(user),
      club: { code: club.code, name: club.name }
    });
    setAuthCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    return apiError(error, 'Không thể đăng nhập');
  }
}
