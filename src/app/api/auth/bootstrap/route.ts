import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { createAuthSession, setAuthCookie } from '@/lib/auth/session';
import { countAuthUsers, createAuthUser } from '@/repositories/auth-users-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userCount = await countAuthUsers();
  return NextResponse.json({ needsBootstrap: userCount === 0 });
}

export async function POST(request: Request) {
  try {
    const userCount = await countAuthUsers();
    if (userCount > 0) {
      return NextResponse.json({ error: 'Hệ thống đã có tài khoản quản trị.' }, { status: 409 });
    }

    const payload = await request.json();
    const user = await createAuthUser({
      email: payload.email,
      displayName: payload.displayName,
      password: payload.password,
      role: 'OWNER'
    });
    const session = await createAuthSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    setAuthCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return apiError(error, 'Không thể khởi tạo tài khoản đầu tiên');
  }
}
