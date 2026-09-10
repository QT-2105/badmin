import { NextResponse } from 'next/server';

import { authErrorResponse, requireApiUser, withEffectiveEntitlement } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await withEffectiveEntitlement(await requireApiUser(request));
    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Không thể tải tài khoản' }, { status: 500 });
  }
}
