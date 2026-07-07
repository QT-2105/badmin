import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { createShuttlecockMovement, listShuttlecockMovements } from '@/repositories/inventory-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'inventory.view');
    const movements = await listShuttlecockMovements();
    return NextResponse.json({ movements });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải lịch sử kho');
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'inventory.manage');
    const payload = await request.json();
    if (!payload?.productId || !payload?.movementType) {
      return NextResponse.json({ error: 'Vui lòng chọn loại cầu và loại phiếu kho.' }, { status: 400 });
    }
    await createShuttlecockMovement({
      productId: payload.productId,
      movementType: payload.movementType,
      title: payload.title,
      quantityTube: payload.quantityTube,
      quantityBall: payload.quantityBall,
      actualQuantityBall: payload.actualQuantityBall,
      costPricePerTube: payload.costPricePerTube,
      usagePricePerTube: payload.usagePricePerTube,
      salePricePerTube: payload.salePricePerTube,
      note: payload.note
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tạo phiếu kho');
  }
}
