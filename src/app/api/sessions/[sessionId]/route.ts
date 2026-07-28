import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deletePlaySession, getPlaySession, updatePlaySession } from '@/repositories/play-sessions-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.view');
    const { sessionId } = await context.params;
    const session = await getPlaySession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải ca chơi');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.operate');
    const { sessionId } = await context.params;
    const payload = await request.json();
    const session = await updatePlaySession(sessionId, {
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      courtCount: payload.courtCount === undefined ? undefined : Number(payload.courtCount),
      note: payload.note,
      status: payload.status,
      courtCost: payload.courtCost === undefined ? undefined : Number(payload.courtCost),
      shuttlecockPiecesUsed: payload.shuttlecockPiecesUsed === undefined ? undefined : Number(payload.shuttlecockPiecesUsed),
      shuttlecockProductId: payload.shuttlecockProductId,
      shuttlecockProductName: payload.shuttlecockProductName,
      extraExpenseTitle: payload.extraExpenseTitle,
      extraExpenseAmount: payload.extraExpenseAmount === undefined ? undefined : Number(payload.extraExpenseAmount),
      totalIncome: payload.totalIncome === undefined ? undefined : Number(payload.totalIncome),
      totalExpense: payload.totalExpense === undefined ? undefined : Number(payload.totalExpense),
      totalProfit: payload.totalProfit === undefined ? undefined : Number(payload.totalProfit)
    });

    return NextResponse.json({ session });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật ca chơi');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'schedule.manage');
    const { sessionId } = await context.params;
    await deletePlaySession(sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa ca chơi');
  }
}
