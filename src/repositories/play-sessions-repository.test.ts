import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  playDateFindUnique: vi.fn(),
  sessionFindUnique: vi.fn(),
  sessionFindMany: vi.fn(),
  sessionCreate: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionDelete: vi.fn(),
  playerCount: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    play_dates: { findUnique: mocks.playDateFindUnique },
    play_sessions: {
      findUnique: mocks.sessionFindUnique,
      findMany: mocks.sessionFindMany,
      create: mocks.sessionCreate,
      delete: mocks.sessionDelete
    },
    $transaction: mocks.transaction
  }
}));

import {
  createPlaySession,
  deletePlaySession,
  listPlaySessions,
  updatePlaySession
} from './play-sessions-repository';

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    play_date_id: 'date-1',
    name: 'Ca tối',
    start_time: new Date('1970-01-01T18:00:00.000Z'),
    end_time: new Date('1970-01-01T21:00:00.000Z'),
    court_count: 3,
    status: 'NOT_STARTED',
    court_cost: 0,
    shuttlecock_pieces_used: 0,
    shuttlecock_product_id: null,
    shuttlecock_product_name: null,
    extra_expense_title: null,
    extra_expense_amount: 0,
    total_income: 0,
    total_expense: 0,
    total_profit: 0,
    note: null,
    created_at: new Date('2099-01-01T00:00:00.000Z'),
    updated_at: null,
    ...overrides
  };
}

function transactionSession(overrides: Record<string, unknown> = {}) {
  return sessionRow({
    play_dates: { play_date: new Date('2099-12-31T00:00:00.000Z') },
    ...overrides
  });
}

