import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deletePlayDate, getPlayDate, updatePlayDate } from '@/repositories/play-dates-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'schedule.view');
    const { id } = await context.params;
    const playDate = await getPlayDate(id);
    if (!playDate) {
      return NextResponse.json({ error: 'Play date not found' }, { status: 404 });
    }

    return NextResponse.json({ playDate });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải ngày chơi');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'schedule.manage');
    const { id } = await context.params;
    const payload = await request.json();
    const playDate = await updatePlayDate(id, {
      playDate: payload.playDate,
      title: payload.title,
      note: payload.note
    });

    return NextResponse.json({ playDate });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật ngày chơi');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'schedule.manage');
    const { id } = await context.params;
    await deletePlayDate(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa ngày chơi');
  }
}
