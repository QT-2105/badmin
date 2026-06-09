import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { createPlaySession, listPlaySessions } from '@/repositories/play-sessions-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessions = await listPlaySessions(id);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    if (!payload?.name || !payload?.startTime || !payload?.endTime) {
      return NextResponse.json({ error: 'Vui lòng nhập tên ca, giờ bắt đầu và giờ kết thúc.' }, { status: 400 });
    }

    const session = await createPlaySession({
      playDateId: id,
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      courtCount: Number(payload.courtCount ?? 1),
      note: payload.note,
      status: payload.status
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Không thể tạo ca chơi');
  }
}
