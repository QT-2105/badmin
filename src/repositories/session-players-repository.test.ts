import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
  deletePlayer: vi.fn(),
  countPlayers: vi.fn(),
  summaryFindFirst: vi.fn(),
  summaryCreate: vi.fn(),
  summaryUpdate: vi.fn(),
  runtimeFindMany: vi.fn(),
  sessionFindFirst: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session_players: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      create: mocks.createPlayer,
      update: mocks.updatePlayer,
      count: mocks.countPlayers
    },
    session_summaries: {
      findFirst: mocks.summaryFindFirst,
      create: mocks.summaryCreate,
      update: mocks.summaryUpdate
    },
    play_sessions: { findFirst: mocks.sessionFindFirst },
    $transaction: mocks.transaction
  }
}));

import {
  createSessionPlayer,
  deleteSessionPlayer,
  listSessionPlayers,
  updateSessionPlayer
} from './session-players-repository';

function playerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'player-1',
    session_id: 'session-1',
    full_name: 'Người chơi 1',
    gender: 'Nam',
    level: 3,
    total_matches: 0,
    payment_amount: 100000,
    discount: 0,
    payment_method: null,
    payment_status: 'UNPAID',
    runtime_status: 'WAITING',
    last_court_number: null,
    note: null,
    player_tags: ['NOT_ARRIVED'],
    avatar_url: null,
    avatar_s3_key: null,
    joined_at: new Date('2099-01-01T00:00:00.000Z'),
    first_arrived_at: null,
    arrival_baseline_matches: null,
    fairness_offset: 0,
    deferred_rounds: 0,
    waiting_since: null,
    entry_priority_consumed_at: null,
    last_finished_at: null,
    next_match_requested_at: null,
    next_match_request_mode: null,
    end_game_at: null,
    end_game_after_match: false,
    couple_number: null,
    couple_match_mode: null,
    ...overrides
  };
}

