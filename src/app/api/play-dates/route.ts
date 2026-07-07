import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { createPlayDate, listPlayDates } from '@/repositories/play-dates-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'schedule.view');
    const playDates = await listPlayDates();
    return NextResponse.json({ playDates });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải lịch chơi');
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'schedule.manage');
    const payload = await request.json();
    if (!payload?.playDate) {
      return NextResponse.json({ error: 'Vui lòng chọn ngày chơi.' }, { status: 400 });
    }

    const playDate = await createPlayDate({
      playDate: payload.playDate,
      title: payload.title,
      note: payload.note
    });

    return NextResponse.json({ playDate }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tạo ngày chơi');
  }
}
