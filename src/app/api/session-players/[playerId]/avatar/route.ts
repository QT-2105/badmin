import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { readImageFileFromFormData } from '@/lib/image-upload';
import { deletePlayerAvatar, uploadPlayerAvatar } from '@/repositories/player-images-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ playerId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { playerId } = await context.params;
    const formData = await request.formData();
    const file = await readImageFileFromFormData(formData);
    const avatar = await uploadPlayerAvatar({ playerId, ...file });
    return NextResponse.json({ avatar });
  } catch (error) {
    return apiError(error, 'Không thể cập nhật ảnh người chơi');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { playerId } = await context.params;
    const avatar = await deletePlayerAvatar(playerId);
    return NextResponse.json({ avatar });
  } catch (error) {
    return apiError(error, 'Không thể xóa ảnh người chơi');
  }
}
