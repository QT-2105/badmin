import { NextResponse } from 'next/server';

import { authErrorResponse, requireApiUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Không thể tải tài khoản' }, { status: 500 });
  }
}
