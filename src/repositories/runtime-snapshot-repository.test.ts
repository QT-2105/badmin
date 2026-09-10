import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  historyFindMany: vi.fn(),
  resolveRuntimeSessionId: vi.fn(),
  getRuntimeSession: vi.fn(),
  listSessionPlayers: vi.fn(),
  listRuntimeCourts: vi.fn(),
  listSessionCourtsAsRuntime: vi.fn(),
  listRuntimeMatches: vi.fn(),
  sessionUpdateMany: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionFindUnique: vi.fn(),
  playerFindMany: vi.fn(),
  playerUpdate: vi.fn(),
  matchFindMany: vi.fn(),
  matchUpdate: vi.fn(),
  matchCreate: vi.fn(),
  matchDeleteMany: vi.fn(),
  courtFindMany: vi.fn(),
  courtUpdate: vi.fn(),
  courtCreate: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match_histories: { findMany: mocks.historyFindMany },
    $transaction: mocks.transaction
  }
}));
vi.mock('./runtime-session-repository', () => ({
  resolveRuntimeSessionId: mocks.resolveRuntimeSessionId,
  getRuntimeSession: mocks.getRuntimeSession,
  listSessionPlayers: mocks.listSessionPlayers
}));
vi.mock('./runtime-courts-repository', () => ({
  listRuntimeCourts: mocks.listRuntimeCourts,
  listSessionCourtsAsRuntime: mocks.listSessionCourtsAsRuntime
}));
vi.mock('./runtime-matches-repository', () => ({
  listRuntimeMatches: mocks.listRuntimeMatches
}));

import {
  RuntimeVersionConflictError,
  getRuntimeSnapshot,
  syncRuntimeSnapshot
} from './runtime-snapshot-repository';
import type { RuntimeSyncPayload } from '@/types/runtime';

function txClient() {
  return {
    play_sessions: {
      updateMany: mocks.sessionUpdateMany,
      update: mocks.sessionUpdate,
      findUnique: mocks.sessionFindUnique
    },
    session_players: {
      findMany: mocks.playerFindMany,
      update: mocks.playerUpdate
    },
    runtime_matches: {
      findMany: mocks.matchFindMany,
      update: mocks.matchUpdate,
      create: mocks.matchCreate,
      deleteMany: mocks.matchDeleteMany
    },
    runtime_courts: {
      findMany: mocks.courtFindMany,
      update: mocks.courtUpdate,
      create: mocks.courtCreate
    }
  };
}

function emptyPayload(overrides: Partial<RuntimeSyncPayload> = {}): RuntimeSyncPayload {
  return {
    sessionId: 'session-1',
    expectedVersion: 2,
    mode: 'FULL',
    players: [],
    courts: [],
    nextMatches: [],
    ...overrides
  };
}

function syncPlayer(id: string) {
  return {
    id,
    status: 'WAITING' as const,
    matchesPlayed: 0,
    lastCourtNumber: null
  };
}

function persistedPlayer(id: string) {
  return {
    id,
    runtime_status: 'WAITING',
    total_matches: 0,
    last_court_number: null,
    couple_number: null,
    couple_match_mode: null
  };
}

