import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deleteAllPlayerImages } from '@/repositories/player-images-repository';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const result = await deleteAllPlayerImages();
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa dữ liệu hình ảnh người chơi');
  }
}
