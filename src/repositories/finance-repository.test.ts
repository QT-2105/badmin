import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
  updateSession: vi.fn(),
  findSession: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session_transactions: {
      findMany: mocks.findMany,
      create: mocks.create
    },
    play_sessions: { update: mocks.updateSession, findUnique: mocks.findSession }
  }
}));

import {
  createSessionTransaction,
  listSessionTransactions
} from './finance-repository';

function transactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'transaction-1',
    session_id: null,
    transaction_type: 'INCOME',
    adjustment_type: 'NORMAL',
    category: 'OTHER',
    title: 'Thu khác',
    quantity: 2,
    unit_price: 50000,
    total_amount: 100000,
    note: null,
    created_at: new Date('2099-01-01T00:00:00.000Z'),
    ...overrides
  };
}

describe('finance repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSession.mockResolvedValue({ id: 'session-1' });
  });

  it('lists transactions with optional session and date-range filters', async () => {
    const from = new Date('2099-01-01T00:00:00.000Z');
    const to = new Date('2099-02-01T00:00:00.000Z');
    mocks.findMany.mockResolvedValue([transactionRow()]);

    await expect(listSessionTransactions({ sessionId: 'session-1', from, to })).resolves.toEqual([
      expect.objectContaining({
        id: 'transaction-1', sessionId: null, adjustmentType: 'NORMAL', totalAmount: 100000
      })
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_id: 'session-1',
        created_at: { gte: from, lt: to }
      },
      orderBy: [{ created_at: 'desc' }]
    });
  });

  it('rejects invalid type, adjustment, required text, quantity, and money', async () => {
    const base = { transactionType: 'INCOME', category: 'OTHER', title: 'Phiếu' };
    await expect(createSessionTransaction({ ...base, transactionType: 'INVALID' })).rejects.toMatchObject({
      message: 'Loại thu chi không hợp lệ.'
    });
    await expect(createSessionTransaction({ ...base, adjustmentType: 'INVALID' })).rejects.toMatchObject({
      message: 'Kiểu ghi nhận không hợp lệ.'
    });
    await expect(createSessionTransaction({ ...base, title: ' ' })).rejects.toMatchObject({
      message: 'Vui lòng nhập tiêu đề phiếu thu chi.'
    });
    await expect(createSessionTransaction({ ...base, quantity: 0 })).rejects.toMatchObject({
      message: 'Số lượng phải lớn hơn 0.'
    });
    await expect(createSessionTransaction({ ...base, unitPrice: -1 })).rejects.toMatchObject({
      message: 'Đơn giá không được âm.'
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a manual transaction without requiring or refreshing a session', async () => {
    mocks.create.mockImplementation(async ({ data }) => transactionRow(data));

    const result = await createSessionTransaction({
      transactionType: 'INCOME',
      category: 'OTHER',
      title: '  Thu tài trợ  ',
      quantity: 2,
      unitPrice: 75000,
      note: '  ghi chú  '
    });

    expect(result).toMatchObject({ sessionId: null, title: 'Thu tài trợ', totalAmount: 150000 });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_id: null,
        transaction_type: 'INCOME',
        adjustment_type: 'NORMAL',
        category: 'OTHER',
        title: 'Thu tài trợ',
        quantity: 2,
        unit_price: 75000,
        total_amount: 150000,
        note: 'ghi chú'
      }
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it('rejects a session transaction when the session is outside the current tenant', async () => {
    mocks.findSession.mockResolvedValue(null);

    await expect(createSessionTransaction({
      sessionId: 'foreign-session',
      transactionType: 'EXPENSE',
      category: 'OTHER',
      title: 'Không được tạo',
      totalAmount: 1000
    })).rejects.toMatchObject({ message: 'Không tìm thấy ca chơi.', status: 404 });
    expect(mocks.findSession).toHaveBeenCalledWith({
      where: { id: 'foreign-session', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      select: { id: true }
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('refreshes session totals using NORMAL and DEDUCTION rows', async () => {
    mocks.create.mockImplementation(async ({ data }) => transactionRow({
      ...data,
      id: 'transaction-new'
    }));
    mocks.findMany.mockResolvedValue([
      transactionRow({ transaction_type: 'INCOME', adjustment_type: 'NORMAL', total_amount: 500000 }),
      transactionRow({ transaction_type: 'INCOME', adjustment_type: 'DEDUCTION', total_amount: 50000 }),
      transactionRow({ transaction_type: 'EXPENSE', adjustment_type: 'NORMAL', total_amount: 200000 }),
      transactionRow({ transaction_type: 'EXPENSE', adjustment_type: 'DEDUCTION', total_amount: 25000 })
    ]);
    mocks.updateSession.mockResolvedValue({});

    await createSessionTransaction({
      sessionId: 'session-1',
      transactionType: 'EXPENSE',
      adjustmentType: 'DEDUCTION',
      category: 'OTHER',
      title: 'Giảm chi',
      totalAmount: 25000
    });

    expect(mocks.updateSession).toHaveBeenCalledWith({
      where: { id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: {
        total_income: 450000,
        total_expense: 175000,
        total_profit: 275000,
        updated_at: expect.any(Date)
      }
    });
  });
});
