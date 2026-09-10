import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/app-error';
import { normalizePlayerTags } from '@/lib/player-tags';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import type { SessionCoupleMatchMode, SessionCoupleSummary } from '@/types/domain';

type TransactionClient = Prisma.TransactionClient;

type CouplePlayerRow = {
  id: string;
  session_id: string;
  full_name: string;
  gender: string | null;
  level: number;
  player_tags: string[];
  couple_number: number | null;
  couple_match_mode: string | null;
  next_match_requested_at: Date | null;
  joined_at: Date | null;
};

function normalizeMode(value: unknown): SessionCoupleMatchMode {
  const mode = String(value ?? '').trim().toUpperCase();
  if (mode === 'MEN' || mode === 'WOMEN' || mode === 'MIXED') return mode;
  throw new AppError('Nội dung Couple không hợp lệ.');
}

function normalizeGender(value: string | null): 'MEN' | 'WOMEN' {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'nữ' || normalized === 'nu' || normalized === 'female' || normalized === 'f' ? 'WOMEN' : 'MEN';
}

function parseDate(value: string | number | Date | null): Date | null {
  if (value === null) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new AppError('Thời điểm yêu cầu trận kế của Couple không hợp lệ.');
  return parsed;
}

function createCoupleId(sessionId: string, displayNumber: number): string {
  return `${sessionId}:${displayNumber}`;
}

function parseCoupleId(coupleId: string): { sessionId: string; displayNumber: number } {
  const separator = coupleId.lastIndexOf(':');
  const sessionId = separator > 0 ? coupleId.slice(0, separator) : '';
  const displayNumber = Number(separator > 0 ? coupleId.slice(separator + 1) : NaN);
  if (!sessionId || !Number.isInteger(displayNumber) || displayNumber <= 0) {
    throw new AppError('Mã Couple không hợp lệ.', 400);
  }
  return { sessionId, displayNumber };
}

function validateGender(players: CouplePlayerRow[], matchMode: SessionCoupleMatchMode): void {
  const genders = players.map((player) => normalizeGender(player.gender));
  const valid = matchMode === 'MIXED'
    ? genders.filter((gender) => gender === 'MEN').length === 1
    : genders.every((gender) => gender === matchMode);
  if (!valid) throw new AppError('Giới tính của hai người chơi không phù hợp nội dung Couple đã chọn.');
}

function mapCouple(
  sessionId: string,
  displayNumber: number,
  matchMode: SessionCoupleMatchMode,
  players: CouplePlayerRow[]
): SessionCoupleSummary {
  if (players.length !== 2) throw new AppError(`Couple_${displayNumber} không có đủ hai thành viên.`, 409);
  const ordered = [...players].sort((left, right) => {
    const leftJoined = left.joined_at?.getTime() ?? 0;
    const rightJoined = right.joined_at?.getTime() ?? 0;
    return leftJoined - rightJoined || left.id.localeCompare(right.id);
  });
  const requestTimes = ordered.map((player) => player.next_match_requested_at?.getTime() ?? null);
  const sharedRequestTime = requestTimes[0] !== null && requestTimes[0] === requestTimes[1]
    ? new Date(requestTimes[0]).toISOString()
    : null;

  return {
    id: createCoupleId(sessionId, displayNumber),
    sessionId,
    displayNumber,
    matchMode,
    active: true,
    nextMatchRequestedAt: sharedRequestTime,
    members: ordered.map((player) => ({
      playerId: player.id,
      fullName: player.full_name,
      gender: player.gender,
      level: player.level
    })) as SessionCoupleSummary['members'],
    createdAt: null,
    updatedAt: null
  };
}

async function loadMembers(
  tx: TransactionClient,
  sessionId: string,
  memberIds: string[],
  clubId: string,
  allowedCoupleNumber?: number
): Promise<CouplePlayerRow[]> {
  const uniqueIds = [...new Set(memberIds)];
  if (uniqueIds.length !== 2) throw new AppError('Couple cần đúng hai người chơi khác nhau.');

  const players = await tx.session_players.findMany({
    where: { session_id: sessionId, club_id: clubId, id: { in: uniqueIds } }
  });
  if (players.length !== 2) throw new AppError('Hai thành viên Couple phải thuộc cùng ca chơi.');

  const occupied = players.find((player) => (
    player.couple_number !== null && player.couple_number !== allowedCoupleNumber
  ));
  if (occupied) throw new AppError(`Người chơi đã thuộc Couple_${occupied.couple_number}.`, 409);
  return players;
}

async function writeCoupleMembers(
  tx: TransactionClient,
  players: CouplePlayerRow[],
  displayNumber: number,
  matchMode: SessionCoupleMatchMode,
  clubId: string,
  nextMatchRequestedAt?: string | number | Date | null
): Promise<CouplePlayerRow[]> {
  const requestDate = nextMatchRequestedAt === undefined ? undefined : parseDate(nextMatchRequestedAt);
  const updated: CouplePlayerRow[] = [];
  for (const player of players) {
    const tags = requestDate === undefined
      ? normalizePlayerTags(player.player_tags)
      : requestDate === null
        ? normalizePlayerTags(player.player_tags).filter((tag) => tag !== 'PRIORITY')
        : normalizePlayerTags([...player.player_tags, 'PRIORITY']);
    updated.push(await tx.session_players.update({
      where: { id: player.id, club_id: clubId },
      data: {
        couple_number: displayNumber,
        couple_match_mode: matchMode,
        ...(requestDate !== undefined ? {
          next_match_requested_at: requestDate,
          next_match_request_mode: requestDate === null ? null : matchMode,
          player_tags: tags
        } : {})
      }
    }));
  }
  return updated;
}

