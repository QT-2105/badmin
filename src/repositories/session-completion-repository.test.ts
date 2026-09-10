import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getPlaySession: vi.fn(),
  queryRaw: vi.fn(),
  sessionFindUnique: vi.fn(),
  sessionUpdateMany: vi.fn(),
  sessionUpdate: vi.fn(),
  productFindUnique: vi.fn(),
  transactionsCreateMany: vi.fn(),
  movementCreate: vi.fn(),
  inventoryUpsert: vi.fn(),
  playersUpdateMany: vi.fn(),
  courtsUpdateMany: vi.fn(),
  matchesDeleteMany: vi.fn(),
  summaryFindFirst: vi.fn(),
  summaryUpdate: vi.fn(),
  summaryCreate: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction }
}));
vi.mock('@/repositories/play-sessions-repository', () => ({
  getPlaySession: mocks.getPlaySession
}));

import { completePlaySession } from './session-completion-repository';

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    name: 'Ca tối',
    status: 'LIVE',
    start_time: new Date('1970-01-01T18:00:00.000Z'),
    end_time: new Date('1970-01-01T21:00:00.000Z'),
    court_count: 3,
    session_players: [
      { payment_status: 'PAID', payment_amount: 200000, discount: 20000 },
      { payment_status: 'PAID', payment_amount: 100000, discount: 0 },
      { payment_status: 'UNPAID', payment_amount: 300000, discount: 0 }
    ],
    play_dates: { play_date: new Date('2099-01-01T00:00:00.000Z') },
    runtime_courts: [],
    ...overrides
  };
}

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    name: 'Cầu A',
    shuttlecock_inventory: {
      quantity_ball: 20,
      avg_cost_per_ball: 15000,
      avg_usage_price_per_ball: 25000
    },
    ...overrides
  };
}

function completionInput(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'session-1',
    courtCost: 500000,
    shuttlecockProductId: 'product-1',
    shuttlecockPiecesUsed: 4,
    extraExpenseTitle: 'Nước uống',
    extraExpenseAmount: 50000,
    note: '  Đã chốt ca  ',
    ...overrides
  };
}

function txClient() {
  return {
    $queryRaw: mocks.queryRaw,
    play_sessions: {
      findUnique: mocks.sessionFindUnique,
      updateMany: mocks.sessionUpdateMany,
      update: mocks.sessionUpdate
    },
    shuttlecock_products: { findUnique: mocks.productFindUnique },
    session_transactions: { createMany: mocks.transactionsCreateMany },
    shuttlecock_movements: { create: mocks.movementCreate },
    shuttlecock_inventory: { upsert: mocks.inventoryUpsert },
    session_players: { updateMany: mocks.playersUpdateMany },
    runtime_courts: { updateMany: mocks.courtsUpdateMany },
    runtime_matches: { deleteMany: mocks.matchesDeleteMany },
    session_summaries: {
      findFirst: mocks.summaryFindFirst,
      update: mocks.summaryUpdate,
      create: mocks.summaryCreate
    }
  };
}

