import { NextResponse } from 'next/server';

import { isAppError } from '@/lib/app-error';

type PrismaLikeError = {
  code?: string;
  meta?: {
    target?: string[] | string;
  };
  message?: string;
};

export function apiError(error: unknown, fallback: string) {
  if (isAppError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const prismaError = error as PrismaLikeError;
  if (prismaError?.code === 'P2002') {
    return NextResponse.json({ error: getUniqueConstraintMessage(prismaError.meta?.target) }, { status: 409 });
  }

  if (prismaError?.code === 'P2003') {
    return NextResponse.json({ error: 'Dữ liệu liên kết không hợp lệ. Vui lòng tải lại và thao tác lại.' }, { status: 400 });
  }

  if (prismaError?.code === 'P2025') {
    return NextResponse.json({ error: 'Không tìm thấy dữ liệu cần xử lý.' }, { status: 404 });
  }

  if (error instanceof Error && isUserFacingMessage(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

function getUniqueConstraintMessage(target: string[] | string | undefined): string {
  const fields = Array.isArray(target) ? target : target ? [target] : [];
  if (fields.includes('play_date')) return 'Ngày chơi này đã tồn tại. Vui lòng chọn ngày khác.';
  return 'Dữ liệu bị trùng. Vui lòng kiểm tra lại thông tin đã nhập.';
}

function isUserFacingMessage(message: string): boolean {
  return /[À-ỹ]/.test(message) || message.startsWith('Vui lòng') || message.startsWith('Không thể') || message.startsWith('Cần ít nhất');
}
