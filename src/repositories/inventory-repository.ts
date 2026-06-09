import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import type { ShuttlecockMovementSummary, ShuttlecockProductOption, ShuttlecockProductSummary } from '@/types/domain';

type ShuttlecockMovementType = 'IMPORT' | 'SALE' | 'PLAY_USAGE' | 'ADJUSTMENT' | 'OTHER';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function assertPositiveInteger(value: unknown, message: string): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next) || next <= 0) throw new Error(message);
  return next;
}

function assertNonNegativeInteger(value: unknown, message: string): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next) || next < 0) throw new Error(message);
  return next;
}

function assertPositiveMoney(value: unknown, message: string): number {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) throw new Error(message);
  return next;
}

function normalizeMovementType(value: string): ShuttlecockMovementType {
  if (['IMPORT', 'SALE', 'PLAY_USAGE', 'ADJUSTMENT', 'OTHER'].includes(value)) return value as ShuttlecockMovementType;
  throw new Error('Loại giao dịch kho không hợp lệ');
}

function movementTotalAmount(movement: {
  movement_type: string;
  quantity_ball: number;
  unit_price: unknown;
  cost_per_ball: unknown;
  usage_price_per_ball: unknown;
  shuttlecock_products?: { balls_per_tube: number } | null;
}): number {
  const quantityBall = Math.abs(movement.quantity_ball);
  const unitPrice = toNumber(movement.unit_price);
  if (movement.movement_type === 'SALE' || movement.movement_type === 'OTHER') {
    const ballsPerTube = movement.shuttlecock_products?.balls_per_tube ?? 1;
    return (quantityBall / ballsPerTube) * unitPrice;
  }
  if (movement.movement_type === 'IMPORT') return quantityBall * toNumber(movement.cost_per_ball);
  return quantityBall * toNumber(movement.usage_price_per_ball || movement.unit_price);
}

function mapProduct(row: {
  id: string;
  name: string;
  brand: string | null;
  balls_per_tube: number;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
  shuttlecock_inventory?: {
    quantity_ball: number;
    avg_cost_per_ball: unknown;
    avg_usage_price_per_ball: unknown;
  } | null;
  shuttlecock_movements?: {
    movement_type: string;
    quantity_ball: number;
    unit_price: unknown;
    cost_per_ball: unknown;
    usage_price_per_ball: unknown;
    shuttlecock_products?: { balls_per_tube: number } | null;
  }[];
}): ShuttlecockProductSummary {
  const quantityBall = row.shuttlecock_inventory?.quantity_ball ?? 0;
  const avgCostPerBall = toNumber(row.shuttlecock_inventory?.avg_cost_per_ball);
  const avgUsagePricePerBall = toNumber(row.shuttlecock_inventory?.avg_usage_price_per_ball);
  const movements = row.shuttlecock_movements ?? [];

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    ballsPerTube: row.balls_per_tube,
    status: row.status,
    quantityBall,
    avgCostPerBall,
    avgUsagePricePerBall,
    stockCostValue: quantityBall * avgCostPerBall,
    stockUsageValue: quantityBall * avgUsagePricePerBall,
    totalImportAmount: movements
      .filter((movement) => movement.movement_type === 'IMPORT')
      .reduce((total, movement) => total + movementTotalAmount({ ...movement, shuttlecock_products: { balls_per_tube: row.balls_per_tube } }), 0),
    totalSaleAmount: movements
      .filter((movement) => movement.movement_type === 'SALE')
      .reduce((total, movement) => total + movementTotalAmount({ ...movement, shuttlecock_products: { balls_per_tube: row.balls_per_tube } }), 0),
    totalUsageAmount: movements
      .filter((movement) => movement.movement_type === 'PLAY_USAGE')
      .reduce((total, movement) => total + movementTotalAmount({ ...movement, shuttlecock_products: { balls_per_tube: row.balls_per_tube } }), 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export async function listShuttlecockProducts(): Promise<ShuttlecockProductSummary[]> {
  const rows = await prisma.shuttlecock_products.findMany({
    include: { shuttlecock_inventory: true, shuttlecock_movements: true },
    orderBy: [{ created_at: 'desc' }]
  });

  return rows.map(mapProduct);
}

export async function listShuttlecockProductOptions(): Promise<ShuttlecockProductOption[]> {
  const rows = await prisma.shuttlecock_products.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      brand: true,
      shuttlecock_inventory: {
        select: {
          avg_usage_price_per_ball: true
        }
      }
    },
    orderBy: [{ name: 'asc' }]
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    avgUsagePricePerBall: toNumber(row.shuttlecock_inventory?.avg_usage_price_per_ball)
  }));
}

