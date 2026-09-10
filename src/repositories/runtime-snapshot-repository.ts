import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/app-error';
import { normalizePlayerTags } from '@/lib/player-tags';
import { prisma } from '@/lib/prisma';
import type { RuntimeRecentQuartet, RuntimeSnapshot, RuntimeSyncPayload } from '@/types/runtime';
import { listRuntimeCourts, listSessionCourtsAsRuntime } from './runtime-courts-repository';
import { listRuntimeMatches } from './runtime-matches-repository';
import { getRuntimeSession, listSessionPlayers, resolveRuntimeSessionId } from './runtime-session-repository';
import { requireTenantContext } from '@/lib/tenant-context';

const RECENT_QUARTET_LIMIT = 16;

export class RuntimeVersionConflictError extends AppError {
  currentVersion: number;

  constructor(currentVersion: number, message = 'Điều phối đã thay đổi trên thiết bị khác. Vui lòng đồng bộ lại trước khi lưu.') {
    super(message, 409);
    this.currentVersion = currentVersion;
  }
}

function rosterToTeams(roster: Array<string | null>) {
  const clean = roster.filter((value): value is string => Boolean(value));
  return {
    teamA: clean.slice(0, 2),
    teamB: clean.slice(2, 4)
  };
}

function parseCourtNumber(courtId: string): number {
  const match = courtId.trim().match(/(\d+)$/);
  return match ? Number(match[0]) : 0;
}

function toDate(value: number | null): Date | null {
  if (value === null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new AppError('Thời điểm runtime không hợp lệ.');
  return parsed;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new AppError(`${label} không hợp lệ.`);
  return Math.floor(value);
}

function normalizeRequestMode(value: unknown): 'ANY' | 'MEN' | 'WOMEN' | 'MIXED' | null {
  if (value === null || value === undefined || value === '') return null;
  const mode = String(value).trim().toUpperCase();
  if (mode === 'ANY' || mode === 'MEN' || mode === 'WOMEN' || mode === 'MIXED') return mode;
  throw new AppError('Nội dung yêu cầu trận kế không hợp lệ.');
}

function normalizeMatchFormat(value: unknown): 'AUTO' | 'MEN' | 'WOMEN' | 'MIXED' | null {
  if (value === null || value === undefined || value === '') return null;
  const format = String(value).trim().toUpperCase();
  if (format === 'AUTO' || format === 'MEN' || format === 'WOMEN' || format === 'MIXED') return format;
  throw new AppError('Nội dung gợi ý không hợp lệ.');
}

function normalizeCoupleMode(value: unknown): 'MEN' | 'WOMEN' | 'MIXED' | null {
  const format = normalizeMatchFormat(value);
  if (format === null || format === 'MEN' || format === 'WOMEN' || format === 'MIXED') return format;
  throw new AppError('Nội dung Couple không hợp lệ.');
}

function normalizePlayerStatus(value: unknown): RuntimeSyncPayload['players'][number]['status'] {
  const status = String(value ?? '').trim().toUpperCase();
  if (status === 'WAITING' || status === 'JUST_FINISHED' || status === 'PLAYING' || status === 'RESTING' || status === 'PRIORITY' || status === 'FINISHED') {
    return status;
  }
  throw new AppError('Trạng thái người chơi runtime không hợp lệ.');
}

function normalizeCourtStatus(value: unknown): RuntimeSyncPayload['courts'][number]['status'] {
  const status = String(value ?? '').trim().toUpperCase();
  if (status === 'EMPTY' || status === 'READY' || status === 'PLAYING') return status;
  throw new AppError('Trạng thái sân runtime không hợp lệ.');
}

function scalarEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (left instanceof Date && right === null) return false;
  if ((Array.isArray(left) && Array.isArray(right)) || (isPlainObject(left) && isPlainObject(right))) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return left === right;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value);
}

function hasChanges(row: Record<string, unknown>, data: Record<string, unknown>): boolean {
  return Object.entries(data).some(([key, value]) => !scalarEqual(row[key], value));
}

