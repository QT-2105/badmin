import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deleteSessionCouple, updateSessionCouple } from '@/repositories/session-couples-repository';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ coupleId: string }> };

function sessionIdFromCoupleId(coupleId: string): string | undefined {
  const separator = coupleId.lastIndexOf(':');
  return separator > 0 ? coupleId.slice(0, separator) : undefined;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { coupleId } = await context.params;
    await requireApiPermission(request, 'session.operate', {
      activeSessionId: sessionIdFromCoupleId(coupleId),
      allowActiveSessionContinuation: true
    });
    const payload = await request.json();
    const couple = await updateSessionCouple(coupleId, {
      memberIds: payload.memberIds === undefined ? undefined : Array.isArray(payload.memberIds) ? payload.memberIds : [],
      matchMode: payload.matchMode,
      active: payload.active,
      nextMatchRequestedAt: payload.nextMatchRequestedAt
    });
    return NextResponse.json({ couple });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật Couple');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { coupleId } = await context.params;
    await requireApiPermission(request, 'session.operate', {
      activeSessionId: sessionIdFromCoupleId(coupleId),
      allowActiveSessionContinuation: true
    });
    await deleteSessionCouple(coupleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể gỡ Couple');
  }
}