export async function listSessionCouples(sessionId: string): Promise<SessionCoupleSummary[]> {
  const { clubId } = requireTenantContext('session_couple.list');
  const session = await prisma.play_sessions.findUnique({
    where: { id: sessionId, club_id: clubId },
    select: { id: true }
  });
  if (!session) throw new AppError('Không tìm thấy ca chơi.', 404);
  const players = await prisma.session_players.findMany({
    where: { session_id: sessionId, club_id: clubId, couple_number: { not: null } },
    orderBy: [{ couple_number: 'asc' }, { joined_at: 'asc' }, { id: 'asc' }]
  });
  const groups = new Map<string, CouplePlayerRow[]>();
  for (const player of players) {
    if (player.couple_number === null || player.couple_match_mode === null) continue;
    const key = `${player.couple_number}:${player.couple_match_mode}`;
    groups.set(key, [...(groups.get(key) ?? []), player]);
  }

  return [...groups.entries()].flatMap(([key, members]) => {
    if (members.length !== 2) return [];
    const [numberValue, modeValue] = key.split(':');
    return [mapCouple(sessionId, Number(numberValue), normalizeMode(modeValue), members)];
  });
}

export async function createSessionCouple(input: {
  sessionId: string;
  memberIds: string[];
  matchMode: SessionCoupleMatchMode;
  nextMatchRequestedAt?: string | number | Date | null;
}): Promise<SessionCoupleSummary> {
  const matchMode = normalizeMode(input.matchMode);
  const { clubId } = requireTenantContext('session_couple.create');
  return prisma.$transaction(async (tx) => {
    const players = await loadMembers(tx, input.sessionId, input.memberIds, clubId);
    validateGender(players, matchMode);
    let session: { next_couple_number: number };
    try {
      session = await tx.play_sessions.update({
        where: { id: input.sessionId, club_id: clubId },
        data: { next_couple_number: { increment: 1 }, updated_at: new Date() },
        select: { next_couple_number: true }
      });
    } catch {
      throw new AppError('Không tìm thấy ca chơi.', 404);
    }
    const displayNumber = session.next_couple_number - 1;
    const reserved = await tx.session_players.updateMany({
      where: { session_id: input.sessionId, club_id: clubId, id: { in: players.map((player) => player.id) }, couple_number: null },
      data: { couple_number: displayNumber, couple_match_mode: matchMode }
    });
    if (reserved.count !== 2) throw new AppError('Một người chơi vừa được đánh dấu vào Couple khác.', 409);
    const updated = await writeCoupleMembers(tx, players, displayNumber, matchMode, clubId, input.nextMatchRequestedAt);
    return mapCouple(input.sessionId, displayNumber, matchMode, updated);
  });
}

export async function updateSessionCouple(coupleId: string, input: {
  memberIds?: string[];
  matchMode?: SessionCoupleMatchMode;
  active?: boolean;
  nextMatchRequestedAt?: string | number | Date | null;
}): Promise<SessionCoupleSummary> {
  const { sessionId, displayNumber } = parseCoupleId(coupleId);
  const { clubId } = requireTenantContext('session_couple.update');
  if (input.active === false) {
    const current = await listSessionCouples(sessionId);
    const summary = current.find((couple) => couple.displayNumber === displayNumber);
    if (!summary) throw new AppError('Không tìm thấy Couple.', 404);
    await deleteSessionCouple(coupleId);
    return { ...summary, active: false };
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.session_players.findMany({
      where: { session_id: sessionId, club_id: clubId, couple_number: displayNumber }
    });
    if (current.length !== 2) throw new AppError('Không tìm thấy Couple hoặc dữ liệu Couple không hợp lệ.', 404);
    const matchMode = input.matchMode === undefined
      ? normalizeMode(current[0].couple_match_mode)
      : normalizeMode(input.matchMode);
    const memberIds = input.memberIds ?? current.map((player) => player.id);
    const players = await loadMembers(tx, sessionId, memberIds, clubId, displayNumber);
    validateGender(players, matchMode);

    const retainedIds = new Set(players.map((player) => player.id));
    const removedIds = current.map((player) => player.id).filter((id) => !retainedIds.has(id));
    if (removedIds.length > 0) {
      await tx.session_players.updateMany({
        where: { id: { in: removedIds }, session_id: sessionId, club_id: clubId, couple_number: displayNumber },
        data: { couple_number: null, couple_match_mode: null }
      });
    }
    const updated = await writeCoupleMembers(tx, players, displayNumber, matchMode, clubId, input.nextMatchRequestedAt);
    return mapCouple(sessionId, displayNumber, matchMode, updated);
  });
}

export async function deleteSessionCouple(coupleId: string): Promise<void> {
  const { sessionId, displayNumber } = parseCoupleId(coupleId);
  const { clubId } = requireTenantContext('session_couple.delete');
  const result = await prisma.session_players.updateMany({
    where: { session_id: sessionId, club_id: clubId, couple_number: displayNumber },
    data: { couple_number: null, couple_match_mode: null }
  });
  if (result.count === 0) throw new AppError('Không tìm thấy Couple.', 404);
}
