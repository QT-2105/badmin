import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { verifyPassword } from '@/lib/auth/password';
import { assertLoginAllowed, clearLoginAttempts, getLoginRateLimitKey, recordFailedLogin } from '@/lib/auth/rate-limit';
import { createAuthSession, setAuthCookie, toAuthUser } from '@/lib/auth/session';
import { AppError } from '@/lib/app-error';
import { getAuthUserByEmail, touchLastLogin } from '@/repositories/auth-users-repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const email = String(payload?.email ?? '').trim().toLowerCase();
    const password = String(payload?.password ?? '');
    if (!email || !password) {
      throw new AppError('Vui lòng nhập tên đăng nhập và mật khẩu.', 400);
    }
    const rateLimitKey = getLoginRateLimitKey(request, email);
    assertLoginAllowed(rateLimitKey);

    const user = await getAuthUserByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      recordFailedLogin(rateLimitKey);
      throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      recordFailedLogin(rateLimitKey);
      throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
    }

    const { token, expiresAt } = await createAuthSession(user.id);
    await touchLastLogin(user.id);
    clearLoginAttempts(rateLimitKey);
    const response = NextResponse.json({ user: toAuthUser(user) });
    setAuthCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    return apiError(error, 'Không thể đăng nhập');
  }
}
