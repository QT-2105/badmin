import { beforeEach, describe, expect, it, vi } from 'vitest';

type Release = () => void;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function mutex() {
  let tail = Promise.resolve();
  return async (): Promise<Release> => {
    const previous = tail;
    const next = deferred();
    tail = next.promise;
    await previous;
    return next.resolve;
  };
}

const harness = vi.hoisted(() => ({
  transaction: vi.fn(),
  getPlaySession: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: harness.transaction }
}));

vi.mock('@/repositories/play-sessions-repository', () => ({
  getPlaySession: harness.getPlaySession
}));

import { createShuttlecockMovement } from './inventory-repository';
import { completePlaySession } from './session-completion-repository';

function completionInput() {
  return {
    sessionId: 'session-1',
    courtCost: 500000,
    shuttlecockProductId: 'product-1',
    shuttlecockPiecesUsed: 4
  };
}

describe('completion and inventory concurrency hardening', () => {
  let state: {
    sessionStatus: string;
    runtimeVersion: number;
    stock: number;
    movements: Array<Record<string, unknown>>;
    transactionBatches: Array<Array<Record<string, unknown>>>;
  };
  let acquireSession: ReturnType<typeof mutex>;
  let acquireProduct: ReturnType<typeof mutex>;
  let holdFirstSessionClaim: ReturnType<typeof deferred> | null;
  let firstSessionClaimed: ReturnType<typeof deferred> | null;
  let holdFirstProductLock: ReturnType<typeof deferred> | null;
  let firstProductLocked: ReturnType<typeof deferred> | null;

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      sessionStatus: 'LIVE',
      runtimeVersion: 0,
      stock: 20,
      movements: [],
      transactionBatches: []
    };
    acquireSession = mutex();
    acquireProduct = mutex();
    holdFirstSessionClaim = null;
    firstSessionClaimed = null;
    holdFirstProductLock = null;
    firstProductLocked = null;
    harness.getPlaySession.mockResolvedValue({ id: 'session-1', status: 'COMPLETED' });
    harness.transaction.mockImplementation(async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const releases: Release[] = [];
      const tx = {
        $queryRaw: async () => {
          const release = await acquireProduct();
          releases.push(release);
          if (firstProductLocked) {
            const signal = firstProductLocked;
            firstProductLocked = null;
            signal.resolve();
            await holdFirstProductLock?.promise;
          }
          return [{ id: 'product-1' }];
        },
        play_sessions: {
          updateMany: async () => {
            const release = await acquireSession();
            releases.push(release);
            if (firstSessionClaimed) {
              const signal = firstSessionClaimed;
              firstSessionClaimed = null;
              signal.resolve();
              await holdFirstSessionClaim?.promise;
            }
            if (state.sessionStatus !== 'LIVE') return { count: 0 };
            state.runtimeVersion += 1;
            return { count: 1 };
          },
          findUnique: async () => ({
            id: 'session-1',
            name: 'Ca tối',
            status: state.sessionStatus,
            start_time: new Date('1970-01-01T18:00:00.000Z'),
            end_time: new Date('1970-01-01T21:00:00.000Z'),
            court_count: 2,
            session_players: [{ payment_status: 'PAID', payment_amount: 100000, discount: 0 }],
            play_dates: { play_date: new Date('2099-01-01T00:00:00.000Z') },
            runtime_courts: []
          }),
          update: async ({ data }: { data: { status?: string } }) => {
            if (data.status) state.sessionStatus = data.status;
            return {};
          }
        },
        shuttlecock_products: {
          findUnique: async () => ({
            id: 'product-1',
            name: 'Cầu A',
            balls_per_tube: 12,
            shuttlecock_inventory: {
              quantity_ball: state.stock,
              avg_cost_per_ball: 10000,
              avg_usage_price_per_ball: 20000
            }
          })
        },
        shuttlecock_inventory: {
          create: async () => ({ quantity_ball: 0, avg_cost_per_ball: 0, avg_usage_price_per_ball: 0 }),
          update: async ({ data }: { data: { quantity_ball: number } }) => {
            state.stock = data.quantity_ball;
            return {};
          },
          upsert: async ({ update }: { update: { quantity_ball: number } }) => {
            state.stock = update.quantity_ball;
            return {};
          }
        },
        shuttlecock_movements: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            state.movements.push(data);
            return {};
          }
        },
        session_transactions: {
          createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
            state.transactionBatches.push(data);
            return { count: data.length };
          }
        },
        session_players: { updateMany: async () => ({ count: 1 }) },
        runtime_courts: { updateMany: async () => ({ count: 0 }) },
        runtime_matches: { deleteMany: async () => ({ count: 0 }) },
        session_summaries: {
          findFirst: async () => null,
          create: async () => ({}),
          update: async () => ({})
        }
      };

      try {
        return await callback(tx);
      } finally {
        releases.reverse().forEach((release) => release());
      }
    });
  });

  it('allows only one of two simultaneous completion attempts to create side effects', async () => {
    holdFirstSessionClaim = deferred();
    firstSessionClaimed = deferred();
    const first = completePlaySession(completionInput());
    await firstSessionClaimed.promise;
    const second = completePlaySession(completionInput());
    holdFirstSessionClaim.resolve();

    const results = await Promise.allSettled([first, second]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(state.sessionStatus).toBe('FINISHED');
    expect(state.stock).toBe(16);
    expect(state.movements).toHaveLength(1);
    expect(state.transactionBatches).toHaveLength(1);
  });

  it('serializes completion against a manual stock output on the same product', async () => {
    state.stock = 5;
    holdFirstProductLock = deferred();
    firstProductLocked = deferred();
    const completion = completePlaySession(completionInput());
    await firstProductLocked.promise;
    const manualOutput = createShuttlecockMovement({
      productId: 'product-1',
      movementType: 'PLAY_USAGE',
      title: 'Xuất cầu đồng thời',
      quantityBall: 3
    });
    holdFirstProductLock.resolve();

    const results = await Promise.allSettled([completion, manualOutput]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(state.stock).toBe(1);
    expect(state.stock).toBeGreaterThanOrEqual(0);
    expect(state.movements).toHaveLength(1);
    expect(state.transactionBatches).toHaveLength(1);
    expect(results[1]).toMatchObject({
      reason: expect.objectContaining({ message: 'Kho cầu không đủ. Còn 1 quả, cần 3 quả' })
    });
  });
});
