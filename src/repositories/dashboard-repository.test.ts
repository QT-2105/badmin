import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  playDateCount: vi.fn(),
  sessionCount: vi.fn(),
  sessionFindMany: vi.fn(),
  playerCount: vi.fn(),
  playerAggregate: vi.fn(),
  transactionFindMany: vi.fn(),
  productCount: vi.fn(),
  inventoryFindMany: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    play_dates: { count: mocks.playDateCount },
    play_sessions: { count: mocks.sessionCount, findMany: mocks.sessionFindMany },
    session_players: { count: mocks.playerCount, aggregate: mocks.playerAggregate },
    session_transactions: { findMany: mocks.transactionFindMany },
    shuttlecock_products: { count: mocks.productCount },
    shuttlecock_inventory: { findMany: mocks.inventoryFindMany }
  }
}));

import { getDashboardSummary } from './dashboard-repository';

const CLUB_ID = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';

describe('dashboard repository tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.playDateCount.mockResolvedValue(0);
    mocks.sessionCount.mockResolvedValue(0);
    mocks.sessionFindMany.mockResolvedValue([]);
    mocks.playerCount.mockResolvedValue(0);
    mocks.playerAggregate.mockResolvedValue({ _sum: { payment_amount: null } });
    mocks.transactionFindMany.mockResolvedValue([]);
    mocks.productCount.mockResolvedValue(0);
    mocks.inventoryFindMany.mockResolvedValue([]);
  });

  it('scopes every count, aggregate, recent query and summary to the server-owned club', async () => {
    await expect(getDashboardSummary({ period: 'MONTH', month: '2099-01' })).resolves.toMatchObject({
      playDates: 0,
      sessions: 0,
      totalIncome: 0,
      totalExpense: 0
    });

    expect(mocks.playDateCount).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ club_id: CLUB_ID })
    }));
    for (const [input] of mocks.sessionCount.mock.calls) {
      expect(input.where.club_id).toBe(CLUB_ID);
    }
    expect(mocks.playerCount).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ club_id: CLUB_ID })
    }));
    expect(mocks.playerAggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ club_id: CLUB_ID })
    }));
    expect(mocks.transactionFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ club_id: CLUB_ID })
    }));
    expect(mocks.productCount).toHaveBeenCalledWith({ where: { club_id: CLUB_ID } });
    expect(mocks.inventoryFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { club_id: CLUB_ID } }));
    for (const [input] of mocks.sessionFindMany.mock.calls) {
      expect(input.where.club_id).toBe(CLUB_ID);
    }
  });
});
