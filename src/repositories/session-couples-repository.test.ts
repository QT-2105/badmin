import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updatePlayer: vi.fn(),
  updateMany: vi.fn(),
  updateSession: vi.fn(),
  sessionFindUnique: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session_players: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany
    },
    play_sessions: { findUnique: mocks.sessionFindUnique },
    $transaction: mocks.transaction
  }
}));

import {
  createSessionCouple,
  deleteSessionCouple,
  listSessionCouples
} from './session-couples-repository';

function couplePlayer(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    session_id: 'session-1',
    full_name: `Player ${id}`,
    gender: 'Nam',
    level: 3,
    player_tags: ['ARRIVED'],
    couple_number: null,
    couple_match_mode: null,
    next_match_requested_at: null,
    next_match_request_mode: null,
    joined_at: new Date(`2099-01-0${id === 'player-1' ? '1' : '2'}T00:00:00.000Z`),
    ...overrides
  };
}

describe('session couples repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionFindUnique.mockResolvedValue({ id: 'session-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      session_players: {
        findMany: mocks.findMany,
        update: mocks.updatePlayer,
        updateMany: mocks.updateMany
      },
      play_sessions: { update: mocks.updateSession }
    }));
  });

  it('lists only complete Couple groups and preserves member order', async () => {
    const requestedAt = new Date('2099-01-03T00:00:00.000Z');
    mocks.findMany.mockResolvedValue([
      couplePlayer('player-2', {
        gender: 'Nữ', couple_number: 1, couple_match_mode: 'MIXED', next_match_requested_at: requestedAt
      }),
      couplePlayer('player-1', {
        couple_number: 1, couple_match_mode: 'MIXED', next_match_requested_at: requestedAt
      }),
      couplePlayer('player-3', { couple_number: 2, couple_match_mode: 'MEN' })
    ]);

    await expect(listSessionCouples('session-1')).resolves.toEqual([expect.objectContaining({
      id: 'session-1:1',
      displayNumber: 1,
      matchMode: 'MIXED',
      nextMatchRequestedAt: requestedAt.toISOString(),
      members: [
        expect.objectContaining({ playerId: 'player-1' }),
        expect.objectContaining({ playerId: 'player-2' })
      ]
    })]);
  });

  it('rejects an invalid mode or anything other than two distinct members', async () => {
    await expect(createSessionCouple({
      sessionId: 'session-1', memberIds: ['player-1', 'player-2'], matchMode: 'INVALID' as 'MEN'
    })).rejects.toMatchObject({ message: 'Nội dung Couple không hợp lệ.' });

    await expect(createSessionCouple({
      sessionId: 'session-1', memberIds: ['player-1', 'player-1'], matchMode: 'MEN'
    })).rejects.toMatchObject({ message: 'Couple cần đúng hai người chơi khác nhau.' });
  });

  it('requires both members to belong to the selected session', async () => {
    mocks.findMany.mockResolvedValue([couplePlayer('player-1')]);

    await expect(createSessionCouple({
      sessionId: 'session-1', memberIds: ['player-1', 'player-2'], matchMode: 'MEN'
    })).rejects.toMatchObject({ message: 'Hai thành viên Couple phải thuộc cùng ca chơi.' });
  });

  it('validates member genders for MEN, WOMEN, and MIXED formats', async () => {
    mocks.findMany.mockResolvedValue([
      couplePlayer('player-1'),
      couplePlayer('player-2', { gender: 'Nữ' })
    ]);

    await expect(createSessionCouple({
      sessionId: 'session-1', memberIds: ['player-1', 'player-2'], matchMode: 'MEN'
    })).rejects.toMatchObject({
      message: 'Giới tính của hai người chơi không phù hợp nội dung Couple đã chọn.'
    });
  });

  it('creates a Couple atomically and mirrors a next-match request to both members', async () => {
    const players = [
      couplePlayer('player-1'),
      couplePlayer('player-2', { gender: 'Nữ' })
    ];
    const requestedAt = '2099-01-03T00:00:00.000Z';
    mocks.findMany.mockResolvedValue(players);
    mocks.updateSession.mockResolvedValue({ next_couple_number: 4 });
    mocks.updateMany.mockResolvedValue({ count: 2 });
    mocks.updatePlayer.mockImplementation(async ({ where, data }) => ({
      ...players.find((player) => player.id === where.id),
      ...data
    }));

    const result = await createSessionCouple({
      sessionId: 'session-1',
      memberIds: ['player-1', 'player-2'],
      matchMode: 'MIXED',
      nextMatchRequestedAt: requestedAt
    });

    expect(result).toMatchObject({ id: 'session-1:3', displayNumber: 3, matchMode: 'MIXED' });
    expect(result.nextMatchRequestedAt).toBe(requestedAt);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        session_id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        id: { in: ['player-1', 'player-2'] },
        couple_number: null
      },
      data: { couple_number: 3, couple_match_mode: 'MIXED' }
    });
    expect(mocks.updatePlayer).toHaveBeenCalledTimes(2);
    for (const call of mocks.updatePlayer.mock.calls) {
      expect(call[0].data).toMatchObject({
        couple_number: 3,
        couple_match_mode: 'MIXED',
        next_match_request_mode: 'MIXED',
        player_tags: ['ARRIVED', 'PRIORITY']
      });
    }
  });

  it('rejects a concurrent Couple reservation conflict', async () => {
    mocks.findMany.mockResolvedValue([couplePlayer('player-1'), couplePlayer('player-2')]);
    mocks.updateSession.mockResolvedValue({ next_couple_number: 2 });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(createSessionCouple({
      sessionId: 'session-1', memberIds: ['player-1', 'player-2'], matchMode: 'MEN'
    })).rejects.toMatchObject({
      message: 'Một người chơi vừa được đánh dấu vào Couple khác.',
      status: 409
    });
    expect(mocks.updatePlayer).not.toHaveBeenCalled();
  });

  it('validates Couple IDs and reports missing rows during deletion', async () => {
    await expect(deleteSessionCouple('invalid')).rejects.toMatchObject({
      message: 'Mã Couple không hợp lệ.', status: 400
    });

    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(deleteSessionCouple('session-1:3')).rejects.toMatchObject({
      message: 'Không tìm thấy Couple.', status: 404
    });

    mocks.updateMany.mockResolvedValueOnce({ count: 2 });
    await expect(deleteSessionCouple('session-1:3')).resolves.toBeUndefined();
    expect(mocks.updateMany).toHaveBeenLastCalledWith({
      where: {
        session_id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        couple_number: 3
      },
      data: { couple_number: null, couple_match_mode: null }
    });
  });
});
