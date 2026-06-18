import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { deleteAllMatchHistory } from '@/repositories/match-history-repository';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const result = await deleteAllMatchHistory();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiError(error, 'Không thể xóa lịch sử trận đấu');
  }
}
