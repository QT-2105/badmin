import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  courtFindMany: vi.fn(),
  sessionFindUnique: vi.fn(),
  resolveRuntimeSessionId: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    runtime_courts: { findMany: mocks.courtFindMany },
    play_sessions: { findUnique: mocks.sessionFindUnique }
  }
}));
vi.mock('./runtime-session-repository', () => ({
  resolveRuntimeSessionId: mocks.resolveRuntimeSessionId
}));

import {
  listRuntimeCourts,
  listSessionCourtsAsRuntime
} from './runtime-courts-repository';

describe('runtime courts repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no courts when no runtime session can be resolved', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue(null);
    await expect(listRuntimeCourts()).resolves.toEqual([]);
    expect(mocks.courtFindMany).not.toHaveBeenCalled();
  });

  it('maps persisted courts by court_number and normalizes unknown status to EMPTY', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue('session-1');
    mocks.courtFindMany.mockResolvedValue([{
      id: 'court-row-2',
      session_id: 'session-1',
      court_number: 2,
      status: 'UNKNOWN',
      runtime_match_id: null,
      started_at: null,
      updated_at: new Date('2099-01-01T00:00:00.000Z')
    }]);

    await expect(listRuntimeCourts('session-1')).resolves.toEqual([{
      id: 'court-row-2',
      sessionId: 'session-1',
      courtId: 'c2',
      courtName: 'Sân 2',
      status: 'EMPTY',
      runtimeMatchId: null,
      startedAt: null,
      updatedAt: new Date('2099-01-01T00:00:00.000Z').getTime()
    }]);
  });

  it('derives empty recovery courts from play_sessions.court_count', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ court_count: 3 });

    const courts = await listSessionCourtsAsRuntime('session-1');

    expect(courts).toHaveLength(3);
    expect(courts.map((court) => court.courtId)).toEqual(['c1', 'c2', 'c3']);
    expect(courts.every((court) => court.status === 'EMPTY' && court.runtimeMatchId === null)).toBe(true);
    expect(mocks.sessionFindUnique).toHaveBeenCalledWith({
      where: { id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      select: { court_count: true }
    });
  });
});
