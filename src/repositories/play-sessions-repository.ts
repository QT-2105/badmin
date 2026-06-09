import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { isPastDateInput, parseTimeInput, toDateInput, toTimeInput } from '@/lib/date-format';
import { normalizeSessionStatus, toDatabaseSessionStatus } from '@/lib/session-status';
import type { PlaySessionSummary } from '@/types/domain';

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
    status: normalizeSessionStatus(row.status),
    courtCost: toNumber(row.court_cost),
    shuttlecockPiecesUsed: Number(row.shuttlecock_pieces_used ?? 0),
    shuttlecockProductId: row.shuttlecock_product_id ?? null,
    shuttlecockProductName: row.shuttlecock_product_name ?? null,
    totalIncome: toNumber(row.total_income),
    totalExpense: toNumber(row.total_expense),
    totalProfit: toNumber(row.total_profit),
    note: row.note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export async function getPlaySession(sessionId: string): Promise<PlaySessionSummary | null> {
  const row = await prisma.play_sessions.findUnique({ where: { id: sessionId } });
  return row ? mapSession(row) : null;
}

export async function listPlaySessions(playDateId?: string): Promise<PlaySessionSummary[]> {
  const rows = await prisma.play_sessions.findMany({
    where: playDateId ? { play_date_id: playDateId } : undefined,
    orderBy: [{ start_time: 'asc' }, { created_at: 'asc' }]
  });

  return rows.map(mapSession);
}

export async function createPlaySession(input: {
  playDateId: string;
  name: string;
  startTime: string;
  endTime: string;
  courtCount: number;
  note?: string | null;
  status?: string;
  courtCost?: number;
  shuttlecockPiecesUsed?: number;
  shuttlecockProductId?: string | null;
  shuttlecockProductName?: string | null;
  totalIncome?: number;
  totalExpense?: number;
  totalProfit?: number;
}): Promise<PlaySessionSummary> {
  if (!input.name?.trim()) throw new AppError('Vui lòng nhập tên ca chơi.');
  if (!input.startTime || !input.endTime) throw new AppError('Vui lòng nhập thời gian bắt đầu và kết thúc.');
  if (input.startTime >= input.endTime) throw new AppError('Giờ kết thúc phải sau giờ bắt đầu.');
  if (!Number.isFinite(Number(input.courtCount)) || Number(input.courtCount) < 1) throw new AppError('Vui lòng nhập số sân hợp lệ.');

  const courtCount = Math.max(1, Math.min(12, Math.floor(input.courtCount || 1)));
  const playDate = await prisma.play_dates.findUnique({ where: { id: input.playDateId }, select: { play_date: true } });
  if (!playDate) throw new AppError('Không tìm thấy ngày chơi.', 404);
  if (isPastDateInput(toDateInput(playDate.play_date))) {
    throw new AppError('Ngày chơi đã thuộc quá khứ, không thể tạo thêm ca chơi.');
  }

  const created = await prisma.play_sessions.create({
    data: {
      play_date_id: input.playDateId,
      name: input.name.trim() || 'Ca chơi',
      start_time: parseTimeInput(input.startTime),
      end_time: parseTimeInput(input.endTime),
      court_count: courtCount,
      note: input.note?.trim() || null,
      status: toDatabaseSessionStatus(input.status ?? 'PENDING')
    }
  });

  return mapSession(created);
}

