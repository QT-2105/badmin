import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { deleteShuttlecockProduct, updateShuttlecockProduct } from '@/repositories/inventory-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const payload = await request.json();
    const product = await updateShuttlecockProduct(productId, {
      name: payload.name,
      brand: payload.brand,
      ballsPerTube: payload.ballsPerTube === undefined ? undefined : Number(payload.ballsPerTube),
      status: payload.status
    });
    return NextResponse.json({ product });
  } catch (error) {
    return apiError(error, 'Không thể cập nhật loại cầu');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { productId } = await context.params;
    await deleteShuttlecockProduct(productId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, 'Không thể xóa loại cầu');
  }
}
