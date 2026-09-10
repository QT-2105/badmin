import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/app-error';

export async function lockShuttlecockProduct(
  tx: Prisma.TransactionClient,
  clubId: string,
  productId: string
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM public.shuttlecock_products
    WHERE id = ${productId}::uuid
      AND club_id = ${clubId}::uuid
    FOR UPDATE
  `;
  if (rows.length !== 1) throw new AppError('Không tìm thấy loại cầu', 404);
}