export async function createShuttlecockProduct(input: {
  name: string;
  brand?: string | null;
  ballsPerTube?: number;
  status?: string;
}): Promise<ShuttlecockProductSummary> {
  if (!input.name?.trim()) throw new AppError('Vui lòng nhập tên loại cầu.');
  if (Number(input.ballsPerTube ?? 12) < 1) throw new AppError('Số quả/ống phải lớn hơn 0.');

  const row = await prisma.shuttlecock_products.create({
    data: {
      name: input.name.trim(),
      brand: input.brand?.trim() || null,
      balls_per_tube: Math.max(1, Math.floor(Number(input.ballsPerTube ?? 12))),
      status: input.status || 'ACTIVE',
      shuttlecock_inventory: {
        create: {
          quantity_ball: 0,
          avg_cost_per_ball: 0,
          avg_usage_price_per_ball: 0
        }
      }
    },
    include: { shuttlecock_inventory: true, shuttlecock_movements: true }
  });

  return mapProduct(row);
}

export async function updateShuttlecockProduct(productId: string, input: {
  name?: string;
  brand?: string | null;
  ballsPerTube?: number;
  status?: string;
}): Promise<ShuttlecockProductSummary> {
  if (input.name !== undefined && !input.name.trim()) throw new AppError('Tên loại cầu không được bỏ trống.');
  if (input.ballsPerTube !== undefined && Number(input.ballsPerTube) < 1) throw new AppError('Số quả/ống phải lớn hơn 0.');

  if (input.ballsPerTube !== undefined) {
    const existing = await prisma.shuttlecock_products.findUnique({
      where: { id: productId },
      include: { shuttlecock_inventory: true, _count: { select: { shuttlecock_movements: true } } }
    });
    if (!existing) throw new Error('Không tìm thấy loại cầu');
    const nextBallsPerTube = Math.max(1, Math.floor(input.ballsPerTube));
    if (nextBallsPerTube !== existing.balls_per_tube && ((existing.shuttlecock_inventory?.quantity_ball ?? 0) > 0 || existing._count.shuttlecock_movements > 0)) {
      throw new Error('Không thể đổi số quả/ống khi loại cầu đã có tồn kho hoặc lịch sử nhập xuất');
    }
  }

  const row = await prisma.shuttlecock_products.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.brand !== undefined ? { brand: input.brand?.trim() || null } : {}),
      ...(input.ballsPerTube !== undefined ? { balls_per_tube: Math.max(1, Math.floor(input.ballsPerTube)) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date()
    },
    include: { shuttlecock_inventory: true, shuttlecock_movements: true }
  });
  return mapProduct(row);
}

export async function deleteShuttlecockProduct(productId: string): Promise<void> {
  const movements = await prisma.shuttlecock_movements.count({ where: { shuttlecock_product_id: productId } });
  if (movements > 0) throw new Error('Không thể xóa loại cầu đã có lịch sử nhập xuất');
  await prisma.$transaction([
    prisma.shuttlecock_inventory.deleteMany({ where: { shuttlecock_product_id: productId } }),
    prisma.shuttlecock_products.delete({ where: { id: productId } })
  ]);
}

export async function listShuttlecockMovements(): Promise<ShuttlecockMovementSummary[]> {
  const rows = await prisma.shuttlecock_movements.findMany({
    include: { shuttlecock_products: true },
    orderBy: [{ created_at: 'desc' }]
  });
  return rows.map((row) => ({
    id: row.id,
    productId: row.shuttlecock_product_id,
    productName: row.shuttlecock_products.name,
    ballsPerTube: row.shuttlecock_products.balls_per_tube,
    movementType: row.movement_type,
    quantityBall: row.quantity_ball,
    costPerBall: toNumber(row.cost_per_ball),
    usagePricePerBall: toNumber(row.usage_price_per_ball),
    unitPrice: toNumber(row.unit_price),
    totalAmount: movementTotalAmount(row),
    title: row.title,
    note: row.note,
    createdAt: toIso(row.created_at)
  }));
}