describe('play sessions repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.playDateFindUnique.mockResolvedValue({ id: 'date-1', play_date: new Date('2099-12-31T00:00:00.000Z') });
    mocks.transaction.mockImplementation(async (callback) => callback({
      play_sessions: {
        findUnique: mocks.sessionFindUnique,
        update: mocks.sessionUpdate
      },
      session_players: { count: mocks.playerCount }
    }));
  });

  it('lists sessions for one play date and normalizes database status', async () => {
    mocks.sessionFindMany.mockResolvedValue([sessionRow({ status: 'LIVE' })]);

    await expect(listPlaySessions('date-1')).resolves.toEqual([
      expect.objectContaining({ id: 'session-1', status: 'ACTIVE', startTime: '18:00' })
    ]);
    expect(mocks.sessionFindMany).toHaveBeenCalledWith({
      where: { play_date_id: 'date-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
    });
  });

  it('rejects invalid required fields and court count before persistence', async () => {
    await expect(createPlaySession({
      playDateId: 'date-1', name: ' ', startTime: '18:00', endTime: '21:00', courtCount: 1
    })).rejects.toMatchObject({ message: 'Vui lòng nhập tên ca chơi.' });
    await expect(createPlaySession({
      playDateId: 'date-1', name: 'Ca', startTime: '21:00', endTime: '18:00', courtCount: 1
    })).rejects.toMatchObject({ message: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    await expect(createPlaySession({
      playDateId: 'date-1', name: 'Ca', startTime: '18:00', endTime: '21:00', courtCount: 0
    })).rejects.toMatchObject({ message: 'Vui lòng nhập số sân hợp lệ.' });
    expect(mocks.playDateFindUnique).not.toHaveBeenCalled();
  });

  it('rejects a missing or past parent play date', async () => {
    const input = { playDateId: 'date-1', name: 'Ca', startTime: '18:00', endTime: '21:00', courtCount: 2 };
    mocks.playDateFindUnique.mockResolvedValueOnce(null);
    await expect(createPlaySession(input)).rejects.toMatchObject({ message: 'Không tìm thấy ngày chơi.', status: 404 });

    mocks.playDateFindUnique.mockResolvedValueOnce({ play_date: new Date('2000-01-01T00:00:00.000Z') });
    await expect(createPlaySession(input)).rejects.toMatchObject({
      message: 'Ngày chơi đã thuộc quá khứ, không thể tạo thêm ca chơi.'
    });
  });

  it('creates a pending session and caps court count at twelve', async () => {
    mocks.playDateFindUnique.mockResolvedValue({ play_date: new Date('2099-12-31T00:00:00.000Z') });
    mocks.sessionCreate.mockImplementation(async ({ data }) => sessionRow({
      name: data.name,
      court_count: data.court_count,
      status: data.status
    }));

    const result = await createPlaySession({
      playDateId: 'date-1', name: '  Ca tối  ', startTime: '18:00', endTime: '21:00', courtCount: 99
    });

    expect(result).toMatchObject({ name: 'Ca tối', courtCount: 12, status: 'PENDING' });
    expect(mocks.sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        status: 'NOT_STARTED',
        court_count: 12
      })
    }));
  });

  it('blocks structural edits after a session starts or on a past date', async () => {
    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession({ status: 'LIVE' }));
    await expect(updatePlaySession('session-1', { courtCount: 4 })).rejects.toMatchObject({
      message: 'Chỉ có thể chỉnh sửa ca chơi khi ca chưa bắt đầu điều phối.'
    });

    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession({
      play_dates: { play_date: new Date('2000-01-01T00:00:00.000Z') }
    }));
    await expect(updatePlaySession('session-1', { name: 'Ca mới' })).rejects.toMatchObject({
      message: 'Ngày chơi đã thuộc quá khứ, không thể chỉnh sửa thông tin ca chơi.'
    });
    expect(mocks.sessionUpdate).not.toHaveBeenCalled();
  });

  it('keeps completed and cancelled sessions immutable at the repository boundary', async () => {
    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession({ status: 'FINISHED' }));
    await expect(updatePlaySession('session-1', { note: 'Sửa sau khi chốt' })).rejects.toMatchObject({
      message: 'Ca chơi đã hoàn tất hoặc hủy, không thể chỉnh sửa.',
      status: 409
    });

    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession({ status: 'CANCELLED' }));
    await expect(updatePlaySession('session-1', { status: 'PENDING' })).rejects.toMatchObject({
      message: 'Ca chơi đã hoàn tất hoặc hủy, không thể chỉnh sửa.',
      status: 409
    });
    expect(mocks.sessionUpdate).not.toHaveBeenCalled();
  });

  it('requires at least four registered players before starting', async () => {
    mocks.sessionFindUnique.mockResolvedValue(transactionSession());
    mocks.playerCount.mockResolvedValue(3);

    await expect(updatePlaySession('session-1', { status: 'ACTIVE' })).rejects.toThrow(
      'Cần ít nhất 4 người chơi để bắt đầu ca'
    );
    expect(mocks.sessionUpdate).not.toHaveBeenCalled();
  });

  it('starts a session with four players and persists the LIVE status', async () => {
    mocks.sessionFindUnique.mockResolvedValue(transactionSession());
    mocks.playerCount.mockResolvedValue(4);
    mocks.sessionUpdate.mockImplementation(async ({ data }) => sessionRow({ status: data.status }));

    await expect(updatePlaySession('session-1', { status: 'ACTIVE' })).resolves.toMatchObject({
      status: 'ACTIVE'
    });
    expect(mocks.sessionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: expect.objectContaining({ status: 'LIVE' })
    }));
  });

  it('deletes only a pending session on a non-past play date', async () => {
    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession({ status: 'LIVE' }));
    await expect(deletePlaySession('session-1')).rejects.toMatchObject({
      message: 'Chỉ có thể xóa ca chơi khi ca chưa bắt đầu điều phối.'
    });

    mocks.sessionFindUnique.mockResolvedValueOnce(transactionSession());
    mocks.sessionDelete.mockResolvedValue({});
    await expect(deletePlaySession('session-1')).resolves.toBeUndefined();
    expect(mocks.sessionDelete).toHaveBeenCalledWith({
      where: { id: 'session-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
  });
});
