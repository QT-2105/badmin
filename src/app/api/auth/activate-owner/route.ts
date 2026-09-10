import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { assertLoginAllowed, clearLoginAttempts, getLoginRateLimitKey, recordFailedLogin } from '@/lib/auth/rate-limit';
import { activateOwner } from '@/lib/provisioning/owner-activation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const clubCode = String(payload?.clubCode ?? '').trim().toLowerCase();
  const token = String(payload?.token ?? '');
  const rateLimitKey = getLoginRateLimitKey(request, clubCode || 'unknown-club', token || 'invalid-token');
  try {
    assertLoginAllowed(rateLimitKey);
    const result = await activateOwner({ clubCode, token, password: String(payload?.password ?? '') });
    clearLoginAttempts(rateLimitKey);
    return NextResponse.json({ ok: true, club: { code: result.clubCode } });
  } catch (error) {
    recordFailedLogin(rateLimitKey);
    return apiError(error, 'Không thể kích hoạt tài khoản OWNER');
  }
}
