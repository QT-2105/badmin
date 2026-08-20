import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deleteSessionPlayer, updateSessionPlayer } from '@/repositories/session-players-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ playerId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { playerId } = await context.params;
    const payload = await request.json();
    const player = await updateSessionPlayer(playerId, {
      fullName: payload.fullName,
      gender: payload.gender,
      level: payload.level === undefined ? undefined : Number(payload.level),
      paymentAmount: payload.paymentAmount === undefined ? undefined : Number(payload.paymentAmount),
      discount: payload.discount === undefined ? undefined : Number(payload.discount),
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      note: payload.note,
      playerTags: payload.playerTags,
      firstArrivedAt: payload.firstArrivedAt,
      arrivalBaselineMatches: payload.arrivalBaselineMatches === undefined ? undefined : payload.arrivalBaselineMatches === null ? null : Number(payload.arrivalBaselineMatches),
      fairnessOffset: payload.fairnessOffset === undefined ? undefined : Number(payload.fairnessOffset),
      deferredRounds: payload.deferredRounds === undefined ? undefined : Number(payload.deferredRounds),
      waitingSince: payload.waitingSince,
      entryPriorityConsumedAt: payload.entryPriorityConsumedAt,
      lastFinishedAt: payload.lastFinishedAt,
      nextMatchRequestedAt: payload.nextMatchRequestedAt,
      nextMatchRequestMode: payload.nextMatchRequestMode,
      endGameAt: payload.endGameAt,
      endGameAfterMatch: payload.endGameAfterMatch
    });

    return NextResponse.json({ player });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật người chơi');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { playerId } = await context.params;
    await deleteSessionPlayer(playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa người chơi');
  }
}