describe('session players repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      runtime_matches: { findMany: mocks.runtimeFindMany },
      session_players: { delete: mocks.deletePlayer }
    }));
    mocks.countPlayers.mockResolvedValue(1);
    mocks.summaryFindFirst.mockResolvedValue(null);
    mocks.summaryCreate.mockResolvedValue({});
    mocks.sessionFindFirst.mockResolvedValue({ id: 'session-1' });
  });

  it('lists session-scoped players and normalizes legacy End-Game tags', async () => {
    mocks.findMany.mockResolvedValue([playerRow({ player_tags: ['ARRIVED', 'INJURED'] })]);

    await expect(listSessionPlayers('session-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'player-1',
        sessionId: 'session-1',
        playerTags: ['ARRIVED', 'END_GAME'],
        paymentAmount: 100000
      })
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { session_id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      orderBy: [{ joined_at: 'asc' }, { full_name: 'asc' }]
    });
  });

  it('rejects missing name and negative financial inputs before persistence', async () => {
    await expect(createSessionPlayer({ sessionId: 'session-1', fullName: ' ' })).rejects.toMatchObject({
      message: 'Vui lòng nhập tên người chơi.'
    });
    await expect(createSessionPlayer({
      sessionId: 'session-1', fullName: 'Player', paymentAmount: -1
    })).rejects.toMatchObject({ message: 'Phí người chơi không được âm.' });
    await expect(createSessionPlayer({
      sessionId: 'session-1', fullName: 'Player', discount: -1
    })).rejects.toMatchObject({ message: 'Giảm giá không được âm.' });
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });

  it('creates an arrived next-match player with the median arrival baseline', async () => {
    mocks.findMany.mockResolvedValue([
      { total_matches: 1, fairness_offset: 0, player_tags: ['ARRIVED'] },
      { total_matches: 3, fairness_offset: 1, player_tags: ['ARRIVED'] },
      { total_matches: 99, fairness_offset: 0, player_tags: ['NOT_ARRIVED'] }
    ]);
    mocks.createPlayer.mockImplementation(async ({ data }) => playerRow({
      full_name: data.full_name,
      player_tags: data.player_tags,
      runtime_status: data.runtime_status,
      first_arrived_at: data.first_arrived_at,
      arrival_baseline_matches: data.arrival_baseline_matches,
      fairness_offset: data.fairness_offset,
      waiting_since: data.waiting_since,
      next_match_requested_at: data.next_match_requested_at,
      next_match_request_mode: data.next_match_request_mode
    }));

    const result = await createSessionPlayer({
      sessionId: 'session-1',
      fullName: '  Player mới  ',
      playerTags: ['ARRIVED', 'PRIORITY']
    });

    expect(result).toMatchObject({
      fullName: 'Player mới',
      runtimeStatus: 'WAITING',
      arrivalBaselineMatches: 1,
      fairnessOffset: 1,
      nextMatchRequestMode: 'ANY'
    });
    expect(result.firstArrivedAt).not.toBeNull();
    expect(result.waitingSince).not.toBeNull();
    expect(result.nextMatchRequestedAt).not.toBeNull();
    expect(mocks.createPlayer).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
      })
    }));
    expect(mocks.summaryCreate).toHaveBeenCalledWith({
      data: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_id: 'session-1',
        total_players: 1
      }
    });
  });

  it('creates an End-Game player as unavailable', async () => {
    mocks.createPlayer.mockImplementation(async ({ data }) => playerRow({
      player_tags: data.player_tags,
      runtime_status: data.runtime_status,
      end_game_at: data.end_game_at
    }));

    const result = await createSessionPlayer({
      sessionId: 'session-1', fullName: 'Player', playerTags: ['ARRIVED', 'END_GAME']
    });

    expect(result.runtimeStatus).toBe('FINISHED');
    expect(result.endGameAt).not.toBeNull();
  });

  it('transitions a newly arrived player to WAITING with peer baseline metadata', async () => {
    mocks.findUnique.mockResolvedValue(playerRow());
    mocks.findMany.mockResolvedValue([
      { total_matches: 2, fairness_offset: 1, player_tags: ['ARRIVED'] },
      { total_matches: 6, fairness_offset: 0, player_tags: ['ARRIVED'] }
    ]);
    mocks.updatePlayer.mockImplementation(async ({ data }) => playerRow({
      ...data,
      player_tags: data.player_tags
    }));

    const result = await updateSessionPlayer('player-1', { playerTags: ['ARRIVED'] });

    expect(result).toMatchObject({
      runtimeStatus: 'WAITING',
      arrivalBaselineMatches: 3,
      fairnessOffset: 3,
      playerTags: ['ARRIVED']
    });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        session_id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        id: { not: 'player-1' }
      }
    }));
  });

  it('prevents a gender edit that would invalidate the registered Couple format', async () => {
    mocks.findUnique.mockResolvedValue(playerRow({ couple_number: 2, couple_match_mode: 'MEN' }));
    mocks.findFirst.mockResolvedValue({ gender: 'Nam' });

    await expect(updateSessionPlayer('player-1', { gender: 'Nữ' })).rejects.toMatchObject({
      message: 'Giới tính mới không phù hợp với Couple_2.',
      status: 409
    });
    expect(mocks.updatePlayer).not.toHaveBeenCalled();
  });

  it.each([
    ['PLAYING', null, 'Không thể xóa người chơi đang được xếp ở sân. Hãy hủy hoặc kết thúc trận trước.'],
    ['WAITING', 3, 'Hãy gỡ Couple_3 trước khi xóa người chơi.']
  ])('blocks deletion for runtime status %s or Couple %s', async (runtimeStatus, coupleNumber, message) => {
    mocks.findUnique.mockResolvedValue(playerRow({
      runtime_status: runtimeStatus,
      couple_number: coupleNumber
    }));

    await expect(deleteSessionPlayer('player-1')).rejects.toMatchObject({ message, status: 409 });
    expect(mocks.deletePlayer).not.toHaveBeenCalled();
  });

  it('blocks deletion when a runtime preview still references the player', async () => {
    mocks.findUnique.mockResolvedValue(playerRow());
    mocks.runtimeFindMany.mockResolvedValue([{
      team_a: { players: [{ playerId: 'player-1' }] },
      team_b: [],
      queue_order: 2,
      court_number: null
    }]);

    await expect(deleteSessionPlayer('player-1')).rejects.toMatchObject({
      message: 'Không thể xóa người chơi đang nằm trong Gợi ý #2.',
      status: 409
    });
  });

  it('deletes an unreferenced player and refreshes an existing session summary', async () => {
    mocks.findUnique.mockResolvedValue(playerRow());
    mocks.runtimeFindMany.mockResolvedValue([]);
    mocks.deletePlayer.mockResolvedValue({});
    mocks.countPlayers.mockResolvedValue(4);
    mocks.summaryFindFirst.mockResolvedValue({ id: 'summary-1' });
    mocks.summaryUpdate.mockResolvedValue({});

    await expect(deleteSessionPlayer('player-1')).resolves.toBeUndefined();
    expect(mocks.deletePlayer).toHaveBeenCalledWith({
      where: { id: 'player-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.summaryUpdate).toHaveBeenCalledWith({
      where: { id: 'summary-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: { total_players: 4 }
    });
  });
});
