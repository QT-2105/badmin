import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { createShuttlecockProduct, listShuttlecockProductOptions, listShuttlecockProducts } from '@/repositories/inventory-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') ?? undefined;
    if (url.searchParams.get('view') === 'options' && sessionId) {
      await requireApiPermission(request, 'session.view', {
        feature: 'session.completion',
        activeSessionId: sessionId,
        allowActiveSessionContinuation: true
      });
    } else {
      await requireApiPermission(request, 'inventory.view');
    }
    if (url.searchParams.get('view') === 'options') {
      const products = await listShuttlecockProductOptions();
      return NextResponse.json({ products });
    }

    const products = await listShuttlecockProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải danh sách loại cầu');
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'inventory.manage');
    const payload = await request.json();
    if (!payload?.name) {
      return NextResponse.json({ error: 'Vui lòng nhập tên loại cầu.' }, { status: 400 });
    }
    const product = await createShuttlecockProduct({
      name: payload.name,
      brand: payload.brand,
      ballsPerTube: payload.ballsPerTube,
      status: payload.status
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tạo loại cầu');
  }
}
