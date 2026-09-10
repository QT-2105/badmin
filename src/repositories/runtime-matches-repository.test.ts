import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  resolveRuntimeSessionId: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { runtime_matches: { findMany: mocks.findMany } }
}));
vi.mock('./runtime-session-repository', () => ({
  resolveRuntimeSessionId: mocks.resolveRuntimeSessionId
}));

import { listRuntimeMatches } from './runtime-matches-repository';

describe('runtime matches repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no matches without a resolved session', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue(null);
    await expect(listRuntimeMatches()).resolves.toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('hydrates legacy and current JSON roster shapes without changing queue metadata', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue('session-1');
    mocks.findMany.mockResolvedValue([{
      id: 'match-1',
      session_id: 'session-1',
      queue_order: 1,
      court_number: null,
      status: 'READY',
      fairness_score: 12.5,
      team_a: ['player-1', { playerId: 'player-2' }],
      team_b: { players: [{ session_player_id: 'player-3' }, { id: 'player-4' }] },
      created_at: new Date('2099-01-01T00:00:00.000Z'),
      updated_at: null,
      locked: true,
      match_format: 'MIXED',
      generation: 3,
      manual_edited: false,
      source_revision: 8
    }]);

    await expect(listRuntimeMatches('session-1')).resolves.toEqual([{
      id: 'match-1',
      sessionId: 'session-1',
      queueOrder: 1,
      courtId: null,
      status: 'READY',
      fairnessScore: 12.5,
      teamA: ['player-1', 'player-2'],
      teamB: ['player-3', 'player-4'],
      createdAt: new Date('2099-01-01T00:00:00.000Z').getTime(),
      updatedAt: null,
      locked: true,
      matchFormat: 'MIXED',
      generation: 3,
      manualEdited: false,
      sourceRevision: 8
    }]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      orderBy: [{ queue_order: 'asc' }, { created_at: 'asc' }]
    });
  });
});
