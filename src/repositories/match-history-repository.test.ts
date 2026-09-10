import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  deleteParticipants: vi.fn(),
  deleteMatches: vi.fn(),
  playerFindMany: vi.fn(),
  historyCreate: vi.fn(),
  sessionFindUnique: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    session_players: { findMany: mocks.playerFindMany },
    match_histories: { create: mocks.historyCreate },
    play_sessions: { findUnique: mocks.sessionFindUnique }
  }
}));

import { createMatchHistory, deleteAllMatchHistory } from './match-history-repository';

describe('match history destructive operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteParticipants.mockResolvedValue({ count: 8 });
    mocks.deleteMatches.mockResolvedValue({ count: 2 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      match_history_players: { deleteMany: mocks.deleteParticipants },
      match_histories: { deleteMany: mocks.deleteMatches }
    }));
  });

  it('deletes participants before matches in one transaction and reports both counts', async () => {
    await expect(deleteAllMatchHistory()).resolves.toEqual({
      deletedMatches: 2,
      deletedParticipants: 8
    });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.deleteParticipants).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.deleteMatches).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.deleteParticipants.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteMatches.mock.invocationCallOrder[0]
    );
  });

  it('writes Legacy Club ID to the history and every nested participant', async () => {
    const ids = ['player-1', 'player-2', 'player-3', 'player-4'];
    mocks.playerFindMany.mockResolvedValue(ids.map((id) => ({ id })));
    mocks.historyCreate.mockImplementation(async ({ data }) => ({
      id: 'history-1',
      session_id: data.session_id,
      court_number: data.court_number,
      court_name: data.court_name,
      started_at: data.started_at,
      ended_at: data.ended_at,
      duration_seconds: data.duration_seconds,
      created_at: new Date('2099-01-01T00:10:00.000Z'),
      match_history_players: data.match_history_players.createMany.data.map((item: {
        session_player_id: string;
        team: string;
        position: number;
      }) => ({ ...item, session_players: { full_name: item.session_player_id } }))
    }));

    await createMatchHistory({
      sessionId: 'session-1',
      courtNumber: 1,
      courtName: 'Sân 1',
      endedAt: '2099-01-01T00:10:00.000Z',
      teamA: ids.slice(0, 2).map((playerId) => ({ playerId, playerName: playerId })),
      teamB: ids.slice(2).map((playerId) => ({ playerId, playerName: playerId }))
    });

    const data = mocks.historyCreate.mock.calls[0][0].data;
    expect(data.club_id).toBe('aa1f1aa3-c438-4498-96e9-ab228cd51f4f');
    expect(data.match_history_players.createMany.data).toHaveLength(4);
    expect(data.match_history_players.createMany.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' })
    ]));
  });
});
