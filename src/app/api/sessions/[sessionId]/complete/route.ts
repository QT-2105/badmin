import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { completePlaySession } from '@/repositories/session-completion-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'session.complete');
    const { sessionId } = await context.params;
    const payload = await request.json();
    const session = await completePlaySession({
      sessionId,
      courtCost: Number(payload.courtCost),
      shuttlecockProductId: payload.shuttlecockProductId,
      shuttlecockPiecesUsed: Number(payload.shuttlecockPiecesUsed),
      extraExpenseTitle: payload.extraExpenseTitle,
      extraExpenseAmount: payload.extraExpenseAmount === undefined ? undefined : Number(payload.extraExpenseAmount),
      note: payload.note,
      autoCreateCourtFeeTransaction: payload.autoCreateCourtFeeTransaction,
      autoCreateShuttlecockUsageTransaction: payload.autoCreateShuttlecockUsageTransaction
    });

    return NextResponse.json({ session });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể hoàn tất ca');
  }
}
