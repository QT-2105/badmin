import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';
import type { SessionPlayerSummary } from '@/types/domain';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toDate(value: string | number | Date | null): Date | null {
  if (value === null) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new AppError('Thời điểm điều phối người chơi không hợp lệ.');
  return parsed;
}

function normalizeNextMatchMode(value: SessionPlayerSummary['nextMatchRequestMode'] | null | undefined) {
  if (value === null || value === undefined) return value ?? null;
  const normalized = String(value).trim().toUpperCase();
  if (normalized === 'ANY' || normalized === 'MEN' || normalized === 'WOMEN' || normalized === 'MIXED') return normalized;
  throw new AppError('Nội dung yêu cầu trận kế không hợp lệ.');
}

function normalizeCoupleGender(value: string | null | undefined): 'MEN' | 'WOMEN' {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'nữ' || normalized === 'nu' || normalized === 'female' || normalized === 'f' ? 'WOMEN' : 'MEN';
}

function runtimeTeamContainsPlayer(value: unknown, playerId: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === 'string') return item === playerId;
      if (!item || typeof item !== 'object') return false;
      const record = item as Record<string, unknown>;
      return [record.id, record.playerId, record.player_id, record.sessionPlayerId, record.session_player_id].includes(playerId);
    });
  }
  if (value && typeof value === 'object') {
    return runtimeTeamContainsPlayer((value as Record<string, unknown>).players, playerId);
  }
  return false;
}

