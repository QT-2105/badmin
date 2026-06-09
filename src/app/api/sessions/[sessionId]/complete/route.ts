import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { completePlaySession } from '@/repositories/session-completion-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const payload = await request.json();
    const session = await completePlaySession({
      sessionId,
      courtCost: Number(payload.courtCost),
      shuttlecockProductId: payload.shuttlecockProductId,
      shuttlecockPiecesUsed: Number(payload.shuttlecockPiecesUsed),
      autoCreateCourtFeeTransaction: payload.autoCreateCourtFeeTransaction,
      autoCreateShuttlecockUsageTransaction: payload.autoCreateShuttlecockUsageTransaction
    });

    return NextResponse.json({ session });
  } catch (error) {
    return apiError(error, 'Không thể hoàn tất ca');
  }
}
