import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    play_dates: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
      delete: mocks.delete
    }
  }
}));

import {
  createPlayDate,
  deletePlayDate,
  listPlayDates,
  updatePlayDate
} from './play-dates-repository';

function playDateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'date-1',
    play_date: new Date('2099-12-31T00:00:00.000Z'),
    title: 'Ngày cuối năm',
    note: null,
    created_at: new Date('2099-01-01T00:00:00.000Z'),
    updated_at: null,
    play_sessions: [],
    ...overrides
  };
}

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    play_date_id: 'date-1',
    name: 'Ca tối',
    start_time: new Date('1970-01-01T18:00:00.000Z'),
    end_time: new Date('1970-01-01T21:00:00.000Z'),
    court_count: 3,
    status: 'NOT_STARTED',
    court_cost: 300000,
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

describe('play dates repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists dates with ordered sessions and maps persisted values', async () => {
    mocks.findMany.mockResolvedValue([playDateRow({ play_sessions: [sessionRow()] })]);

    await expect(listPlayDates()).resolves.toEqual([
      expect.objectContaining({
        id: 'date-1',
        playDate: '2099-12-31',
        sessionCount: 1,
        sessions: [expect.objectContaining({
          id: 'session-1',
          startTime: '18:00',
          endTime: '21:00',
          courtCost: 300000
        })]
      })
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      include: { play_sessions: {
        where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
        orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
      } },
      orderBy: [{ play_date: 'desc' }]
    });
  });

  it('rejects missing, invalid, and past dates before creation', async () => {
    await expect(createPlayDate({ playDate: '' })).rejects.toMatchObject({
      message: 'Vui lòng chọn ngày chơi.'
    });
    await expect(createPlayDate({ playDate: 'not-a-date' })).rejects.toMatchObject({
      message: 'Ngày chơi không hợp lệ. Vui lòng chọn lại ngày.'
    });
    await expect(createPlayDate({ playDate: '2000-01-01' })).rejects.toMatchObject({
      message: 'Không thể tạo ngày chơi trong quá khứ. Vui lòng chọn ngày hôm nay hoặc ngày sắp tới.'
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate date with conflict status', async () => {
    mocks.findUnique.mockResolvedValue(playDateRow());

    await expect(createPlayDate({ playDate: '2099-12-31' })).rejects.toMatchObject({
      message: 'Ngày chơi này đã tồn tại. Vui lòng chọn ngày khác.',
      status: 409
    });
  });

  it('creates a future date with normalized optional fields and a default title', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockImplementation(async ({ data }) => playDateRow({
      title: data.title,
      note: data.note
    }));

    const result = await createPlayDate({ playDate: '2099-12-31', title: '  ', note: '  Ghi chú  ' });

    expect(result.title).toContain('| 2099-12-31');
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        note: 'Ghi chú'
      })
    }));
  });

  it('keeps a past date readonly during update', async () => {
    mocks.findUnique.mockResolvedValue(playDateRow({ play_date: new Date('2000-01-01T00:00:00.000Z') }));

    await expect(updatePlayDate('date-1', { title: 'Tên mới' })).rejects.toMatchObject({
      message: 'Ngày chơi đã thuộc quá khứ, chỉ được xem lại thông tin.'
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('treats a cross-tenant date id as missing before mutation', async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(updatePlayDate('foreign-date', { title: 'Không được sửa' })).rejects.toMatchObject({
      message: 'Không tìm thấy ngày chơi.',
      status: 404
    });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: 'foreign-date', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('blocks deletion when a date has sessions and deletes an empty future date', async () => {
    mocks.findUnique.mockResolvedValueOnce({
      play_date: new Date('2099-12-31T00:00:00.000Z'),
      _count: { play_sessions: 1 }
    });
    await expect(deletePlayDate('date-1')).rejects.toMatchObject({
      message: 'Ngày chơi này đã có ca chơi. Vui lòng xóa hoặc điều chỉnh các ca trong ngày trước khi xóa ngày chơi.'
    });

    mocks.findUnique.mockResolvedValueOnce({
      play_date: new Date('2099-12-31T00:00:00.000Z'),
      _count: { play_sessions: 0 }
    });
    mocks.delete.mockResolvedValue({});
    await expect(deletePlayDate('date-1')).resolves.toBeUndefined();
    expect(mocks.delete).toHaveBeenCalledWith({
      where: { id: 'date-1', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
  });
});
