import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productFindUnique: vi.fn(),
  productCreate: vi.fn(),
  inventoryCreate: vi.fn(),
  inventoryUpdate: vi.fn(),
  movementCreate: vi.fn(),
  movementFindMany: vi.fn(),
  movementCount: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    shuttlecock_products: {
      findMany: mocks.productFindMany,
      findUnique: mocks.productFindUnique,
      create: mocks.productCreate
    },
    shuttlecock_movements: {
      findMany: mocks.movementFindMany,
      count: mocks.movementCount
    },
    $transaction: mocks.transaction
  }
}));

import {
  createShuttlecockProduct,
  createShuttlecockMovement,
  listShuttlecockMovements,
  listShuttlecockProducts
} from './inventory-repository';

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    name: 'Cầu A',
    brand: 'Brand',
    balls_per_tube: 12,
    status: 'ACTIVE',
    created_at: new Date('2099-01-01T00:00:00.000Z'),
    updated_at: null,
    shuttlecock_inventory: {
      quantity_ball: 12,
      avg_cost_per_ball: 10000,
      avg_usage_price_per_ball: 20000
    },
    shuttlecock_movements: [],
    ...overrides
  };
}

describe('inventory repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockResolvedValue([{ id: 'product-1' }]);
    mocks.transaction.mockImplementation(async (callback) => callback({
      $queryRaw: mocks.queryRaw,
      shuttlecock_products: { findUnique: mocks.productFindUnique },
      shuttlecock_inventory: {
        create: mocks.inventoryCreate,
        update: mocks.inventoryUpdate
      },
      shuttlecock_movements: { create: mocks.movementCreate }
    }));
  });

  it('reconciles product stock values and movement totals using each movement formula', async () => {
    mocks.productFindMany.mockResolvedValue([product({
      shuttlecock_inventory: {
        quantity_ball: 9,
        avg_cost_per_ball: 10000,
        avg_usage_price_per_ball: 15000
      },
      shuttlecock_movements: [
        { movement_type: 'IMPORT', quantity_ball: 24, unit_price: 10000, cost_per_ball: 10000, usage_price_per_ball: 15000 },
        { movement_type: 'SALE', quantity_ball: -12, unit_price: 240000, cost_per_ball: 10000, usage_price_per_ball: 20000 },
        { movement_type: 'PLAY_USAGE', quantity_ball: -3, unit_price: 15000, cost_per_ball: 10000, usage_price_per_ball: 15000 }
      ]
    })]);

    await expect(listShuttlecockProducts()).resolves.toEqual([
      expect.objectContaining({
        quantityBall: 9,
        stockCostValue: 90000,
        stockUsageValue: 135000,
        totalImportAmount: 240000,
        totalSaleAmount: 240000,
        totalUsageAmount: 45000
      })
    ]);
  });

  it('maps movement history totals without changing signed stock quantity', async () => {
    mocks.movementFindMany.mockResolvedValue([{
      id: 'movement-1',
      shuttlecock_product_id: 'product-1',
      movement_type: 'SALE',
      quantity_ball: -12,
      cost_per_ball: 10000,
      usage_price_per_ball: 20000,
      unit_price: 240000,
      title: 'Bán một ống',
      note: null,
      created_at: new Date('2099-01-01T00:00:00.000Z'),
      shuttlecock_products: { name: 'Cầu A', balls_per_tube: 12 }
    }]);

    await expect(listShuttlecockMovements()).resolves.toEqual([
      expect.objectContaining({ quantityBall: -12, totalAmount: 240000, ballsPerTube: 12 })
    ]);
  });

  it('writes Legacy Club ID to a new product and its nested inventory row', async () => {
    mocks.productCreate.mockImplementation(async ({ data }) => product({
      name: data.name,
      shuttlecock_inventory: data.shuttlecock_inventory.create
    }));

    await createShuttlecockProduct({ name: ' Cầu mới ' });

    expect(mocks.productCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        shuttlecock_inventory: {
          create: expect.objectContaining({
            quantity_ball: 0
          })
        }
      })
    }));
  });

  it('writes Legacy Club ID when a movement must recreate a missing inventory row', async () => {
    mocks.productFindUnique.mockResolvedValue(product({ shuttlecock_inventory: null }));
    mocks.inventoryCreate.mockResolvedValue({
      quantity_ball: 0,
      avg_cost_per_ball: 0,
      avg_usage_price_per_ball: 0
    });
    mocks.movementCreate.mockResolvedValue({});
    mocks.inventoryUpdate.mockResolvedValue({});

    await createShuttlecockMovement({
      productId: 'product-1',
      movementType: 'IMPORT',
      title: 'Nhập mới',
      quantityTube: 1,
      costPricePerTube: 120000,
      usagePricePerTube: 240000
    });

    expect(mocks.inventoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
      })
    });
  });

  it('requires a valid movement type and title before opening a transaction', async () => {
    await expect(createShuttlecockMovement({
      productId: 'product-1', movementType: 'INVALID', title: 'Phiếu'
    })).rejects.toThrow('Loại giao dịch kho không hợp lệ');
    await expect(createShuttlecockMovement({
      productId: 'product-1', movementType: 'IMPORT', title: ' '
    })).rejects.toMatchObject({ message: 'Vui lòng nhập tiêu đề phiếu kho.' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('imports stock with weighted average cost and usage price in the movement transaction', async () => {
    mocks.productFindUnique.mockResolvedValue(product());
    mocks.movementCreate.mockResolvedValue({});
    mocks.inventoryUpdate.mockResolvedValue({});

    await createShuttlecockMovement({
      productId: 'product-1',
      movementType: 'IMPORT',
      title: '  Nhập bổ sung  ',
      quantityTube: 1,
      costPricePerTube: 240000,
      usagePricePerTube: 360000
    });

    expect(mocks.movementCreate).toHaveBeenCalledWith({
      data: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        shuttlecock_product_id: 'product-1',
        movement_type: 'IMPORT',
        quantity_ball: 12,
        cost_per_ball: 20000,
        usage_price_per_ball: 30000,
        unit_price: 20000,
        title: 'Nhập bổ sung',
        note: null
      }
    });
    expect(mocks.inventoryUpdate).toHaveBeenCalledWith({
      where: {
        club_id_shuttlecock_product_id: {
          shuttlecock_product_id: 'product-1',
          club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
        }
      },
      data: {
        quantity_ball: 24,
        avg_cost_per_ball: 15000,
        avg_usage_price_per_ball: 25000,
        updated_at: expect.any(Date)
      }
    });
  });

  it('records PLAY_USAGE as a negative movement and decrements stock', async () => {
    mocks.productFindUnique.mockResolvedValue(product());
    mocks.movementCreate.mockResolvedValue({});
    mocks.inventoryUpdate.mockResolvedValue({});

    await createShuttlecockMovement({
      productId: 'product-1', movementType: 'PLAY_USAGE', title: 'Cầu hao', quantityBall: 3
    });

    expect(mocks.movementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        movement_type: 'PLAY_USAGE', quantity_ball: -3, unit_price: 20000
      })
    });
    expect(mocks.inventoryUpdate).toHaveBeenCalledWith({
      where: {
        club_id_shuttlecock_product_id: {
          shuttlecock_product_id: 'product-1',
          club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
        }
      },
      data: expect.objectContaining({ quantity_ball: 9 })
    });
  });

  it('rejects stock outputs that would make inventory negative without writing a movement', async () => {
    mocks.productFindUnique.mockResolvedValue(product());

    await expect(createShuttlecockMovement({
      productId: 'product-1',
      movementType: 'SALE',
      title: 'Bán hai ống',
      quantityTube: 2,
      salePricePerTube: 240000
    })).rejects.toThrow('Kho cầu không đủ. Còn 12 quả, cần 24 quả');
    expect(mocks.movementCreate).not.toHaveBeenCalled();
    expect(mocks.inventoryUpdate).not.toHaveBeenCalled();
  });

  it('does not create a movement for a zero-difference stock adjustment', async () => {
    mocks.productFindUnique.mockResolvedValue(product());

    await expect(createShuttlecockMovement({
      productId: 'product-1',
      movementType: 'ADJUSTMENT',
      title: 'Kiểm kho',
      actualQuantityBall: 12
    })).resolves.toBeUndefined();
    expect(mocks.movementCreate).not.toHaveBeenCalled();
    expect(mocks.inventoryUpdate).not.toHaveBeenCalled();
  });
});
