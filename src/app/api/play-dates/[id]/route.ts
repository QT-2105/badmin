import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { deletePlayDate, getPlayDate, updatePlayDate } from '@/repositories/play-dates-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const playDate = await getPlayDate(id);
  if (!playDate) {
    return NextResponse.json({ error: 'Play date not found' }, { status: 404 });
  }

  return NextResponse.json({ playDate });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const playDate = await updatePlayDate(id, {
      playDate: payload.playDate,
      title: payload.title,
      note: payload.note
    });

    return NextResponse.json({ playDate });
  } catch (error) {
    return apiError(error, 'Không thể cập nhật ngày chơi');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deletePlayDate(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, 'Không thể xóa ngày chơi');
  }
}