async function listRecentQuartets(sessionId: string): Promise<RuntimeRecentQuartet[]> {
  const { clubId } = requireTenantContext('runtime_snapshot.recent_quartets');
  const rows = await prisma.match_histories.findMany({
    where: { session_id: sessionId, club_id: clubId },
    select: {
      id: true,
      ended_at: true,
      match_history_players: { where: { club_id: clubId }, select: { session_player_id: true } }
    },
    orderBy: [{ ended_at: 'desc' }],
    take: RECENT_QUARTET_LIMIT
  });

  return rows.flatMap((row) => {
    const playerIds = [...new Set(row.match_history_players.map((member) => member.session_player_id))].sort();
    return playerIds.length === 4 ? [{ matchId: row.id, playerIds, endedAt: row.ended_at.getTime() }] : [];
  });
}

export async function getRuntimeSnapshot(sessionId?: string): Promise<RuntimeSnapshot> {
  const resolvedSessionId = await resolveRuntimeSessionId(sessionId);
  if (!resolvedSessionId) {
    return { session: null, players: [], courts: [], matches: [], recentQuartets: [], version: 0 };
  }

  const [session, players, runtimeCourts, matches, recentQuartets] = await Promise.all([
    getRuntimeSession(resolvedSessionId),
    listSessionPlayers(resolvedSessionId),
    listRuntimeCourts(resolvedSessionId),
    listRuntimeMatches(resolvedSessionId),
    listRecentQuartets(resolvedSessionId)
  ]);

  const courts = runtimeCourts.length > 0 ? runtimeCourts : await listSessionCourtsAsRuntime(resolvedSessionId);
  const playerIds = new Set(players.map((player) => player.id));
  const reservedPlayerIds = new Set<string>();
  for (const match of matches) {
    const roster = [...match.teamA, ...match.teamB];
    if (
      match.sessionId !== resolvedSessionId
      || roster.length !== 4
      || new Set(roster).size !== 4
      || roster.some((playerId) => !playerIds.has(playerId))
      || roster.some((playerId) => reservedPlayerIds.has(playerId))
    ) {
      throw new AppError('Dữ liệu người chơi trong runtime snapshot không hợp lệ.', 409);
    }
    roster.forEach((playerId) => reservedPlayerIds.add(playerId));
  }

  return {
    session,
    players,
    courts,
    matches,
    recentQuartets,
    version: session?.runtimeVersion ?? 0
  };
}

