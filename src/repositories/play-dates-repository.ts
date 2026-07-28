import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { formatPlayDateTitle, isPastDateInput, parseDateInput, toDateInput, toTimeInput } from '@/lib/date-format';
import type { PlayDateSummary, PlaySessionSummary } from '@/types/domain';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function mapSession(row: {
  id: string;
  play_date_id: string;
  name: string;
  start_time: Date;
  end_time: Date;
  court_count: number;
  status: string;
  court_cost?: unknown;
  shuttlecock_pieces_used?: number | null;
  shuttlecock_product_id?: string | null;
  shuttlecock_product_name?: string | null;
  extra_expense_title?: string | null;
  extra_expense_amount?: unknown;
  total_income: unknown;
  total_expense: unknown;
  total_profit: unknown;
  note: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}): PlaySessionSummary {
  return {
    id: row.id,
    playDateId: row.play_date_id,
    name: row.name,
    startTime: toTimeInput(row.start_time),
    endTime: toTimeInput(row.end_time),
    courtCount: row.court_count,
    status: row.status,
    courtCost: toNumber(row.court_cost),
    shuttlecockPiecesUsed: Number(row.shuttlecock_pieces_used ?? 0),
    shuttlecockProductId: row.shuttlecock_product_id ?? null,
    shuttlecockProductName: row.shuttlecock_product_name ?? null,
    extraExpenseTitle: row.extra_expense_title ?? null,
    extraExpenseAmount: toNumber(row.extra_expense_amount),
    totalIncome: toNumber(row.total_income),
    totalExpense: toNumber(row.total_expense),
    totalProfit: toNumber(row.total_profit),
    note: row.note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function mapPlayDate(row: {
  id: string;
  play_date: Date;
  title: string | null;
  note: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  play_sessions?: Array<Parameters<typeof mapSession>[0]>;
}): PlayDateSummary {
  const sessions = (row.play_sessions ?? []).map(mapSession);
  return {
    id: row.id,
    playDate: toDateInput(row.play_date),
    title: row.title,
    note: row.note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    sessionCount: sessions.length,
    sessions
  };
}

export async function listPlayDates(): Promise<PlayDateSummary[]> {
  const rows = await prisma.play_dates.findMany({
    include: {
      play_sessions: {
        orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
      }
    },
    orderBy: [{ play_date: 'desc' }]
  });

  return rows.map(mapPlayDate);
}

export async function getPlayDate(id: string): Promise<PlayDateSummary | null> {
  const row = await prisma.play_dates.findUnique({
    where: { id },
    include: {
      play_sessions: {
        orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
      }
    }
  });

  return row ? mapPlayDate(row) : null;
}

export async function createPlayDate(input: { playDate: string; title?: string | null; note?: string | null }): Promise<PlayDateSummary> {
  if (!input.playDate) throw new AppError('Vui lòng chọn ngày chơi.');
  if (isPastDateInput(input.playDate)) throw new AppError('Không thể tạo ngày chơi trong quá khứ. Vui lòng chọn ngày hôm nay hoặc ngày sắp tới.');
  const parsedPlayDate = parseDateInput(input.playDate);
  if (Number.isNaN(parsedPlayDate.getTime())) throw new AppError('Ngày chơi không hợp lệ. Vui lòng chọn lại ngày.');

  const existing = await prisma.play_dates.findUnique({ where: { play_date: parsedPlayDate } });
  if (existing) throw new AppError('Ngày chơi này đã tồn tại. Vui lòng chọn ngày khác.', 409);

  const title = input.title?.trim() || formatPlayDateTitle(input.playDate);

  const row = await prisma.play_dates.create({
    data: {
      play_date: parsedPlayDate,
      title,
      note: input.note?.trim() || null
    },
    include: { play_sessions: true }
  });

  return mapPlayDate(row);
}

export async function updatePlayDate(id: string, input: { playDate?: string; title?: string | null; note?: string | null }): Promise<PlayDateSummary> {
  const current = await prisma.play_dates.findUnique({ where: { id } });
  if (!current) throw new AppError('Không tìm thấy ngày chơi.', 404);
  if (isPastDateInput(toDateInput(current.play_date))) {
    throw new AppError('Ngày chơi đã thuộc quá khứ, chỉ được xem lại thông tin.');
  }

  let parsedPlayDate: Date | undefined;
  if (input.playDate) {
    if (isPastDateInput(input.playDate)) throw new AppError('Không thể chuyển ngày chơi về quá khứ.');
    parsedPlayDate = parseDateInput(input.playDate);
    if (Number.isNaN(parsedPlayDate.getTime())) throw new AppError('Ngày chơi không hợp lệ. Vui lòng chọn lại ngày.');
    const existing = await prisma.play_dates.findUnique({ where: { play_date: parsedPlayDate } });
    if (existing && existing.id !== id) throw new AppError('Ngày chơi này đã tồn tại. Vui lòng chọn ngày khác.', 409);
  }

  const row = await prisma.play_dates.update({
    where: { id },
    data: {
      ...(parsedPlayDate ? { play_date: parsedPlayDate } : {}),
      ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      updated_at: new Date()
    },
    include: {
      play_sessions: {
        orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
      }
    }
  });

  return mapPlayDate(row);
}

export async function deletePlayDate(id: string): Promise<void> {
  const playDate = await prisma.play_dates.findUnique({
    where: { id },
    select: { play_date: true, _count: { select: { play_sessions: true } } }
  });
  if (!playDate) throw new AppError('Không tìm thấy ngày chơi.', 404);
  if (isPastDateInput(toDateInput(playDate.play_date))) {
    throw new AppError('Ngày chơi đã thuộc quá khứ, không thể xóa ngày chơi.');
  }

  const sessionCount = playDate._count.play_sessions;
  if (sessionCount > 0) {
    throw new AppError('Ngày chơi này đã có ca chơi. Vui lòng xóa hoặc điều chỉnh các ca trong ngày trước khi xóa ngày chơi.');
  }

  await prisma.play_dates.delete({ where: { id } });
}