describe('runtime snapshot repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback(txClient()));
    mocks.matchFindMany.mockResolvedValue([]);
    mocks.matchDeleteMany.mockResolvedValue({ count: 0 });
    mocks.courtFindMany.mockResolvedValue([]);
  });

  it('returns an empty hydration snapshot when no session can be resolved', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue(null);

    await expect(getRuntimeSnapshot()).resolves.toEqual({
      session: null,
      players: [],
      courts: [],
      matches: [],
      recentQuartets: [],
      version: 0
    });
    expect(mocks.getRuntimeSession).not.toHaveBeenCalled();
  });

  it('hydrates current state and derives courts when persisted court rows are absent', async () => {
    const session = {
      id: 'session-1', name: 'Ca', startTime: 'start', endTime: 'end', courtCount: 2,
      status: 'LIVE', runtimeVersion: 9
    };
    const generatedCourts = [{ id: 'generated-c1', courtId: 'c1' }];
    mocks.resolveRuntimeSessionId.mockResolvedValue('session-1');
    mocks.getRuntimeSession.mockResolvedValue(session);
    mocks.listSessionPlayers.mockResolvedValue(['1', '2', '3', '4'].map((id) => ({ id })));
    mocks.listRuntimeCourts.mockResolvedValue([]);
    mocks.listSessionCourtsAsRuntime.mockResolvedValue(generatedCourts);
    mocks.listRuntimeMatches.mockResolvedValue([{
      id: 'match-1', sessionId: 'session-1', teamA: ['1', '2'], teamB: ['3', '4']
    }]);
    mocks.historyFindMany.mockResolvedValue([
      {
        id: 'history-valid',
        ended_at: new Date('2099-01-01T01:00:00.000Z'),
        match_history_players: ['4', '2', '1', '3'].map((session_player_id) => ({ session_player_id }))
      },
      {
        id: 'history-invalid',
        ended_at: new Date('2099-01-01T00:00:00.000Z'),
        match_history_players: [{ session_player_id: '1' }]
      }
    ]);

    const result = await getRuntimeSnapshot('session-1');

    expect(result).toMatchObject({ session, courts: generatedCourts, version: 9 });
    expect(result.recentQuartets).toEqual([{
      matchId: 'history-valid',
      playerIds: ['1', '2', '3', '4'],
      endedAt: new Date('2099-01-01T01:00:00.000Z').getTime()
    }]);
    expect(mocks.listSessionCourtsAsRuntime).toHaveBeenCalledWith('session-1');
  });

  it('uses persisted courts without generating replacements', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue('session-1');
    mocks.getRuntimeSession.mockResolvedValue({ runtimeVersion: 4 });
    mocks.listSessionPlayers.mockResolvedValue([]);
    mocks.listRuntimeCourts.mockResolvedValue([{ id: 'court-1' }]);
    mocks.listRuntimeMatches.mockResolvedValue([]);
    mocks.historyFindMany.mockResolvedValue([]);

    await expect(getRuntimeSnapshot('session-1')).resolves.toMatchObject({
      courts: [{ id: 'court-1' }], version: 4
    });
    expect(mocks.listSessionCourtsAsRuntime).not.toHaveBeenCalled();
  });

  it('rejects malformed snapshot envelopes before opening a transaction', async () => {
    await expect(syncRuntimeSnapshot(emptyPayload({ sessionId: '' }))).rejects.toMatchObject({
      message: 'Không tìm thấy ca điều phối.'
    });
    await expect(syncRuntimeSnapshot({
      ...emptyPayload(),
      players: null as unknown as RuntimeSyncPayload['players']
    })).rejects.toMatchObject({ message: 'Snapshot điều phối không hợp lệ.' });
    await expect(syncRuntimeSnapshot(emptyPayload({ mode: 'INVALID' as 'FULL' }))).rejects.toMatchObject({
      message: 'Chế độ đồng bộ runtime không hợp lệ.'
    });
    await expect(syncRuntimeSnapshot(emptyPayload({ expectedVersion: -1 }))).rejects.toMatchObject({
      message: 'Phiên bản runtime không hợp lệ.'
    });
    await expect(syncRuntimeSnapshot(emptyPayload({
      expectedVersion: undefined as unknown as number
    }))).rejects.toMatchObject({ message: 'Phiên bản runtime là bắt buộc.', status: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('returns the current revision when compare-and-swap fails', async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 0 });
    mocks.sessionFindUnique.mockResolvedValue({ runtime_version: 7, status: 'LIVE' });

    const error = await syncRuntimeSnapshot(emptyPayload()).catch((caught) => caught);

    expect(error).toBeInstanceOf(RuntimeVersionConflictError);
    expect(error).toMatchObject({ status: 409, currentVersion: 7 });
    expect(mocks.sessionUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        status: 'LIVE',
        runtime_version: 2
      },
      data: { runtime_version: { increment: 1 }, updated_at: expect.any(Date) }
    });
  });

  it('rejects runtime writes after a session is completed or cancelled', async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 0 });
    mocks.sessionFindUnique.mockResolvedValue({ runtime_version: 8, status: 'FINISHED' });

    const error = await syncRuntimeSnapshot(emptyPayload({ expectedVersion: 8 })).catch((caught) => caught);

    expect(error).toBeInstanceOf(RuntimeVersionConflictError);
    expect(error).toMatchObject({
      status: 409,
      currentVersion: 8,
      message: 'Ca chơi đã hoàn tất hoặc hủy, không thể thay đổi điều phối.'
    });
    expect(mocks.playerFindMany).not.toHaveBeenCalled();
  });

  it('rejects a fractional runtime revision before opening a transaction', async () => {
    await expect(syncRuntimeSnapshot(emptyPayload({ expectedVersion: 1.5 }))).rejects.toMatchObject({
      message: 'Phiên bản runtime không hợp lệ.',
      status: 409
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects hydrated JSON rosters that reference a player outside the tenant session', async () => {
    mocks.resolveRuntimeSessionId.mockResolvedValue('session-1');
    mocks.getRuntimeSession.mockResolvedValue({ runtimeVersion: 4 });
    mocks.listSessionPlayers.mockResolvedValue([{ id: 'player-1' }]);
    mocks.listRuntimeCourts.mockResolvedValue([]);
    mocks.listSessionCourtsAsRuntime.mockResolvedValue([]);
    mocks.listRuntimeMatches.mockResolvedValue([{
      id: 'match-1', sessionId: 'session-1', teamA: ['player-1', 'foreign-player'], teamB: ['player-3', 'player-4']
    }]);
    mocks.historyFindMany.mockResolvedValue([]);

    await expect(getRuntimeSnapshot('session-1')).rejects.toMatchObject({
      message: 'Dữ liệu người chơi trong runtime snapshot không hợp lệ.',
      status: 409
    });
  });

  it('claims the expected revision and removes stale FULL queue rows atomically', async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });

    await expect(syncRuntimeSnapshot(emptyPayload())).resolves.toBe(3);
    expect(mocks.matchDeleteMany).toHaveBeenCalledWith({
      where: {
        session_id: 'session-1',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        court_number: null,
        queue_order: { not: null }
      }
    });
  });

  it('rejects duplicate player rows after revision claim', async () => {
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
    const duplicate = syncPlayer('player-1');

    await expect(syncRuntimeSnapshot(emptyPayload({ players: [duplicate, duplicate] }))).rejects.toMatchObject({
      message: 'Snapshot chứa người chơi bị trùng.'
    });
  });

  it('persists queue and court current state with the newly claimed source revision', async () => {
    const players = Array.from({ length: 8 }, (_, index) => syncPlayer(`player-${index + 1}`));
    mocks.sessionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.playerFindMany.mockResolvedValue(players.map((player) => persistedPlayer(player.id)));
    mocks.matchCreate
      .mockResolvedValueOnce({ id: 'queue-match-1' })
      .mockResolvedValueOnce({ id: 'court-match-1' });
    mocks.courtCreate.mockResolvedValue({});

    const version = await syncRuntimeSnapshot(emptyPayload({
      players,
      nextMatches: [{
        queueOrder: 1,
        roster: ['player-1', 'player-2', 'player-3', 'player-4'],
        score: 10,
        locked: true,
        matchFormat: 'MEN'
      }],
      courts: [{
        courtId: 'c1',
        status: 'PLAYING',
        startedAt: new Date('2099-01-01T00:00:00.000Z').getTime(),
        roster: ['player-5', 'player-6', 'player-7', 'player-8']
      }]
    }));

    expect(version).toBe(3);
    expect(mocks.matchCreate).toHaveBeenCalledTimes(2);
    expect(mocks.matchCreate.mock.calls[0][0].data).toMatchObject({
      club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      session_id: 'session-1', queue_order: 1, source_revision: 3, locked: true
    });
    expect(mocks.matchCreate.mock.calls[1][0].data).toMatchObject({
      club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      session_id: 'session-1', court_number: 1, status: 'PLAYING', source_revision: 3
    });
    expect(mocks.courtCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        session_id: 'session-1', court_number: 1, runtime_match_id: 'court-match-1'
      })
    });
  });
});
