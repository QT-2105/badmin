import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { createSessionPlayer, listSessionPlayers } from '@/repositories/session-players-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const players = await listSessionPlayers(sessionId);
    return NextResponse.json({ players });
  } catch (error) {
    return apiError(error, 'Không thể tải danh sách người chơi');
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const payload = await request.json();
    if (!payload.fullName || typeof payload.fullName !== 'string') {
      return NextResponse.json({ error: 'Vui lòng nhập tên người chơi.' }, { status: 400 });
    }

    const player = await createSessionPlayer({
      sessionId,
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
    return apiError(error, 'Không thể tạo người chơi');
  }
}
