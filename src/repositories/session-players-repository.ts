import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import type { SessionPlayerSummary } from '@/types/domain';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function mapPlayer(row: {
  id: string;
  session_id: string;
  full_name: string;
  gender: string | null;
  level: number;
  total_matches: number;
  payment_amount: unknown;
  discount: unknown;
  payment_method: string | null;
  payment_status: string;
  runtime_status: string | null;
  last_court_number: number | null;
  note: string | null;
  joined_at: Date | null;
}): SessionPlayerSummary {
  return {
    id: row.id,
    sessionId: row.session_id,
    fullName: row.full_name,
    gender: row.gender,
    level: row.level,
    totalMatches: row.total_matches,
    paymentAmount: toNumber(row.payment_amount),
    discount: toNumber(row.discount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    runtimeStatus: row.runtime_status,
    lastCourtNumber: row.last_court_number,
    note: row.note,
    joinedAt: toIso(row.joined_at)
  };
}

async function refreshSessionPlayerCount(sessionId: string): Promise<void> {
  const totalPlayers = await prisma.session_players.count({ where: { session_id: sessionId } });
  const existing = await prisma.session_summaries.findFirst({ where: { session_id: sessionId } });

  if (existing) {
    await prisma.session_summaries.update({
      where: { id: existing.id },
      data: { total_players: totalPlayers }
    });
    return;
  }

  await prisma.session_summaries.create({
    data: {
      session_id: sessionId,
      total_players: totalPlayers
    }
  });
}

export async function listSessionPlayers(sessionId: string): Promise<SessionPlayerSummary[]> {
  const rows = await prisma.session_players.findMany({
    where: { session_id: sessionId },
    orderBy: [{ joined_at: 'asc' }, { full_name: 'asc' }]
  });

  return rows.map(mapPlayer);
}

export async function createSessionPlayer(input: {
  sessionId: string;
  fullName: string;
  gender?: string | null;
  level?: number;
  paymentAmount?: number;
  discount?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
  note?: string | null;
}): Promise<SessionPlayerSummary> {
  if (!input.fullName?.trim()) throw new AppError('Vui lòng nhập tên người chơi.');
  if (Number(input.paymentAmount ?? 0) < 0) throw new AppError('Phí người chơi không được âm.');
  if (Number(input.discount ?? 0) < 0) throw new AppError('Giảm giá không được âm.');

  const row = await prisma.session_players.create({
    data: {
      session_id: input.sessionId,
      full_name: input.fullName.trim(),
      gender: input.gender?.trim() || null,
      level: Math.max(1, Math.min(5, Math.floor(input.level ?? 1))),
      payment_amount: Number(input.paymentAmount ?? 0),
      discount: Number(input.discount ?? 0),
      payment_method: input.paymentMethod?.trim() || null,
      payment_status: input.paymentStatus ?? 'UNPAID',
      runtime_status: 'WAITING',
      note: input.note?.trim() || null
    }
  });

  await refreshSessionPlayerCount(input.sessionId);

  return mapPlayer(row);
}

export async function updateSessionPlayer(playerId: string, input: {
  fullName?: string;
  gender?: string | null;
  level?: number;
  paymentAmount?: number;
  discount?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
  note?: string | null;
}): Promise<SessionPlayerSummary> {
  const existing = await prisma.session_players.findUnique({ where: { id: playerId } });
  if (!existing) {
    throw new AppError('Không tìm thấy người chơi.', 404);
  }

  if (input.fullName !== undefined && !input.fullName.trim()) throw new AppError('Tên người chơi không được bỏ trống.');
  if (input.paymentAmount !== undefined && Number(input.paymentAmount) < 0) throw new AppError('Phí người chơi không được âm.');
  if (input.discount !== undefined && Number(input.discount) < 0) throw new AppError('Giảm giá không được âm.');

  const row = await prisma.session_players.update({
    where: { id: playerId },
    data: {
      ...(input.fullName !== undefined ? { full_name: input.fullName.trim() || existing.full_name } : {}),
      ...(input.gender !== undefined ? { gender: input.gender?.trim() || null } : {}),
      ...(input.level !== undefined ? { level: Math.max(1, Math.min(5, Math.floor(input.level))) } : {}),
      ...(input.paymentAmount !== undefined ? { payment_amount: Number(input.paymentAmount) } : {}),
      ...(input.discount !== undefined ? { discount: Number(input.discount) } : {}),
      ...(input.paymentMethod !== undefined ? { payment_method: input.paymentMethod?.trim() || null } : {}),
      ...(input.paymentStatus !== undefined ? { payment_status: input.paymentStatus } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {})
    }
  });

  return mapPlayer(row);
}

export async function deleteSessionPlayer(playerId: string): Promise<void> {
  const existing = await prisma.session_players.findUnique({ where: { id: playerId } });
  if (!existing) {
    return;
  }

  await prisma.session_players.delete({ where: { id: playerId } });
  await refreshSessionPlayerCount(existing.session_id);
}
