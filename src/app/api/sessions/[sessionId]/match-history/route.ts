import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { createMatchHistory, listMatchHistory } from '@/repositories/match-history-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.view');
    const { sessionId } = await context.params;
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');
    const history = await listMatchHistory(sessionId, playerId);
    return NextResponse.json({ history });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải lịch sử trận đấu');
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { sessionId } = await context.params;
    const payload = await request.json();
    const history = await createMatchHistory({
      sessionId,
      courtNumber: Number(payload.courtNumber),
      courtName: payload.courtName,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      durationSeconds: payload.durationSeconds === undefined ? null : Number(payload.durationSeconds),
      teamA: Array.isArray(payload.teamA) ? payload.teamA : [],
      teamB: Array.isArray(payload.teamB) ? payload.teamB : []
    });

    return NextResponse.json({ history }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể lưu lịch sử trận đấu');
  }
}
