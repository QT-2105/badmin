import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { createSessionCouple, listSessionCouples } from '@/repositories/session-couples-repository';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.view');
    const { sessionId } = await context.params;
    const couples = await listSessionCouples(sessionId);
    return NextResponse.json({ couples });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải danh sách Couple');
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { sessionId } = await context.params;
    const payload = await request.json();
    const couple = await createSessionCouple({
      sessionId,
      memberIds: Array.isArray(payload.memberIds) ? payload.memberIds : [],
      matchMode: payload.matchMode,
      nextMatchRequestedAt: payload.nextMatchRequestedAt
    });
    return NextResponse.json({ couple }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tạo Couple');
  }
}
