import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { deleteSessionPlayer, updateSessionPlayer } from '@/repositories/session-players-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ playerId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
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
      playerTags: payload.playerTags
    });

    return NextResponse.json({ player });
  } catch (error) {
    return apiError(error, 'Không thể cập nhật người chơi');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { playerId } = await context.params;
    await deleteSessionPlayer(playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, 'Không thể xóa người chơi');
  }
}
