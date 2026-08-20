import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deleteSessionCouple, updateSessionCouple } from '@/repositories/session-couples-repository';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ coupleId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { coupleId } = await context.params;
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
    await requireApiPermission(request, 'session.operate');
    const { coupleId } = await context.params;
    await deleteSessionCouple(coupleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể gỡ Couple');
  }
}
