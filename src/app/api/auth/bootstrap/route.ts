import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ needsBootstrap: false, provisioningRequired: true });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Khởi tạo OWNER toàn cục đã bị vô hiệu hóa. Vui lòng sử dụng quy trình đăng ký và kích hoạt CLB.' },
    { status: 410 }
  );
}