export async function syncRuntimeSnapshot(payload: RuntimeSyncPayload): Promise<number> {
  const { sessionId } = payload;
  if (!sessionId) throw new AppError('Không tìm thấy ca điều phối.');
  if (!Array.isArray(payload.players) || !Array.isArray(payload.courts) || !Array.isArray(payload.nextMatches)) {
    throw new AppError('Snapshot điều phối không hợp lệ.');
  }
  const syncMode = payload.mode ?? 'FULL';
  if (syncMode !== 'FULL' && syncMode !== 'DELTA') throw new AppError('Chế độ đồng bộ runtime không hợp lệ.');
  const expectedVersion = payload.expectedVersion;
  if (expectedVersion === undefined || expectedVersion === null) throw new AppError('Phiên bản runtime là bắt buộc.', 409);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
    throw new AppError('Phiên bản runtime không hợp lệ.', 409);
  }
  const { clubId } = requireTenantContext('runtime_snapshot.sync');

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.play_sessions.updateMany({
      where: { id: sessionId, club_id: clubId, status: 'LIVE', runtime_version: expectedVersion },
      data: { runtime_version: { increment: 1 }, updated_at: new Date() }
    });
    if (claimed.count !== 1) {
      const current = await tx.play_sessions.findUnique({
        where: { id: sessionId, club_id: clubId },
        select: { runtime_version: true, status: true }
      });
      if (!current) throw new AppError('Không tìm thấy ca điều phối.', 404);
      if (current.status === 'FINISHED' || current.status === 'CANCELLED') {
        throw new RuntimeVersionConflictError(current.runtime_version, 'Ca chơi đã hoàn tất hoặc hủy, không thể thay đổi điều phối.');
      }
      if (current.status !== 'LIVE') {
        throw new RuntimeVersionConflictError(current.runtime_version, 'Ca chơi chưa ở trạng thái có thể điều phối.');
      }
      throw new RuntimeVersionConflictError(current.runtime_version);
    }
    const version = expectedVersion + 1;

    const playerIds = [...new Set(payload.players.map((player) => player.id))];
    if (playerIds.length !== payload.players.length) throw new AppError('Snapshot chứa người chơi bị trùng.');
    const referencedPlayerIds = [...new Set([
      ...playerIds,
      ...payload.nextMatches.flatMap((match) => match.roster.filter((id): id is string => Boolean(id))),
      ...payload.courts.flatMap((court) => court.roster.filter((id): id is string => Boolean(id)))
    ])];
    const existingPlayers = referencedPlayerIds.length > 0
      ? await tx.session_players.findMany({ where: { session_id: sessionId, club_id: clubId, id: { in: referencedPlayerIds } } })
      : [];
    if (existingPlayers.length !== referencedPlayerIds.length) throw new AppError('Danh sách người chơi runtime không hợp lệ.');
    const playerById = new Map(existingPlayers.map((player) => [player.id, player]));

  for (const player of payload.players) {
      const existing = playerById.get(player.id)!;
      const nextCoupleNumber = player.coupleNumber === undefined ? existing.couple_number : player.coupleNumber;
      const nextCoupleMode = player.coupleMatchMode === undefined ? existing.couple_match_mode : player.coupleMatchMode;
      if ((nextCoupleNumber === null) !== (nextCoupleMode === null)) {
        throw new AppError('Số Couple và nội dung Couple phải được cập nhật cùng nhau.');
      }
      const data: Prisma.session_playersUncheckedUpdateInput = {
        runtime_status: normalizePlayerStatus(player.status),
        total_matches: nonNegativeInteger(player.matchesPlayed, 'Số trận người chơi'),
        last_court_number: player.lastCourtNumber
      };
      if (player.playerTags !== undefined) data.player_tags = normalizePlayerTags(player.playerTags);
      if (player.firstArrivedAt !== undefined) data.first_arrived_at = toDate(player.firstArrivedAt);
      if (player.arrivalBaselineMatches !== undefined) {
        data.arrival_baseline_matches = player.arrivalBaselineMatches === null ? null : nonNegativeInteger(player.arrivalBaselineMatches, 'Mốc lượt khi đến');
      }
      if (player.fairnessOffset !== undefined) data.fairness_offset = nonNegativeInteger(player.fairnessOffset, 'Hệ số công bằng');
      if (player.deferredRounds !== undefined) data.deferred_rounds = nonNegativeInteger(player.deferredRounds, 'Số vòng đã chờ');
      if (player.waitingSince !== undefined) data.waiting_since = toDate(player.waitingSince);
      if (player.entryPriorityConsumedAt !== undefined) data.entry_priority_consumed_at = toDate(player.entryPriorityConsumedAt);
      if (player.lastFinishedAt !== undefined) data.last_finished_at = toDate(player.lastFinishedAt);
      if (player.nextMatchRequestedAt !== undefined) data.next_match_requested_at = toDate(player.nextMatchRequestedAt);
      if (player.nextMatchRequestMode !== undefined) data.next_match_request_mode = normalizeRequestMode(player.nextMatchRequestMode);
      if (player.endGameAt !== undefined) data.end_game_at = toDate(player.endGameAt);
      if (player.endGameAfterMatch !== undefined) data.end_game_after_match = player.endGameAfterMatch;
      if (player.coupleNumber !== undefined) {
        data.couple_number = player.coupleNumber === null ? null : nonNegativeInteger(player.coupleNumber, 'Số Couple');
      }
      if (player.coupleMatchMode !== undefined) {
        data.couple_match_mode = player.coupleMatchMode === null ? null : normalizeCoupleMode(player.coupleMatchMode);
      }

      if (hasChanges(existing as unknown as Record<string, unknown>, data as Record<string, unknown>)) {
        await tx.session_players.update({ where: { id: player.id, club_id: clubId }, data });
      }
    }

    const existingQueueMatches = await tx.runtime_matches.findMany({
      where: { session_id: sessionId, club_id: clubId, court_number: null, queue_order: { not: null } }
    });
    const queueByOrder = new Map(existingQueueMatches.map((match) => [match.queue_order ?? -1, match]));
    const queueOrders = [...new Set(payload.nextMatches.map((match) => nonNegativeInteger(match.queueOrder, 'Thứ tự gợi ý')))];
    if (queueOrders.length !== payload.nextMatches.length) throw new AppError('Thứ tự gợi ý runtime bị trùng.');
    const reservedPlayerIds = new Set<string>();

    for (const queueMatch of payload.nextMatches) {
      const queueOrder = nonNegativeInteger(queueMatch.queueOrder, 'Thứ tự gợi ý');
      const existing = queueByOrder.get(queueOrder);
      const { teamA, teamB } = rosterToTeams(queueMatch.roster);
      if (teamA.length + teamB.length !== 4 || new Set([...teamA, ...teamB]).size !== 4) {
        throw new AppError('Gợi ý cần đúng bốn người chơi khác nhau.');
      }
      if ([...teamA, ...teamB].some((playerId) => reservedPlayerIds.has(playerId))) {
        throw new AppError('Một người chơi không thể xuất hiện trong nhiều gợi ý cùng lúc.');
      }
      [...teamA, ...teamB].forEach((playerId) => reservedPlayerIds.add(playerId));
      const data = {
        status: 'READY',
        team_a: teamA,
        team_b: teamB,
        fairness_score: queueMatch.score ?? existing?.fairness_score ?? null,
        queue_order: queueOrder,
        court_number: null,
        locked: queueMatch.locked ?? existing?.locked ?? false,
        match_format: queueMatch.matchFormat === undefined ? existing?.match_format ?? null : normalizeMatchFormat(queueMatch.matchFormat),
        generation: queueMatch.generation === undefined ? existing?.generation ?? 0 : nonNegativeInteger(queueMatch.generation, 'Thế hệ gợi ý'),
        manual_edited: queueMatch.manualEdited ?? existing?.manual_edited ?? false,
        source_revision: version,
      } satisfies Prisma.runtime_matchesUncheckedUpdateInput;

      if (existing) {
        if (hasChanges(existing as unknown as Record<string, unknown>, data as Record<string, unknown>)) {
          await tx.runtime_matches.update({ where: { id: existing.id, club_id: clubId }, data: { ...data, updated_at: new Date() } });
        }
      } else {
        await tx.runtime_matches.create({
          data: {
            club_id: clubId,
            session_id: sessionId,
            ...data,
            created_at: new Date()
          }
        });
      }
    }

    const queueDeleteWhere: Prisma.runtime_matchesWhereInput[] = [];
    if (syncMode === 'FULL') {
      queueDeleteWhere.push({
        session_id: sessionId,
        club_id: clubId,
        court_number: null,
        queue_order: queueOrders.length > 0 ? { notIn: queueOrders } : { not: null }
      });
    } else if ((payload.deletedQueueOrders?.length ?? 0) > 0) {
      queueDeleteWhere.push({
        session_id: sessionId,
        club_id: clubId,
        court_number: null,
        queue_order: { in: [...new Set(payload.deletedQueueOrders!.map((order) => nonNegativeInteger(order, 'Thứ tự gợi ý')))] }
      });
    }
    for (const where of queueDeleteWhere) await tx.runtime_matches.deleteMany({ where });

    const parsedCourts = payload.courts.flatMap((court) => {
      const courtNumber = parseCourtNumber(court.courtId);
      return courtNumber > 0 ? [{ ...court, courtNumber }] : [];
    });
    if (parsedCourts.length !== payload.courts.length) throw new AppError('Mã sân runtime không hợp lệ.');
    const courtNumbers = [...new Set(parsedCourts.map((court) => court.courtNumber))];
    if (courtNumbers.length !== parsedCourts.length) throw new AppError('Snapshot chứa sân bị trùng.');
    const [existingCourts, existingCourtMatches] = await Promise.all([
      courtNumbers.length > 0
        ? tx.runtime_courts.findMany({ where: { session_id: sessionId, club_id: clubId, court_number: { in: courtNumbers } } })
        : [],
      courtNumbers.length > 0
        ? tx.runtime_matches.findMany({ where: { session_id: sessionId, club_id: clubId, court_number: { in: courtNumbers } } })
        : []
    ]);
    const courtByNumber = new Map(existingCourts.map((court) => [court.court_number, court]));
    const courtMatchByNumber = new Map(existingCourtMatches.map((match) => [match.court_number ?? -1, match]));
    const obsoleteCourtMatchIds: string[] = [];

    for (const court of parsedCourts) {
      const { teamA, teamB } = rosterToTeams(court.roster);
      const rosterSize = teamA.length + teamB.length;
      if (rosterSize !== 0 && (rosterSize !== 4 || new Set([...teamA, ...teamB]).size !== 4)) {
        throw new AppError(`Sân ${court.courtNumber} cần đủ bốn người chơi khác nhau.`);
      }
      if ([...teamA, ...teamB].some((playerId) => reservedPlayerIds.has(playerId))) {
        throw new AppError(`Người chơi ở sân ${court.courtNumber} đang được giữ ở vị trí khác.`);
      }
      [...teamA, ...teamB].forEach((playerId) => reservedPlayerIds.add(playerId));

      const existingMatch = courtMatchByNumber.get(court.courtNumber);
      let runtimeMatchId: string | null = null;
      if (rosterSize === 4) {
        if (existingMatch) {
          const matchData = {
            status: normalizeCourtStatus(court.status),
            team_a: teamA,
            team_b: teamB,
            queue_order: null,
            source_revision: version
          } satisfies Prisma.runtime_matchesUncheckedUpdateInput;
          if (hasChanges(existingMatch as unknown as Record<string, unknown>, matchData as Record<string, unknown>)) {
            await tx.runtime_matches.update({
              where: { id: existingMatch.id, club_id: clubId },
              data: { ...matchData, updated_at: new Date() }
            });
          }
          runtimeMatchId = existingMatch.id;
        } else {
          const created = await tx.runtime_matches.create({
            data: {
              club_id: clubId,
              session_id: sessionId,
              court_number: court.courtNumber,
              queue_order: null,
              status: normalizeCourtStatus(court.status),
              team_a: teamA,
              team_b: teamB,
              source_revision: version
            },
            select: { id: true }
          });
          runtimeMatchId = created.id;
        }
      } else if (existingMatch) {
        obsoleteCourtMatchIds.push(existingMatch.id);
      }

      const existingCourt = courtByNumber.get(court.courtNumber);
      const courtData = {
        status: normalizeCourtStatus(court.status),
        runtime_match_id: runtimeMatchId,
        started_at: toDate(court.startedAt)
      };
      if (existingCourt) {
        if (hasChanges(existingCourt as unknown as Record<string, unknown>, courtData)) {
          await tx.runtime_courts.update({ where: { id: existingCourt.id, club_id: clubId }, data: { ...courtData, updated_at: new Date() } });
        }
      } else {
        await tx.runtime_courts.create({
          data: { club_id: clubId, session_id: sessionId, court_number: court.courtNumber, ...courtData }
        });
      }
    }

    if (obsoleteCourtMatchIds.length > 0) {
      await tx.runtime_matches.deleteMany({ where: { id: { in: obsoleteCourtMatchIds }, club_id: clubId } });
    }

    return version;
  });
}