describe('session completion repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback(txClient()));
    mocks.queryRaw.mockResolvedValue([{ id: 'product-1' }]);
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.sessionFindUnique.mockResolvedValue(sessionRow());
    mocks.productFindUnique.mockResolvedValue(productRow());
    mocks.summaryFindFirst.mockResolvedValue(null);
    mocks.getPlaySession.mockResolvedValue({ id: 'session-1', status: 'COMPLETED' });
  });

  it('validates court, product, usage, and extra-expense inputs before a transaction', async () => {
    await expect(completePlaySession(completionInput({ courtCost: 0 }))).rejects.toThrow('Vui lòng nhập chi phí sân');
    await expect(completePlaySession(completionInput({ shuttlecockProductId: '' }))).rejects.toThrow('Vui lòng chọn loại cầu hao');
    await expect(completePlaySession(completionInput({ shuttlecockPiecesUsed: 0 }))).rejects.toThrow('Vui lòng nhập số lượng cầu hao');
    await expect(completePlaySession(completionInput({ extraExpenseTitle: ' ', extraExpenseAmount: 1 }))).rejects.toThrow(
      'Vui lòng nhập nội dung chi phí phát sinh'
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('allows completion only for LIVE sessions with no READY or PLAYING courts', async () => {
    mocks.sessionUpdateMany.mockResolvedValueOnce({ count: 0 });
    mocks.sessionFindUnique.mockResolvedValueOnce(sessionRow({ status: 'FINISHED' }));
    await expect(completePlaySession(completionInput())).rejects.toThrow('Ca chơi đã hoàn tất');

    mocks.sessionUpdateMany.mockResolvedValueOnce({ count: 0 });
    mocks.sessionFindUnique.mockResolvedValueOnce(sessionRow({ status: 'NOT_STARTED' }));
    await expect(completePlaySession(completionInput())).rejects.toThrow('Chỉ có thể hoàn tất ca đang hoạt động');

    mocks.sessionUpdateMany.mockResolvedValueOnce({ count: 1 });
    mocks.sessionFindUnique.mockResolvedValueOnce(sessionRow({
      runtime_courts: [
        { court_number: 2, status: 'READY' },
        { court_number: 1, status: 'PLAYING' }
      ]
    }));
    await expect(completePlaySession(completionInput())).rejects.toThrow(
      'Chưa thể hoàn tất ca: Sân 1 đang thi đấu, Sân 2 đang chờ bắt đầu.'
    );
    expect(mocks.transactionsCreateMany).not.toHaveBeenCalled();
  });

  it('claims LIVE exactly once before any finance or inventory write', async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 0 });
    mocks.sessionFindUnique.mockResolvedValue(sessionRow({ status: 'FINISHED' }));

    await expect(completePlaySession(completionInput())).rejects.toThrow('Ca chơi đã hoàn tất');

    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        status: 'LIVE'
      },
      data: { runtime_version: { increment: 1 }, updated_at: expect.any(Date) }
    });
    expect(mocks.transactionsCreateMany).not.toHaveBeenCalled();
    expect(mocks.movementCreate).not.toHaveBeenCalled();
    expect(mocks.inventoryUpsert).not.toHaveBeenCalled();
  });

  it('rejects insufficient stock or missing average usage price before any completion writes', async () => {
    mocks.productFindUnique.mockResolvedValueOnce(productRow({
      shuttlecock_inventory: {
        quantity_ball: 3,
        avg_cost_per_ball: 15000,
        avg_usage_price_per_ball: 25000
      }
    }));
    await expect(completePlaySession(completionInput())).rejects.toThrow('Kho cầu không đủ. Còn 3 quả, cần 4 quả');

    mocks.productFindUnique.mockResolvedValueOnce(productRow({
      shuttlecock_inventory: {
        quantity_ball: 20,
        avg_cost_per_ball: 15000,
        avg_usage_price_per_ball: 0
      }
    }));
    await expect(completePlaySession(completionInput())).rejects.toThrow(
      'Loại cầu chưa có giá cầu hao bình quân. Vui lòng nhập kho cầu trước khi hoàn tất ca'
    );
    expect(mocks.transactionsCreateMany).not.toHaveBeenCalled();
    expect(mocks.movementCreate).not.toHaveBeenCalled();
  });

  it('calculates paid slot income and profit independently from optional extra voucher creation', async () => {
    await completePlaySession(completionInput());

    const transactions = mocks.transactionsCreateMany.mock.calls[0][0].data as Array<{
      category: string;
      [key: string]: unknown;
    }>;
    expect(transactions.map((row) => row.category)).toEqual([
      'SESSION_FEE', 'COURT_FEE', 'SHUTTLECOCK_USAGE'
    ]);
    expect(transactions.every((row) => row.club_id === 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f')).toBe(true);
    expect(transactions[0]).toMatchObject({
      transaction_type: 'INCOME', unit_price: 280000, total_amount: 280000
    });
    expect(transactions[2]).toMatchObject({
      quantity: 4, unit_price: 25000, total_amount: 100000
    });
    expect(mocks.sessionUpdate).toHaveBeenCalledWith({
      where: { id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: expect.objectContaining({
        status: 'FINISHED',
        court_cost: 500000,
        shuttlecock_pieces_used: 4,
        extra_expense_title: 'Nước uống',
        extra_expense_amount: 50000,
        note: 'Đã chốt ca',
        total_income: 280000,
        total_expense: 650000,
        total_profit: -370000
      })
    });
  });

  it('respects voucher switches while always retaining real completion expenses', async () => {
    await completePlaySession(completionInput({
      autoCreateCourtFeeTransaction: false,
      autoCreateShuttlecockUsageTransaction: false,
      autoCreateExtraExpenseTransaction: true
    }));

    const transactions = mocks.transactionsCreateMany.mock.calls[0][0].data as Array<{
      category: string;
      [key: string]: unknown;
    }>;
    expect(transactions.map((row) => row.category)).toEqual(['SESSION_FEE', 'OTHER']);
    expect(transactions[1]).toMatchObject({
      title: 'Nước uống', total_amount: 50000
    });
    expect(mocks.sessionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ total_expense: 650000, total_profit: -370000 })
    }));
  });

  it('creates PLAY_USAGE movement, decrements stock, finalizes runtime, and creates summary atomically', async () => {
    await expect(completePlaySession(completionInput())).resolves.toMatchObject({
      id: 'session-1', status: 'COMPLETED'
    });

    expect(mocks.movementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        shuttlecock_product_id: 'product-1',
        movement_type: 'PLAY_USAGE',
        quantity_ball: -4,
        cost_per_ball: 15000,
        usage_price_per_ball: 25000,
        unit_price: 25000
      })
    });
    expect(mocks.inventoryUpsert).toHaveBeenCalledWith({
      where: {
        club_id_shuttlecock_product_id: {
          shuttlecock_product_id: 'product-1',
          club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
        }
      },
      create: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        quantity_ball: 16
      }),
      update: expect.objectContaining({ quantity_ball: 16 })
    });
    expect(mocks.playersUpdateMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: { runtime_status: 'FINISHED' }
    });
    expect(mocks.courtsUpdateMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: expect.objectContaining({ status: 'EMPTY', runtime_match_id: null, started_at: null })
    });
    expect(mocks.matchesDeleteMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.summaryCreate).toHaveBeenCalledWith({
      data: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_id: 'session-1',
        total_players: 3,
        total_income: 280000,
        total_expense: 650000,
        total_profit: -370000
      }
    });
    expect(mocks.getPlaySession).toHaveBeenCalledWith('session-1');
  });
});
