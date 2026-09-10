import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionFindFirst: vi.fn(),
  sessionFindUnique: vi.fn(),
  playersFindMany: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    play_sessions: {
      findFirst: mocks.sessionFindFirst,
      findUnique: mocks.sessionFindUnique
    },
    session_players: { findMany: mocks.playersFindMany }
  }
}));

import {
  getRuntimeSession,
  listSessionPlayers,
  resolveRuntimeSessionId
} from './runtime-session-repository';

function playerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'player-1',
    full_name: 'Player 1',
    gender: 'female',
    level: 3,
    total_matches: 2,
    payment_amount: 120000,
    discount: 10000,
    payment_method: 'CASH',
    payment_status: 'PAID',
    runtime_status: 'JUSTFINISHED',
    last_court_number: 2,
    note: null,
    player_tags: ['ARRIVED', 'LEFT_EARLY'],
    avatar_url: null,
    avatar_s3_key: null,
    joined_at: new Date('2099-01-01T00:00:00.000Z'),
    first_arrived_at: new Date('2099-01-01T00:10:00.000Z'),
    arrival_baseline_matches: 1,
    fairness_offset: 1,
    deferred_rounds: 2,
    waiting_since: null,
    entry_priority_consumed_at: null,
    last_finished_at: new Date('2099-01-01T01:00:00.000Z'),
    next_match_requested_at: null,
    next_match_request_mode: null,
    end_game_at: null,
    end_game_after_match: false,
    couple_number: null,
    couple_match_mode: null,
    ...overrides
  };
}

describe('runtime session repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses an explicit session id without querying for an active fallback', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ id: 'session-explicit' });
    await expect(resolveRuntimeSessionId('session-explicit')).resolves.toBe('session-explicit');
    expect(mocks.sessionFindUnique).toHaveBeenCalledWith({
      where: { id: 'session-explicit', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      select: { id: true }
    });
    expect(mocks.sessionFindFirst).not.toHaveBeenCalled();
  });

  it('returns no runtime resource for an explicit id outside the current tenant', async () => {
    mocks.sessionFindUnique.mockResolvedValue(null);

    await expect(resolveRuntimeSessionId('foreign-session')).resolves.toBeNull();
    expect(mocks.sessionFindUnique).toHaveBeenCalledWith({
      where: { id: 'foreign-session', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      select: { id: true }
    });
    expect(mocks.sessionFindFirst).not.toHaveBeenCalled();
  });

  it('prefers the latest active session and otherwise falls back to the latest session', async () => {
    mocks.sessionFindFirst.mockResolvedValueOnce({ id: 'session-live' });
    await expect(resolveRuntimeSessionId()).resolves.toBe('session-live');
    expect(mocks.sessionFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        status: { in: ['ACTIVE', 'LIVE', 'IN_PROGRESS'] }
      },
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }]
    });

    mocks.sessionFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'session-latest' });
    await expect(resolveRuntimeSessionId()).resolves.toBe('session-latest');
  });

  it('maps session metadata and exposes the persisted runtime revision', async () => {
    mocks.sessionFindUnique.mockResolvedValue({
      id: 'session-1',
      name: 'Ca tối',
      start_time: new Date('1970-01-01T18:00:00.000Z'),
      end_time: new Date('1970-01-01T21:00:00.000Z'),
      court_count: 4,
      status: 'LIVE',
      runtime_version: 7
    });

    await expect(getRuntimeSession('session-1')).resolves.toEqual({
      id: 'session-1',
      name: 'Ca tối',
      startTime: '1970-01-01T18:00:00.000Z',
      endTime: '1970-01-01T21:00:00.000Z',
      courtCount: 4,
      status: 'LIVE',
      runtimeVersion: 7
    });
  });

  it('hydrates runtime players with normalized gender, status, tags, and timestamps', async () => {
    mocks.playersFindMany.mockResolvedValue([playerRow()]);

    await expect(listSessionPlayers('session-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'player-1',
        gender: 'Nữ',
        runtimeStatus: 'JUST_FINISHED',
        playerTags: ['ARRIVED', 'END_GAME'],
        joinedAt: new Date('2099-01-01T00:00:00.000Z').getTime(),
        lastFinishedAt: new Date('2099-01-01T01:00:00.000Z').getTime()
      })
    ]);
    expect(mocks.playersFindMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      orderBy: [{ joined_at: 'asc' }]
    });
  });
});
