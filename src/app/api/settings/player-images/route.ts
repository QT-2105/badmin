import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { deleteAllPlayerImages } from '@/repositories/player-images-repository';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const result = await deleteAllPlayerImages();
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, 'Không thể xóa dữ liệu hình ảnh người chơi');
  }
}
