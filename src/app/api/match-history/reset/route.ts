import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deleteAllMatchHistory } from '@/repositories/match-history-repository';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const result = await deleteAllMatchHistory();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa lịch sử trận đấu');
  }
}