export async function updatePlaySession(sessionId: string, input: {
  name?: string;
  startTime?: string;
  endTime?: string;
  courtCount?: number;
  note?: string | null;
  status?: string;
  courtCost?: number;
  shuttlecockPiecesUsed?: number;
  shuttlecockProductId?: string | null;
  shuttlecockProductName?: string | null;
  totalIncome?: number;
  totalExpense?: number;
  totalProfit?: number;
}): Promise<PlaySessionSummary> {
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.play_sessions.findUnique({
      where: { id: sessionId },
      include: { play_dates: { select: { play_date: true } } }
    });
    if (!existing) {
      throw new AppError('Không tìm thấy ca chơi.', 404);
    }

    const hasStructuralEdit = input.name !== undefined || input.startTime !== undefined || input.endTime !== undefined || input.courtCount !== undefined || input.note !== undefined;
    const isPastPlayDate = isPastDateInput(toDateInput(existing.play_dates.play_date));
    if (hasStructuralEdit && normalizeSessionStatus(existing.status) !== 'PENDING') {
      throw new AppError('Chỉ có thể chỉnh sửa ca chơi khi ca chưa bắt đầu điều phối.');
    }
    if (hasStructuralEdit && isPastPlayDate) {
      throw new AppError('Ngày chơi đã thuộc quá khứ, không thể chỉnh sửa thông tin ca chơi.');
    }

    if (input.startTime && input.endTime && input.startTime >= input.endTime) {
      throw new AppError('Giờ kết thúc phải sau giờ bắt đầu.');
    }

    if (input.status && toDatabaseSessionStatus(input.status) === 'LIVE') {
      if (isPastPlayDate) {
        throw new AppError('Ngày chơi đã thuộc quá khứ, không thể bắt đầu điều phối ca.');
      }
      const playerCount = await tx.session_players.count({ where: { session_id: sessionId } });
      const requiredPlayers = existing.court_count * 6;
      if (playerCount < requiredPlayers) {
        throw new Error(`Cần ít nhất ${requiredPlayers} người chơi để bắt đầu ca ${existing.court_count} sân`);
      }
    }

    const nextCourtCount = input.courtCount === undefined ? existing.court_count : Math.max(1, Math.min(12, Math.floor(input.courtCount)));
    const session = await tx.play_sessions.update({
      where: { id: sessionId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() || existing.name } : {}),
        ...(input.startTime ? { start_time: parseTimeInput(input.startTime) } : {}),
        ...(input.endTime ? { end_time: parseTimeInput(input.endTime) } : {}),
        ...(input.courtCount !== undefined ? { court_count: nextCourtCount } : {}),
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
        ...(input.status ? { status: toDatabaseSessionStatus(input.status) } : {}),
        ...(input.courtCost !== undefined ? { court_cost: Number(input.courtCost || 0) } : {}),
        ...(input.shuttlecockPiecesUsed !== undefined ? { shuttlecock_pieces_used: Math.max(0, Math.floor(Number(input.shuttlecockPiecesUsed || 0))) } : {}),
        ...(input.shuttlecockProductId !== undefined ? { shuttlecock_product_id: input.shuttlecockProductId || null } : {}),
        ...(input.shuttlecockProductName !== undefined ? { shuttlecock_product_name: input.shuttlecockProductName?.trim() || null } : {}),
        ...(input.totalIncome !== undefined ? { total_income: Number(input.totalIncome || 0) } : {}),
        ...(input.totalExpense !== undefined ? { total_expense: Number(input.totalExpense || 0) } : {}),
        ...(input.totalProfit !== undefined ? { total_profit: Number(input.totalProfit || 0) } : {}),
        updated_at: new Date()
      }
    });

    return session;
  });

  return mapSession(updated);
}

export async function deletePlaySession(sessionId: string): Promise<void> {
  const existing = await prisma.play_sessions.findUnique({
    where: { id: sessionId },
    include: { play_dates: { select: { play_date: true } } }
  });
  if (!existing) throw new AppError('Không tìm thấy ca chơi.', 404);
  if (isPastDateInput(toDateInput(existing.play_dates.play_date))) {
    throw new AppError('Ngày chơi đã thuộc quá khứ, không thể xóa ca chơi.');
  }
  if (normalizeSessionStatus(existing.status) !== 'PENDING') {
    throw new AppError('Chỉ có thể xóa ca chơi khi ca chưa bắt đầu điều phối.');
  }

  await prisma.play_sessions.delete({ where: { id: sessionId } });
}