export async function createShuttlecockMovement(input: {
  productId: string;
  movementType: string;
  title?: string | null;
  quantityTube?: number;
  quantityBall?: number;
  actualQuantityBall?: number;
  costPricePerTube?: number;
  usagePricePerTube?: number;
  salePricePerTube?: number;
  note?: string | null;
}): Promise<void> {
  const movementType = normalizeMovementType(input.movementType);
  if (!input.title?.trim()) throw new AppError('Vui lòng nhập tiêu đề phiếu kho.');

  await prisma.$transaction(async (tx) => {
    const product = await tx.shuttlecock_products.findUnique({
      where: { id: input.productId },
      include: { shuttlecock_inventory: true }
    });
    if (!product) throw new Error('Không tìm thấy loại cầu');

    const inventory = product.shuttlecock_inventory ?? await tx.shuttlecock_inventory.create({
      data: {
        shuttlecock_product_id: product.id,
        quantity_ball: 0,
        avg_cost_per_ball: 0,
        avg_usage_price_per_ball: 0
      }
    });

    const oldQuantity = inventory.quantity_ball;
    const oldAvgCost = toNumber(inventory.avg_cost_per_ball);
    const oldAvgUsagePrice = toNumber(inventory.avg_usage_price_per_ball);
    const ballsPerTube = product.balls_per_tube;
    const now = new Date();

    let quantityBall = 0;
    let nextQuantity = oldQuantity;
    let nextAvgCost = oldAvgCost;
    let nextAvgUsagePrice = oldAvgUsagePrice;
    let costPerBall = oldAvgCost;
    let usagePricePerBall = oldAvgUsagePrice;
    let unitPrice = oldAvgUsagePrice;
    let title = input.title?.trim() || '';

    if (movementType === 'IMPORT') {
      const quantityTube = assertPositiveInteger(input.quantityTube, 'Vui lòng nhập số ống cầu nhập kho');
      const costPricePerTube = assertPositiveMoney(input.costPricePerTube, 'Vui lòng nhập giá vốn nhập/ống');
      const usagePricePerTube = assertPositiveMoney(input.usagePricePerTube, 'Vui lòng nhập giá đề xuất/ống');
      quantityBall = quantityTube * ballsPerTube;
      costPerBall = costPricePerTube / ballsPerTube;
      usagePricePerBall = usagePricePerTube / ballsPerTube;
      nextQuantity = oldQuantity + quantityBall;
      nextAvgCost = ((oldQuantity * oldAvgCost) + (quantityBall * costPerBall)) / nextQuantity;
      nextAvgUsagePrice = ((oldQuantity * oldAvgUsagePrice) + (quantityBall * usagePricePerBall)) / nextQuantity;
      unitPrice = costPerBall;
      title = title || `Nhập kho ${quantityTube} ống ${product.name}`;
    }

    if (movementType === 'SALE') {
      const quantityTube = assertPositiveInteger(input.quantityTube, 'Vui lòng nhập số ống bán');
      const salePricePerTube = assertPositiveMoney(input.salePricePerTube, 'Vui lòng nhập giá bán/ống');
      quantityBall = -(quantityTube * ballsPerTube);
      if (oldQuantity < Math.abs(quantityBall)) throw new Error(`Kho cầu không đủ. Còn ${oldQuantity} quả, cần ${Math.abs(quantityBall)} quả`);
      usagePricePerBall = salePricePerTube / ballsPerTube;
      unitPrice = salePricePerTube;
      nextQuantity = oldQuantity + quantityBall;
      title = title || `Bán cầu ${quantityTube} ống ${product.name}`;
    }

    if (movementType === 'PLAY_USAGE') {
      const usedBalls = assertPositiveInteger(input.quantityBall, 'Vui lòng nhập số cầu hao');
      quantityBall = -usedBalls;
      if (oldQuantity < usedBalls) throw new Error(`Kho cầu không đủ. Còn ${oldQuantity} quả, cần ${usedBalls} quả`);
      unitPrice = oldAvgUsagePrice;
      nextQuantity = oldQuantity - usedBalls;
      title = title || `Xuất cầu hao ${usedBalls} quả`;
    }

    if (movementType === 'ADJUSTMENT') {
      const actualQuantityBall = assertNonNegativeInteger(input.actualQuantityBall, 'Vui lòng nhập tồn thực tế');
      quantityBall = actualQuantityBall - oldQuantity;
      if (quantityBall === 0) return;
      unitPrice = oldAvgUsagePrice;
      nextQuantity = actualQuantityBall;
      title = title || `Điều chỉnh tồn kho | ${now.toLocaleDateString('vi-VN')}`;
    }

    if (movementType === 'OTHER') {
      const quantityTube = Math.max(0, Math.floor(Number(input.quantityTube ?? 0)));
      const looseBalls = Math.max(0, Math.floor(Number(input.quantityBall ?? 0)));
      const outputBalls = quantityTube * ballsPerTube + looseBalls;
      if (outputBalls <= 0) throw new Error('Vui lòng nhập số lượng xuất ngoại lệ');
      const salePricePerTube = assertPositiveMoney(input.salePricePerTube, 'Vui lòng nhập đơn giá/ống cho nghiệp vụ ngoại lệ');
      quantityBall = -outputBalls;
      if (oldQuantity < outputBalls) throw new Error(`Kho cầu không đủ. Còn ${oldQuantity} quả, cần ${outputBalls} quả`);
      usagePricePerBall = salePricePerTube / ballsPerTube;
      unitPrice = salePricePerTube;
      nextQuantity = oldQuantity - outputBalls;
      title = title || `Xuất kho ngoại lệ ${product.name}`;
    }

    await tx.shuttlecock_movements.create({
      data: {
        shuttlecock_product_id: input.productId,
        movement_type: movementType,
        quantity_ball: quantityBall,
        cost_per_ball: costPerBall,
        usage_price_per_ball: usagePricePerBall,
        unit_price: unitPrice,
        title,
        note: input.note?.trim() || null
      }
    });

    await tx.shuttlecock_inventory.update({
      where: { shuttlecock_product_id: input.productId },
      data: {
        quantity_ball: nextQuantity,
        avg_cost_per_ball: nextAvgCost,
        avg_usage_price_per_ball: nextAvgUsagePrice,
        updated_at: now
      }
    });
  });
}