async function getArrivalBaseline(sessionId: string, excludedPlayerId?: string): Promise<number> {
  const peers = await prisma.session_players.findMany({
    where: {
      session_id: sessionId,
      ...(excludedPlayerId ? { id: { not: excludedPlayerId } } : {})
    },
    select: { total_matches: true, fairness_offset: true, player_tags: true }
  });
  const adjustedMatches = peers
    .filter((player) => normalizePlayerTags(player.player_tags).includes('ARRIVED'))
    .map((player) => player.total_matches + player.fairness_offset)
    .sort((left, right) => left - right);

  if (adjustedMatches.length === 0) return 0;
  return Math.floor(adjustedMatches[Math.floor((adjustedMatches.length - 1) / 2)]);
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
  player_tags: string[];
  avatar_url: string | null;
  avatar_s3_key: string | null;
  joined_at: Date | null;
  first_arrived_at: Date | null;
  arrival_baseline_matches: number | null;
  fairness_offset: number;
  deferred_rounds: number;
  waiting_since: Date | null;
  entry_priority_consumed_at: Date | null;
  last_finished_at: Date | null;
  next_match_requested_at: Date | null;
  next_match_request_mode: string | null;
  end_game_at: Date | null;
  end_game_after_match: boolean;
  couple_number: number | null;
  couple_match_mode: string | null;
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
    playerTags: normalizePlayerTags(row.player_tags),
    avatarUrl: row.avatar_url,
    avatarS3Key: row.avatar_s3_key,
    joinedAt: toIso(row.joined_at),
    firstArrivedAt: toIso(row.first_arrived_at),
    arrivalBaselineMatches: row.arrival_baseline_matches,
    fairnessOffset: row.fairness_offset,
    deferredRounds: row.deferred_rounds,
    waitingSince: toIso(row.waiting_since),
    entryPriorityConsumedAt: toIso(row.entry_priority_consumed_at),
    lastFinishedAt: toIso(row.last_finished_at),
    nextMatchRequestedAt: toIso(row.next_match_requested_at),
    nextMatchRequestMode: row.next_match_request_mode as SessionPlayerSummary['nextMatchRequestMode'],
    endGameAt: toIso(row.end_game_at),
    endGameAfterMatch: row.end_game_after_match,
    coupleNumber: row.couple_number,
    coupleMatchMode: row.couple_match_mode as SessionPlayerSummary['coupleMatchMode']
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
  playerTags?: PlayerTag[];
  firstArrivedAt?: string | number | Date | null;
  arrivalBaselineMatches?: number | null;
  fairnessOffset?: number;
  deferredRounds?: number;
  waitingSince?: string | number | Date | null;
  entryPriorityConsumedAt?: string | number | Date | null;
  lastFinishedAt?: string | number | Date | null;
  nextMatchRequestedAt?: string | number | Date | null;
  nextMatchRequestMode?: SessionPlayerSummary['nextMatchRequestMode'];
  endGameAt?: string | number | Date | null;
  endGameAfterMatch?: boolean;
}): Promise<SessionPlayerSummary> {
  if (!input.fullName?.trim()) throw new AppError('Vui lòng nhập tên người chơi.');
  if (Number(input.paymentAmount ?? 0) < 0) throw new AppError('Phí người chơi không được âm.');
  if (Number(input.discount ?? 0) < 0) throw new AppError('Giảm giá không được âm.');

  const now = new Date();
  const playerTags = normalizePlayerTags(input.playerTags);
  const arrived = playerTags.includes('ARRIVED');
  const endGame = playerTags.includes('END_GAME');
  const nextMatchRequested = playerTags.includes('PRIORITY');
  const arrivalBaseline = input.arrivalBaselineMatches === undefined && arrived
    ? await getArrivalBaseline(input.sessionId)
    : input.arrivalBaselineMatches;

  const row = await prisma.session_players.create({
    data: {
      session_id: input.sessionId,
      full_name: input.fullName.trim(),
      gender: input.gender?.trim() || null,
      level: Math.max(1, Math.min(6, Math.floor(input.level ?? 1))),
      payment_amount: Number(input.paymentAmount ?? 0),
      discount: Number(input.discount ?? 0),
      payment_method: input.paymentMethod?.trim() || null,
      payment_status: input.paymentStatus ?? 'UNPAID',
      runtime_status: endGame ? 'FINISHED' : 'WAITING',
      note: input.note?.trim() || null,
      player_tags: playerTags,
      first_arrived_at: input.firstArrivedAt === undefined ? arrived ? now : undefined : toDate(input.firstArrivedAt),
      arrival_baseline_matches: arrivalBaseline,
      fairness_offset: Math.max(0, Math.floor(input.fairnessOffset ?? arrivalBaseline ?? 0)),
      deferred_rounds: Math.max(0, Math.floor(input.deferredRounds ?? 0)),
      waiting_since: input.waitingSince === undefined ? arrived && !endGame ? now : undefined : toDate(input.waitingSince),
      entry_priority_consumed_at: input.entryPriorityConsumedAt === undefined ? undefined : toDate(input.entryPriorityConsumedAt),
      last_finished_at: input.lastFinishedAt === undefined ? undefined : toDate(input.lastFinishedAt),
      next_match_requested_at: input.nextMatchRequestedAt === undefined ? nextMatchRequested ? now : undefined : toDate(input.nextMatchRequestedAt),
      next_match_request_mode: input.nextMatchRequestMode === undefined && nextMatchRequested ? 'ANY' : normalizeNextMatchMode(input.nextMatchRequestMode),
      end_game_at: input.endGameAt === undefined ? endGame ? now : undefined : toDate(input.endGameAt),
      end_game_after_match: input.endGameAfterMatch ?? false
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
  playerTags?: PlayerTag[];
  firstArrivedAt?: string | number | Date | null;
  arrivalBaselineMatches?: number | null;
  fairnessOffset?: number;
  deferredRounds?: number;
  waitingSince?: string | number | Date | null;
  entryPriorityConsumedAt?: string | number | Date | null;
  lastFinishedAt?: string | number | Date | null;
  nextMatchRequestedAt?: string | number | Date | null;
  nextMatchRequestMode?: SessionPlayerSummary['nextMatchRequestMode'] | null;
  endGameAt?: string | number | Date | null;
  endGameAfterMatch?: boolean;
}): Promise<SessionPlayerSummary> {
  const existing = await prisma.session_players.findUnique({ where: { id: playerId } });
  if (!existing) {
    throw new AppError('Không tìm thấy người chơi.', 404);
  }

  if (input.fullName !== undefined && !input.fullName.trim()) throw new AppError('Tên người chơi không được bỏ trống.');
  if (input.paymentAmount !== undefined && Number(input.paymentAmount) < 0) throw new AppError('Phí người chơi không được âm.');
  if (input.discount !== undefined && Number(input.discount) < 0) throw new AppError('Giảm giá không được âm.');

  if (input.gender !== undefined && existing.couple_number !== null && existing.couple_match_mode !== null) {
    const partner = await prisma.session_players.findFirst({
      where: {
        session_id: existing.session_id,
        couple_number: existing.couple_number,
        id: { not: existing.id }
      },
      select: { gender: true }
    });
    if (!partner) throw new AppError(`Couple_${existing.couple_number} không còn đủ hai thành viên.`, 409);
    const genders = [normalizeCoupleGender(input.gender), normalizeCoupleGender(partner.gender)];
    const valid = existing.couple_match_mode === 'MIXED'
      ? genders.filter((gender) => gender === 'MEN').length === 1
      : genders.every((gender) => gender === existing.couple_match_mode);
    if (!valid) throw new AppError(`Giới tính mới không phù hợp với Couple_${existing.couple_number}.`, 409);
  }

  const now = new Date();
  const currentTags = normalizePlayerTags(existing.player_tags);
  const nextTags = input.playerTags === undefined ? currentTags : normalizePlayerTags(input.playerTags);
  const wasArrived = currentTags.includes('ARRIVED');
  const isArrived = nextTags.includes('ARRIVED');
  const hadNextRequest = currentTags.includes('PRIORITY');
  const hasNextRequest = nextTags.includes('PRIORITY');
  const wasEndGame = currentTags.includes('END_GAME');
  const isEndGame = nextTags.includes('END_GAME');
  const newlyArrived = !wasArrived && isArrived;
  const arrivalBaseline = newlyArrived && existing.first_arrived_at === null
    ? await getArrivalBaseline(existing.session_id, existing.id)
    : null;

  const derivedTagData = input.playerTags === undefined ? {} : {
    player_tags: nextTags,
    ...(!isArrived || isEndGame
      ? { waiting_since: null }
      : newlyArrived || wasEndGame
        ? { waiting_since: now }
        : {}),
    ...(newlyArrived && existing.first_arrived_at === null
      ? {
          first_arrived_at: now,
          arrival_baseline_matches: arrivalBaseline,
          fairness_offset: arrivalBaseline ?? 0
        }
      : {}),
    ...(hasNextRequest && !hadNextRequest
      ? { next_match_requested_at: now, next_match_request_mode: 'ANY' }
      : !hasNextRequest && hadNextRequest
        ? { next_match_requested_at: null, next_match_request_mode: null }
        : {}),
    ...(isEndGame
      ? {
          end_game_at: existing.end_game_at ?? now,
          end_game_after_match: existing.runtime_status === 'PLAYING',
          ...(existing.runtime_status === 'PLAYING' ? {} : { runtime_status: 'FINISHED' })
        }
      : wasEndGame
        ? {
            end_game_at: null,
            end_game_after_match: false,
            ...(existing.runtime_status === 'FINISHED' ? { runtime_status: isArrived ? 'WAITING' : 'FINISHED' } : {})
          }
        : !isArrived && existing.runtime_status !== 'PLAYING'
          ? { runtime_status: 'FINISHED' }
          : newlyArrived && existing.runtime_status !== 'PLAYING'
            ? { runtime_status: 'WAITING' }
            : {})
  };

  const row = await prisma.session_players.update({
    where: { id: playerId },
    data: {
      ...(input.fullName !== undefined ? { full_name: input.fullName.trim() || existing.full_name } : {}),
      ...(input.gender !== undefined ? { gender: input.gender?.trim() || null } : {}),
      ...(input.level !== undefined ? { level: Math.max(1, Math.min(6, Math.floor(input.level))) } : {}),
      ...(input.paymentAmount !== undefined ? { payment_amount: Number(input.paymentAmount) } : {}),
      ...(input.discount !== undefined ? { discount: Number(input.discount) } : {}),
      ...(input.paymentMethod !== undefined ? { payment_method: input.paymentMethod?.trim() || null } : {}),
      ...(input.paymentStatus !== undefined ? { payment_status: input.paymentStatus } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      ...derivedTagData,
      ...(input.firstArrivedAt !== undefined ? { first_arrived_at: toDate(input.firstArrivedAt) } : {}),
      ...(input.arrivalBaselineMatches !== undefined ? { arrival_baseline_matches: input.arrivalBaselineMatches === null ? null : Math.max(0, Math.floor(input.arrivalBaselineMatches)) } : {}),
      ...(input.fairnessOffset !== undefined ? { fairness_offset: Math.max(0, Math.floor(input.fairnessOffset)) } : {}),
      ...(input.deferredRounds !== undefined ? { deferred_rounds: Math.max(0, Math.floor(input.deferredRounds)) } : {}),
      ...(input.waitingSince !== undefined ? { waiting_since: toDate(input.waitingSince) } : {}),
      ...(input.entryPriorityConsumedAt !== undefined ? { entry_priority_consumed_at: toDate(input.entryPriorityConsumedAt) } : {}),
      ...(input.lastFinishedAt !== undefined ? { last_finished_at: toDate(input.lastFinishedAt) } : {}),
      ...(input.nextMatchRequestedAt !== undefined ? { next_match_requested_at: toDate(input.nextMatchRequestedAt) } : {}),
      ...(input.nextMatchRequestMode !== undefined ? { next_match_request_mode: normalizeNextMatchMode(input.nextMatchRequestMode) } : {}),
      ...(input.endGameAt !== undefined ? { end_game_at: toDate(input.endGameAt) } : {}),
      ...(input.endGameAfterMatch !== undefined ? { end_game_after_match: input.endGameAfterMatch } : {})
    }
  });

  return mapPlayer(row);
}

export async function deleteSessionPlayer(playerId: string): Promise<void> {
  const existing = await prisma.session_players.findUnique({ where: { id: playerId } });
  if (!existing) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (existing.runtime_status === 'PLAYING' || existing.runtime_status === 'PRIORITY') {
      throw new AppError('Không thể xóa người chơi đang được xếp ở sân. Hãy hủy hoặc kết thúc trận trước.', 409);
    }
    if (existing.couple_number !== null) {
      throw new AppError(`Hãy gỡ Couple_${existing.couple_number} trước khi xóa người chơi.`, 409);
    }
    const runtimeMatches = await tx.runtime_matches.findMany({
      where: { session_id: existing.session_id },
      select: { team_a: true, team_b: true, queue_order: true, court_number: true }
    });
    const referencedMatch = runtimeMatches.find((match) => (
      runtimeTeamContainsPlayer(match.team_a, playerId) || runtimeTeamContainsPlayer(match.team_b, playerId)
    ));
    if (referencedMatch) {
      const location = referencedMatch.court_number !== null
        ? `Sân ${referencedMatch.court_number}`
        : `Gợi ý #${referencedMatch.queue_order ?? '?'}`;
      throw new AppError(`Không thể xóa người chơi đang nằm trong ${location}.`, 409);
    }
    await tx.session_players.delete({ where: { id: playerId } });
  });
  await refreshSessionPlayerCount(existing.session_id);
}
