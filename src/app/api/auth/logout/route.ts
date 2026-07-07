import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';
import { getBearerlessCookie } from '@/lib/auth/guards';
import { clearAuthCookie, destroyAuthSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const token = getBearerlessCookie(request, AUTH_COOKIE_NAME);
  await destroyAuthSession(token);
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
