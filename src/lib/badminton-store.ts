import { create } from 'zustand';
import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';
import {
  isPlayerEligibleForAutoSuggestion as isEligibleForAutoSuggestion,
  isPlayerEligibleForReplacement
} from '@/lib/runtime-eligibility';
import {
  EMPTY_RUNTIME_ACTION_RESULT,
  inferRuntimeMatchFormat,
  validateRuntimeRoster,
  type RuntimeActionResult
} from '@/lib/runtime-roster-validation';
import {
  createSchedulerNextMatchPlan,
  generateSchedulerNextMatches,
  normalizeNextMatchQueue,
  qualityTierFromFairness
} from '@/lib/runtime-scheduler-adapter';
import { evaluateRoster } from '@/lib/runtime-roster-scoring';
import type {
  RuntimeCourt,
  RuntimeMatch,
  RuntimeRecentQuartet,
  RuntimeSession,
  RuntimeSessionPlayer,
  RuntimeSnapshot
} from '@/types/runtime';

export type PlayerStatus = 'WAITING' | 'JUST_FINISHED' | 'PLAYING' | 'RESTING' | 'PRIORITY' | 'FINISHED';
export type CourtStatus = 'EMPTY' | 'READY' | 'PLAYING';
export type PaymentType = 'TM' | 'CK';
export type PaymentStatus = 'PAID' | 'WAIVED' | 'UNPAID';
export type GenderType = 'Nam' | 'Nữ';
export type SuggestionMode = 'random' | 'mixed' | 'women' | 'men';

export interface Player {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  level: number;
  setsPlayed: number;
  matchesPlayed: number;
  money: number;
  paymentStatus: PaymentStatus;
  paymentType: PaymentType;
  discount: number;
  note: string;
  playerTags: PlayerTag[];
  status: PlayerStatus;
  fatigue: number;
  lastCourt: string | null;
  statusUpdatedAt: number;
  justFinishedAt: number | null;
  restUntil: number | null;
  avatarUrl: string | null;
  avatarS3Key: string | null;
  firstArrivedAt: number | null;
  arrivalBaselineMatches: number | null;
  fairnessOffset: number;
  deferredRounds: number;
  waitingSince: number | null;
  entryPriorityConsumedAt: number | null;
  lastFinishedAt: number | null;
  nextMatchRequestedAt: number | null;
  nextMatchRequestMode: 'ANY' | 'MEN' | 'WOMEN' | 'MIXED' | null;
  endGameAt: number | null;
  endGameAfterMatch: boolean;
  coupleNumber: number | null;
  coupleMatchMode: 'MEN' | 'WOMEN' | 'MIXED' | null;
}

export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  fairness: number;
  antiRepeat: number;
  fatigue: number;
  slots: [string | null, string | null, string | null, string | null];
  startedAt: number | null;
  suggestionSeed: number;
  sourceRevision?: number | null;
}

export interface NextMatch {
  id: string;
  index: number; // 1, 2, 3...
  roster: string[]; // four player ids [p1,p2,p3,p4]
  fairness: number;
  antiRepeat: number;
  fatigueBalance: number;
  score: number; // overall quality score
  appliedCourtId?: string | null;
  locked?: boolean;
  matchFormat?: 'AUTO' | 'MEN' | 'WOMEN' | 'MIXED';
  generation?: number;
  manualEdited?: boolean;
  sourceRevision?: number | null;
  qualityTier?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'REVIEW';
  reasonCodes?: string[];
  warningCodes?: string[];
  validity?: 'VALID' | 'WARNING' | 'STALE';
}

export interface MatchHistory {
  id: string;
  courtId: string;
  courtName: string;
  endedAt: number;
  durationMs: number | null;
  playerNames: string[];
  playerIds: string[];
  round: number;
}

export interface SessionMeta {
  title: string;
  timeRange: string;
  round: number;
  courtCount: number;
  status: string;
}

export interface BadmintonState {
  session: SessionMeta;
  runtimeSessionId: string | null;
  players: Player[];
  courts: Court[];
  nextMatches: NextMatch[];
  suggestionMode: SuggestionMode;
  history: MatchHistory[];
  recentQuartets: RuntimeRecentQuartet[];
  runtimeVersion: number;
  suggestionGeneration: number;
  suggestionDiagnostics: string[];
  setRuntimeSessionId: (sessionId: string | null) => void;
  hydrateRuntimeSnapshot: (snapshot: RuntimeSnapshot) => void;
  applyNextMatch: (matchId: string, courtId?: string) => RuntimeActionResult;
  replaceSlot: (courtId: string, slotIndex: number, playerId: string) => void;
  swapPairs: (courtId: string) => void;
  cancelReadyCourt: (courtId: string) => void;
  toggleMatch: (courtId: string) => void;
  checkIn: (playerId: string) => void;
  updatePlayer: (playerId: string, patch: Partial<Pick<Player, 'name' | 'gender' | 'level' | 'money' | 'paymentType' | 'discount' | 'note' | 'playerTags'>>) => void;
  updatePlayerPayment: (playerId: string, patch: Partial<Pick<Player, 'paymentStatus' | 'paymentType' | 'money' | 'discount'>>) => void;
  setCourtCount?: (count: number) => void;
  refreshNextMatches: (mode?: SuggestionMode) => RuntimeActionResult;
  replaceNextMatchPlayer: (matchId: string, slotIndex: number, playerId: string) => void;
  replaceNextMatchRoster: (matchId: string, roster: string[]) => RuntimeActionResult;
  toggleNextMatchLock: (matchId: string) => void;
  endMatch: (courtId: string) => void;
  startMatch: (courtId: string) => RuntimeActionResult;
}

const MATCH_HISTORY_LIMIT = 8;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const EMPTY_SESSION: SessionMeta = {
  title: '',
  timeRange: '',
  round: 0,
  courtCount: 0,
  status: 'PENDING'
};

function createCourt(court: Omit<Court, 'startedAt' | 'suggestionSeed'> & { startedAt?: number | null; suggestionSeed?: number }): Court {
  return {
    ...court,
    startedAt: court.startedAt ?? null,
    suggestionSeed: court.suggestionSeed ?? 0
  };
}

export function generateCourts(count: number, existing: Court[] = []): Court[] {
  return Array.from({ length: count }, (_, index) => {
    const existingCourt = existing[index];
    if (existingCourt) {
      return {
        ...existingCourt,
        id: `c${index + 1}`,
        name: `Sân ${index + 1}`,
        suggestionSeed: existingCourt.suggestionSeed ?? index
      };
    }

    return createCourt({
      id: `c${index + 1}`,
      name: `Sân ${index + 1}`,
      status: 'EMPTY',
      fairness: 0,
      antiRepeat: 0,
      fatigue: 0,
      slots: [null, null, null, null],
      startedAt: null,
      suggestionSeed: index
    });
  });
}

function hasPlayerTag(player: Pick<Player, 'playerTags'>, tag: PlayerTag): boolean {
  return normalizePlayerTags(player.playerTags).includes(tag);
}

function rosterToSlots(roster: string[]): [string | null, string | null, string | null, string | null] {
  return [roster[0] ?? null, roster[1] ?? null, roster[2] ?? null, roster[3] ?? null];
}

function replacePlayerStatus(player: Player, patch: Partial<Player>): Player {
  return {
    ...player,
    ...patch
  };
}

function reconcilePreparedPlayerStatuses(players: Player[], courts: Court[], now = Date.now()): Player[] {
  const readyPlayerIds = new Set(
    courts
      .filter((court) => court.status === 'READY')
      .flatMap((court) => court.slots)
      .filter((playerId): playerId is string => Boolean(playerId))
  );
  const playingPlayerIds = new Set(
    courts
      .filter((court) => court.status === 'PLAYING')
      .flatMap((court) => court.slots)
      .filter((playerId): playerId is string => Boolean(playerId))
  );

  return players.map((player) => {
    if (playingPlayerIds.has(player.id)) {
      return player.status === 'PLAYING' ? player : replacePlayerStatus(player, { status: 'PLAYING', statusUpdatedAt: now });
    }
    if (readyPlayerIds.has(player.id)) {
      return player.status === 'PRIORITY' ? player : replacePlayerStatus(player, { status: 'PRIORITY', statusUpdatedAt: now });
    }
    if (player.status !== 'PRIORITY') return player;
    const tags = normalizePlayerTags(player.playerTags);
    const nextStatus: PlayerStatus = tags.includes('ARRIVED') && !tags.includes('END_GAME') ? 'WAITING' : 'FINISHED';
    return replacePlayerStatus(player, { status: nextStatus, statusUpdatedAt: now });
  });
}

function updateManualMatch(
  match: NextMatch,
  roster: string[],
  players: Player[],
  courts: Court[],
  runtimeVersion: number
): NextMatch {
  const scores = evaluateRoster(players, roster, `Tiếp theo #${match.index}`);
  const previousFormat = match.matchFormat ?? 'AUTO';
  const matchFormat = inferRuntimeMatchFormat(roster, players);
  const validation = validateRuntimeRoster({
    roster,
    players,
    courts,
    allowedStatuses: ['WAITING', 'JUST_FINISHED', 'PRIORITY'],
    expectedFormat: matchFormat
  });
  const manualWarnings = [
    ...validation.warnings,
    ...(previousFormat !== 'AUTO' && previousFormat !== matchFormat ? ['FORMAT_MISMATCH' as const] : [])
  ];
  const dynamicWarningCodes = new Set(['COUPLE_SPLIT', 'LEVEL_IMBALANCE', 'FORMAT_MISMATCH', 'LOCKED_PLAYER_UNAVAILABLE']);
  const retainedWarningCodes = (match.warningCodes ?? []).filter((code) => !dynamicWarningCodes.has(code));
  const warningCodes = new Set([...retainedWarningCodes, 'MANUAL_OVERRIDE', ...manualWarnings]);
  const validity: NonNullable<NextMatch['validity']> = validation.errors.length > 0
    ? 'STALE'
    : manualWarnings.length > 0
      ? 'WARNING'
      : 'VALID';

  return {
    ...match,
    roster,
    fairness: scores.fairness,
    antiRepeat: scores.antiRepeat,
    fatigueBalance: scores.fatigueBalance,
    score: Math.round((scores.fairness + scores.antiRepeat + scores.fatigueBalance) / 3),
    matchFormat,
    manualEdited: true,
    sourceRevision: runtimeVersion,
    validity,
    warningCodes: [...warningCodes]
  };
}

function getArrivalBaseline(players: Player[], excludedPlayerId: string): number {
  const values = players
    .filter((player) => {
      const tags = normalizePlayerTags(player.playerTags);
      return player.id !== excludedPlayerId && tags.includes('ARRIVED') && !tags.includes('HOST');
    })
    .map((player) => player.matchesPlayed + player.fairnessOffset)
    .sort((left, right) => left - right);
  if (values.length === 0) return 0;
  return Math.floor(values[Math.floor((values.length - 1) / 2)]);
}

function normalizePaymentStatus(value: string | null | undefined): PaymentStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'PAID') return 'PAID';
  if (raw === 'WAIVED') return 'WAIVED';
  return 'UNPAID';
}

function normalizePaymentType(value: string | null | undefined): PaymentType {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'CK' || raw === 'BANK') return 'CK';
  return 'TM';
}

function normalizeGender(value: string | null | undefined): GenderType {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'female' || raw === 'f' || raw === 'nu' || raw === 'nữ') return 'Nữ';
  return 'Nam';
}

function normalizePlayerStatus(value: string | null | undefined): PlayerStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'JUST_FINISHED' || raw === 'JUSTFINISHED') return 'JUST_FINISHED';
  if (raw === 'PLAYING') return 'PLAYING';
  if (raw === 'RESTING') return 'RESTING';
  if (raw === 'PRIORITY') return 'PRIORITY';
  if (raw === 'FINISHED') return 'FINISHED';
  return 'WAITING';
}

function normalizeCourtStatus(value: string | null | undefined): CourtStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'PLAYING') return 'PLAYING';
  if (raw === 'READY') return 'READY';
  return 'EMPTY';
}

function formatTime(value?: string | null): string | null {
  if (!value) return null;
  const match = String(value).match(/\d{1,2}:\d{2}/);
  if (match) return match[0].padStart(5, '0');

  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toISOString().slice(11, 16);
  }
  return null;
}

function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return '';
}

function mapRuntimeSession(session: RuntimeSession, fallback: SessionMeta): SessionMeta {
  const timeRange = formatTimeRange(session.startTime, session.endTime) || fallback.timeRange;
  return {
    title: session.name || fallback.title,
    timeRange,
    round: fallback.round,
    courtCount: session.courtCount || fallback.courtCount,
    status: session.status || fallback.status
  };
}

function mapSessionPlayerToPlayer(player: RuntimeSessionPlayer): Player {
  return {
    id: player.id,
    name: player.fullName,
    gender: normalizeGender(player.gender),
    level: player.level,
    setsPlayed: player.totalMatches,
    matchesPlayed: player.totalMatches,
    money: player.paymentAmount,
    paymentStatus: normalizePaymentStatus(player.paymentStatus),
    paymentType: normalizePaymentType(player.paymentMethod),
    discount: player.discount,
    note: player.note ?? '',
    playerTags: normalizePlayerTags(player.playerTags),
    status: normalizePlayerStatus(player.runtimeStatus),
    fatigue: 0,
    lastCourt: player.lastCourtNumber ? `Sân ${player.lastCourtNumber}` : null,
    statusUpdatedAt: player.joinedAt ?? Date.now(),
    justFinishedAt: player.lastFinishedAt,
    restUntil: null,
    avatarUrl: player.avatarUrl,
    avatarS3Key: player.avatarS3Key,
    firstArrivedAt: player.firstArrivedAt,
    arrivalBaselineMatches: player.arrivalBaselineMatches,
    fairnessOffset: player.fairnessOffset,
    deferredRounds: player.deferredRounds,
    waitingSince: player.waitingSince,
    entryPriorityConsumedAt: player.entryPriorityConsumedAt,
    lastFinishedAt: player.lastFinishedAt,
    nextMatchRequestedAt: player.nextMatchRequestedAt,
    nextMatchRequestMode: player.nextMatchRequestMode,
    endGameAt: player.endGameAt,
    endGameAfterMatch: player.endGameAfterMatch,
    coupleNumber: player.coupleNumber,
    coupleMatchMode: player.coupleMatchMode
  };
}

function mapRuntimeCourtsToCourts(runtimeCourts: RuntimeCourt[], runtimeMatches: RuntimeMatch[]): Court[] {
  const matchById = new Map(runtimeMatches.map((match) => [match.id, match]));

  return runtimeCourts.map((court, idx) => {
    const match = court.runtimeMatchId ? matchById.get(court.runtimeMatchId) : null;
    const roster = match ? [...match.teamA, ...match.teamB] : [];

    return {
      id: court.courtId,
      name: court.courtName,
      status: normalizeCourtStatus(court.status),
      fairness: 0,
      antiRepeat: 0,
      fatigue: 0,
      slots: rosterToSlots(roster),
      startedAt: court.startedAt,
      suggestionSeed: idx,
      sourceRevision: match?.sourceRevision ?? null
    };
  });
}

function mapRuntimeMatchesToNextMatches(runtimeMatches: RuntimeMatch[], players: Player[]): NextMatch[] {
  const queued = runtimeMatches
    .filter((match) => match.queueOrder !== null && !match.courtId)
    .sort((a, b) => (a.queueOrder ?? 0) - (b.queueOrder ?? 0));
  const usedPlayerIds = new Set<string>();

  return queued.flatMap((match, idx) => {
    const index = match.queueOrder ?? idx + 1;
    const roster = [...match.teamA, ...match.teamB];
    const uniqueRoster = Array.from(new Set(roster));
    if (uniqueRoster.length < 4) {
      return [];
    }
    const hasQueueConflict = uniqueRoster.some((playerId) => usedPlayerIds.has(playerId));
    uniqueRoster.forEach((playerId) => usedPlayerIds.add(playerId));
    const canScore = uniqueRoster.length >= 4 && players.length > 0;
    const scores = canScore ? evaluateRoster(players, uniqueRoster, `Tiếp theo #${index}`) : { fairness: 0, antiRepeat: 0, fatigueBalance: 0 };
    const score = match.fairnessScore ?? Math.round((scores.fairness + scores.antiRepeat + scores.fatigueBalance) / 3);

    return [{
      id: match.id,
      index,
      roster: uniqueRoster,
      fairness: scores.fairness,
      antiRepeat: scores.antiRepeat,
      fatigueBalance: scores.fatigueBalance,
      score,
      appliedCourtId: match.courtId ?? null,
      locked: match.locked,
      matchFormat: match.matchFormat ?? 'AUTO',
      generation: match.generation,
      manualEdited: match.manualEdited,
      sourceRevision: match.sourceRevision,
      validity: hasQueueConflict ? 'STALE' as const : 'VALID' as const,
      warningCodes: hasQueueConflict ? ['LOCKED_PLAYER_UNAVAILABLE'] : []
    }];
  });
}

export const useBadmintonStore = create<BadmintonState>((set) => {
  return {
    session: EMPTY_SESSION,
    runtimeSessionId: null,
    players: [],
    courts: [],
  nextMatches: [],
  suggestionDiagnostics: [],
    suggestionMode: 'random',
    history: [],
    recentQuartets: [],
    runtimeVersion: 0,
    suggestionGeneration: 0,
  replaceSlot: (courtId, slotIndex, playerId) => {
    set((state) => {
      const court = state.courts.find((item) => item.id === courtId);

      if (!court || court.status === 'PLAYING') {
        return state;
      }

      const nextSlots = [...court.slots] as [string | null, string | null, string | null, string | null];
      const previousPlayerId = nextSlots[slotIndex];

      if (previousPlayerId === playerId) {
        return state;
      }

      const now = Date.now();
      nextSlots[slotIndex] = playerId;

      const nextPlayers = state.players.map((player) => {
        if (player.id === playerId) {
          return replacePlayerStatus(player, {
            status: 'PRIORITY',
            statusUpdatedAt: now,
            lastCourt: court.name,
            justFinishedAt: null,
            restUntil: null
          });
        }

        if (previousPlayerId && player.id === previousPlayerId) {
          return replacePlayerStatus(player, {
            status: 'WAITING',
            statusUpdatedAt: now,
            justFinishedAt: null,
            restUntil: null
          });
        }

        return player;
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId
          ? {
              ...item,
              status: nextSlots.some((slot) => slot !== null) ? ('READY' as CourtStatus) : ('EMPTY' as CourtStatus),
              slots: nextSlots,
              startedAt: null
            }
          : item
      );
      const remainingMatches = state.nextMatches.filter((match) => !match.roster.includes(playerId));
      if (nextSlots.some((slot) => slot === null)) {
        return { players: nextPlayers, courts: nextCourts, nextMatches: remainingMatches };
      }
      const suggestionGeneration = state.suggestionGeneration + 1;
      const nextMatches = generateSchedulerNextMatches(
        { ...state, players: nextPlayers, courts: nextCourts, nextMatches: remainingMatches, suggestionGeneration },
        state.suggestionMode,
        suggestionGeneration,
        'top-up'
      );

      return { players: nextPlayers, courts: nextCourts, nextMatches, suggestionGeneration };
    });
  },
  swapPairs: (courtId) => {
    set((state) => {
      const court = state.courts.find((item) => item.id === courtId);

      if (!court || court.status === 'PLAYING') {
        return state;
      }

      // Random shuffle among the 4 players currently on the court (nulls preserved in place)
      const current = court.slots.slice();
      const playersOnly = current.filter((s): s is string => s !== null);
      // Fisher-Yates shuffle
      for (let i = playersOnly.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playersOnly[i], playersOnly[j]] = [playersOnly[j], playersOnly[i]];
      }

      // Fill back into slots left-to-right
      const nextSlots: [string | null, string | null, string | null, string | null] = [null, null, null, null];
      let pIdx = 0;
      for (let si = 0; si < 4; si++) {
        if (current[si] !== null) {
          nextSlots[si] = playersOnly[pIdx++] ?? null;
        } else {
          nextSlots[si] = null;
        }
      }

      const nextCourts = state.courts.map((item) =>
        item.id === courtId
          ? {
              ...item,
              status: nextSlots.some((slot) => slot !== null) ? ('READY' as CourtStatus) : ('EMPTY' as CourtStatus),
              slots: nextSlots,
              startedAt: null
            }
          : item
      );

      return { courts: nextCourts };
    });
  },
  cancelReadyCourt: (courtId) => {
    set((state) => {
      const court = state.courts.find((item) => item.id === courtId);
      if (!court || court.status !== 'READY') {
        return state;
      }

      const now = Date.now();
      const cancelledPlayerIds = court.slots.filter((slot): slot is string => Boolean(slot));
      if (cancelledPlayerIds.length !== 4 || new Set(cancelledPlayerIds).size !== 4) {
        return state;
      }
      const nextPlayers = state.players.map((player) => {
        if (!cancelledPlayerIds.includes(player.id)) return player;

        const tags = normalizePlayerTags(player.playerTags);
        const canReturnToWaiting = tags.includes('ARRIVED') && !tags.includes('END_GAME');

        return replacePlayerStatus(player, {
          status: canReturnToWaiting ? 'WAITING' : 'FINISHED',
          statusUpdatedAt: now,
          justFinishedAt: null,
          restUntil: null,
          waitingSince: canReturnToWaiting ? player.waitingSince ?? now : null
        });
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId
          ? {
              ...item,
              status: 'EMPTY' as CourtStatus,
              slots: [null, null, null, null] as [string | null, string | null, string | null, string | null],
              startedAt: null
            }
          : item
      );
      const cancelledRoster = [...cancelledPlayerIds];
      const cancelledPlayers = cancelledRoster
        .map((playerId) => nextPlayers.find((player) => player.id === playerId))
        .filter((player): player is Player => Boolean(player));
      const maleCount = cancelledPlayers.filter((player) => player.gender === 'Nam').length;
      const femaleCount = cancelledPlayers.length - maleCount;
      const bothTeamsMixed = cancelledPlayers.length === 4
        && cancelledPlayers.slice(0, 2).some((player) => player.gender === 'Nam')
        && cancelledPlayers.slice(0, 2).some((player) => player.gender === 'Nữ')
        && cancelledPlayers.slice(2, 4).some((player) => player.gender === 'Nam')
        && cancelledPlayers.slice(2, 4).some((player) => player.gender === 'Nữ');
      const matchFormat: NonNullable<NextMatch['matchFormat']> = maleCount === 4
        ? 'MEN'
        : femaleCount === 4
          ? 'WOMEN'
          : bothTeamsMixed
            ? 'MIXED'
            : 'AUTO';
      const scores = evaluateRoster(nextPlayers, cancelledRoster, 'Tiếp theo #1');
      const validation = validateRuntimeRoster({
        roster: cancelledRoster,
        players: nextPlayers,
        courts: nextCourts,
        allowedStatuses: ['WAITING', 'JUST_FINISHED'],
        expectedFormat: matchFormat
      });
      const restoredMatch: NextMatch = {
        id: `cancelled-${court.id}-${now}`,
        index: 1,
        roster: cancelledRoster,
        fairness: scores.fairness,
        antiRepeat: scores.antiRepeat,
        fatigueBalance: scores.fatigueBalance,
        score: Math.round((scores.fairness + scores.antiRepeat + scores.fatigueBalance) / 3),
        appliedCourtId: null,
        locked: true,
        matchFormat,
        generation: state.suggestionGeneration + 1,
        manualEdited: true,
        sourceRevision: state.runtimeVersion,
        qualityTier: qualityTierFromFairness(scores.fairness),
        reasonCodes: ['CANCELLED_COURT_RESTORED'],
        warningCodes: validation.errors.length > 0
          ? [...new Set(['LOCKED_PLAYER_UNAVAILABLE', ...validation.warnings])]
          : validation.warnings,
        validity: validation.errors.length > 0 ? 'STALE' : validation.warnings.length > 0 ? 'WARNING' : 'VALID'
      };
      const restoredPlayerIds = new Set(cancelledRoster);
      const queuedAfterRestore = normalizeNextMatchQueue([
        restoredMatch,
        ...state.nextMatches.filter((match) => !match.roster.some((playerId) => restoredPlayerIds.has(playerId)))
      ]);
      while (queuedAfterRestore.length > state.session.courtCount) {
        const removableIndex = queuedAfterRestore.findLastIndex((match) => !match.locked);
        if (removableIndex < 0) break;
        queuedAfterRestore.splice(removableIndex, 1);
      }
      const suggestionGeneration = state.suggestionGeneration + 1;
      const nextMatches = generateSchedulerNextMatches(
        { ...state, players: nextPlayers, courts: nextCourts, nextMatches: normalizeNextMatchQueue(queuedAfterRestore), suggestionGeneration },
        state.suggestionMode,
        suggestionGeneration,
        'top-up'
      );

      return { players: nextPlayers, courts: nextCourts, nextMatches, suggestionGeneration };
    });
  },
  toggleMatch: (courtId) => {
    set((state) => {
      const court = state.courts.find((item) => item.id === courtId);

      if (!court) {
        return state;
      }

      const now = Date.now();

      if (court.status === 'PLAYING') {
        const finishedIds = court.slots.filter((slot): slot is string => Boolean(slot));

        if (finishedIds.length === 0) {
          return state;
        }

        const playerNameLookup = new Map(state.players.map((player) => [player.id, player.name]));
        const nextPlayers = state.players.map((player) => {
          if (!finishedIds.includes(player.id)) {
            return player;
          }

          const shouldEnd = player.endGameAfterMatch || normalizePlayerTags(player.playerTags).includes('END_GAME');
          return replacePlayerStatus(player, {
            status: shouldEnd ? 'FINISHED' : 'WAITING',
            statusUpdatedAt: now,
            justFinishedAt: null,
            lastFinishedAt: now,
            waitingSince: shouldEnd ? null : now,
            endGameAfterMatch: false,
            lastCourt: court.name,
            matchesPlayed: player.matchesPlayed + 1,
            setsPlayed: player.setsPlayed + 1,
            fatigue: clamp(player.fatigue + 1, 0, 5)
          });
        });

        const nextCourts = state.courts.map((item) =>
          item.id === courtId
            ? {
                ...item,
                status: 'EMPTY' as CourtStatus,
                slots: [null, null, null, null] as [string | null, string | null, string | null, string | null],
                startedAt: null
              }
            : item
        );

        const nextHistory: MatchHistory[] = [
          {
            id: `history-${courtId}-${now}`,
            courtId: court.id,
            courtName: court.name,
            endedAt: now,
            durationMs: court.startedAt ? now - court.startedAt : null,
            playerNames: finishedIds.map((id) => playerNameLookup.get(id)).filter((value): value is string => Boolean(value)),
            playerIds: finishedIds,
            round: state.session.round
          },
          ...state.history
        ].slice(0, MATCH_HISTORY_LIMIT);

        const recentQuartets = [{ matchId: `local-${courtId}-${now}`, playerIds: [...finishedIds].sort(), endedAt: now }, ...state.recentQuartets].slice(0, 16);
        const suggestionGeneration = state.suggestionGeneration + 1;
        const nextMatches = generateSchedulerNextMatches(
          { ...state, players: nextPlayers, courts: nextCourts, recentQuartets, suggestionGeneration },
          state.suggestionMode,
          suggestionGeneration,
          'top-up'
        );
        return { players: nextPlayers, courts: nextCourts, nextMatches, history: nextHistory, recentQuartets, suggestionGeneration };
      }

      if (court.slots.some((slot) => slot === null)) {
        return state;
      }

      const activePlayerIds = court.slots.filter((slot): slot is string => Boolean(slot));
      const nextPlayers = state.players.map((player) => {
        if (!activePlayerIds.includes(player.id)) {
          return isEligibleForAutoSuggestion(player)
            ? replacePlayerStatus(player, { deferredRounds: player.deferredRounds + 1 })
            : player;
        }

        const tags = normalizePlayerTags(player.playerTags).filter((tag) => tag !== 'PRIORITY');
        return replacePlayerStatus(player, {
          status: 'PLAYING',
          statusUpdatedAt: now,
          lastCourt: court.name,
          justFinishedAt: null,
          restUntil: null,
          playerTags: tags,
          nextMatchRequestedAt: null,
          nextMatchRequestMode: null,
          entryPriorityConsumedAt: player.entryPriorityConsumedAt ?? now,
          deferredRounds: 0,
          waitingSince: null
        });
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId
          ? {
              ...item,
              status: 'PLAYING' as CourtStatus,
              startedAt: now
            }
          : item
      );

      return { players: nextPlayers, courts: nextCourts };
    });
  },
  checkIn: (playerId) => {
    set((state) => {
      const now = Date.now();
      const baseline = getArrivalBaseline(state.players, playerId);

      const nextPlayers = state.players.map((player) =>
        player.id === playerId
          ? replacePlayerStatus(player, {
              status: 'WAITING',
              statusUpdatedAt: now,
              justFinishedAt: null,
              restUntil: null,
              firstArrivedAt: player.firstArrivedAt ?? now,
              arrivalBaselineMatches: player.arrivalBaselineMatches ?? baseline,
              fairnessOffset: player.firstArrivedAt === null ? baseline : player.fairnessOffset,
              waitingSince: player.waitingSince ?? now
            })
          : player
      );

      return { players: nextPlayers };
    });
  },
  updatePlayer: (playerId, patch) => {
    set((state) => {
      const now = Date.now();
      const baseline = getArrivalBaseline(state.players, playerId);
      const current = state.players.find((player) => player.id === playerId);
      if (!current) return state;

      const nextTags = patch.playerTags ? normalizePlayerTags(patch.playerTags) : current.playerTags;
      const wasArrived = normalizePlayerTags(current.playerTags).includes('ARRIVED');
      const isArrived = nextTags.includes('ARRIVED');
      const hadNextRequest = normalizePlayerTags(current.playerTags).includes('PRIORITY');
      const hasNextRequest = nextTags.includes('PRIORITY');
      const wasEndGame = normalizePlayerTags(current.playerTags).includes('END_GAME');
      const isEndGame = nextTags.includes('END_GAME');

      const nextPlayers = state.players.map((player) => {
        if (player.id !== playerId) return player;
        const isPlaying = player.status === 'PLAYING';
        let status = player.status;
        if (isEndGame && !isPlaying) status = 'FINISHED';
        else if (wasEndGame && !isEndGame && status === 'FINISHED') status = isArrived ? 'WAITING' : 'FINISHED';
        else if (!wasArrived && isArrived && status !== 'PLAYING') status = 'WAITING';
        else if (wasArrived && !isArrived && status !== 'PLAYING') status = 'FINISHED';

        return {
          ...player,
          ...patch,
          playerTags: nextTags,
          status,
          statusUpdatedAt: status !== player.status ? now : player.statusUpdatedAt,
          firstArrivedAt: !wasArrived && isArrived ? player.firstArrivedAt ?? now : player.firstArrivedAt,
          arrivalBaselineMatches: !wasArrived && isArrived ? player.arrivalBaselineMatches ?? baseline : player.arrivalBaselineMatches,
          fairnessOffset: !wasArrived && isArrived && player.firstArrivedAt === null ? baseline : player.fairnessOffset,
          waitingSince: !isArrived || isEndGame ? null : !wasArrived && isArrived ? player.waitingSince ?? now : player.waitingSince,
          nextMatchRequestedAt: hasNextRequest ? player.nextMatchRequestedAt ?? now : hadNextRequest ? null : player.nextMatchRequestedAt,
          nextMatchRequestMode: hasNextRequest ? player.nextMatchRequestMode ?? 'ANY' : hadNextRequest ? null : player.nextMatchRequestMode,
          endGameAt: isEndGame ? player.endGameAt ?? now : wasEndGame ? null : player.endGameAt,
          endGameAfterMatch: isEndGame && isPlaying
        };
      });

      const schedulingAffecting = Boolean(patch.playerTags || patch.gender !== undefined || patch.level !== undefined);
      const nextMatches = state.nextMatches.map((match) => {
        if (!match.locked || !match.roster.includes(playerId) || !schedulingAffecting) return match;
        // An explicit player edit is an operator override. Recompute the real
        // format and soft warnings while retaining the Lock. Only attendance,
        // End-Game, status, duplicates, or court conflicts make it STALE.
        return updateManualMatch(match, match.roster, nextPlayers, state.courts, state.runtimeVersion);
      });

      if (schedulingAffecting) {
        const suggestionGeneration = state.suggestionGeneration + 1;
        const regeneratedMatches = generateSchedulerNextMatches(
          { ...state, players: nextPlayers, nextMatches, suggestionGeneration },
          state.suggestionMode,
          suggestionGeneration
        );
        return { players: nextPlayers, nextMatches: regeneratedMatches, suggestionGeneration };
      }

      return { players: nextPlayers, nextMatches };
    });
  },
  updatePlayerPayment: (playerId, patch) => {
    set((state) => ({
      players: state.players.map((player) => (player.id === playerId ? { ...player, ...patch } : player))
    }));
  },
  setCourtCount: (count: number) => {
    set((state) => {
      const nextSession = { ...state.session, courtCount: count };
      const nextCourts = generateCourts(count, state.courts);
      const suggestionGeneration = state.suggestionGeneration + 1;
      const stagedState = { ...state, session: nextSession, courts: nextCourts, suggestionGeneration };
      const nextMatches = generateSchedulerNextMatches(stagedState, state.suggestionMode, suggestionGeneration);
      return { session: nextSession, courts: nextCourts, nextMatches, suggestionGeneration };
    });
  },
  refreshNextMatches: (mode) => {
    let result: RuntimeActionResult = EMPTY_RUNTIME_ACTION_RESULT;
    set((state) => {
      const nextMode = mode ?? state.suggestionMode;
      const suggestionGeneration = state.suggestionGeneration + 1;
      const players = reconcilePreparedPlayerStatuses(state.players, state.courts);
      const stagedState = { ...state, players, suggestionGeneration };
      const plan = createSchedulerNextMatchPlan(stagedState, nextMode, suggestionGeneration);
      const nextMatches = plan.matches;
      if (nextMatches.length === 0) {
        result = { changed: false, errors: ['NO_VALID_SUGGESTION'], warnings: [], diagnostics: plan.diagnostics };
        return players === state.players ? { suggestionDiagnostics: plan.diagnostics } : { players, suggestionDiagnostics: plan.diagnostics };
      }
      result = { changed: true, errors: [], warnings: [], diagnostics: plan.diagnostics };
      return { players, nextMatches, suggestionMode: nextMode, suggestionGeneration, suggestionDiagnostics: plan.diagnostics };
    });
    return result;
  },
  applyNextMatch: (matchId: string, courtId?: string) => {
    let result: RuntimeActionResult = EMPTY_RUNTIME_ACTION_RESULT;
    set((state) => {
      // Preview rows are advisory and must never reserve players. Recover any
      // orphan PRIORITY left by an older/cancelled snapshot before validating.
      // Players on a real READY court remain PRIORITY and are still rejected by
      // the court-exclusivity validation below.
      const reconciledPlayers = reconcilePreparedPlayerStatuses(state.players, state.courts);
      const match = state.nextMatches.find((m) => m.id === matchId);
      if (!match) {
        result = { changed: false, errors: ['NO_VALID_SUGGESTION'], warnings: [] };
        return state;
      }

      const targetCourt = courtId
        ? state.courts.find((court) => court.id === courtId && court.status === 'EMPTY')
        : state.courts.find((court) => court.status === 'EMPTY');

      if (!targetCourt) {
        result = { changed: false, errors: ['COURT_NOT_AVAILABLE'], warnings: [] };
        return state;
      }
      const validation = validateRuntimeRoster({
        roster: match.roster,
        players: reconciledPlayers,
        courts: state.courts,
        targetCourtId: targetCourt.id,
        allowedStatuses: ['WAITING', 'JUST_FINISHED'],
        expectedFormat: match.matchFormat ?? 'AUTO',
        sourceRevision: match.sourceRevision,
        runtimeVersion: state.runtimeVersion
      });
      if (match.validity === 'STALE' || validation.errors.length > 0) {
        result = {
          changed: false,
          errors: match.validity === 'STALE' && !validation.errors.includes('STALE_RUNTIME')
            ? ['STALE_RUNTIME', ...validation.errors]
            : validation.errors,
          warnings: validation.warnings
        };
        return state;
      }

      const now = Date.now();
      const roster = match.roster;

      const nextPlayers = reconciledPlayers.map((player) => {
        if (roster.includes(player.id)) {
          return replacePlayerStatus(player, {
            status: 'PRIORITY',
            statusUpdatedAt: now,
            lastCourt: targetCourt!.name,
            justFinishedAt: null,
            restUntil: null
          });
        }

        return player;
      });

      // Apply match to court
      const nextCourts = state.courts.map((item) =>
        item.id === targetCourt!.id
          ? {
              ...item,
              status: 'READY' as CourtStatus,
              slots: rosterToSlots(roster),
              startedAt: null,
              sourceRevision: state.runtimeVersion
            }
          : item
      );

      // A real allocation consumes one preview. Keep every other valid preview
      // stable, then fill the queue back to the configured court count in the
      // same Zustand transition and runtime snapshot.
      const remainingMatches = state.nextMatches.filter((m) => m.id !== matchId);
      const suggestionGeneration = state.suggestionGeneration + 1;
      const nextMatches = generateSchedulerNextMatches(
        { ...state, players: nextPlayers, courts: nextCourts, nextMatches: normalizeNextMatchQueue(remainingMatches), suggestionGeneration },
        state.suggestionMode,
        suggestionGeneration,
        'top-up'
      );

      result = { changed: true, errors: [], warnings: validation.warnings };
      return {
        players: nextPlayers,
        courts: nextCourts,
        nextMatches,
        suggestionGeneration
      };
    });
    return result;
  },

  replaceNextMatchPlayer: (matchId: string, slotIndex: number, playerId: string) => {
    set((state) => {
      const match = state.nextMatches.find((m) => m.id === matchId);
      if (!match || slotIndex < 0 || slotIndex >= match.roster.length) return state;

      const targetOldId = match.roster[slotIndex];
      if (targetOldId === playerId) return state;
      if (match.roster.includes(playerId)) return state;

      const usedOnCourts = new Set(state.courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
      if (usedOnCourts.has(playerId)) return state;
      const replacementPlayer = state.players.find((player) => player.id === playerId);
      if (!replacementPlayer || !isPlayerEligibleForReplacement(replacementPlayer)) return state;

      const sourceMatch = state.nextMatches.find((m) => m.id !== matchId && m.roster.includes(playerId));

      const nextMatches = state.nextMatches.map((m) => {
        let updatedRoster = [...m.roster];
        if (m.id === matchId) {
          updatedRoster[slotIndex] = playerId;
        } else if (m.id === sourceMatch?.id) {
          updatedRoster = updatedRoster.map((id) => (id === playerId ? targetOldId : id));
        }

        if (updatedRoster.every((playerIdValue, index) => playerIdValue === m.roster[index])) return m;
        return updateManualMatch(m, updatedRoster, state.players, state.courts, state.runtimeVersion);
      });

      return { nextMatches };
    });
  },
  replaceNextMatchRoster: (matchId: string, roster: string[]) => {
    let result: RuntimeActionResult = EMPTY_RUNTIME_ACTION_RESULT;
    set((state) => {
      // A replacement may come from another preview that was persisted with a
      // legacy/orphan PRIORITY state. Normalize it against actual READY courts
      // so saving the edit cannot strand the player or block the next Apply.
      const reconciledPlayers = reconcilePreparedPlayerStatuses(state.players, state.courts);
      const match = state.nextMatches.find((candidate) => candidate.id === matchId);
      if (!match || roster.length !== 4 || new Set(roster).size !== 4) {
        result = { changed: false, errors: roster.length !== 4 ? ['ROSTER_SIZE'] : ['DUPLICATE_PLAYER'], warnings: [] };
        return state;
      }
      if (roster.every((playerId, index) => playerId === match.roster[index])) return state;

      const targetOldIds = match.roster.filter((playerId) => !roster.includes(playerId));
      const addedIds = roster.filter((playerId) => !match.roster.includes(playerId));
      if (targetOldIds.length !== addedIds.length) {
        result = { changed: false, errors: ['DUPLICATE_PLAYER'], warnings: [] };
        return state;
      }

      const usedOnCourts = new Set(state.courts.flatMap((court) => court.slots).filter((playerId): playerId is string => Boolean(playerId)));
      const invalidReplacement = addedIds.some((playerId) => {
        const player = reconciledPlayers.find((candidate) => candidate.id === playerId);
        return !player || usedOnCourts.has(playerId) || !isPlayerEligibleForReplacement(player);
      });
      if (invalidReplacement) {
        result = { changed: false, errors: ['PLAYER_STATUS_BLOCKED'], warnings: [] };
        return state;
      }

      const replacementByAddedId = new Map(addedIds.map((playerId, index) => [playerId, targetOldIds[index]]));
      const changedMatchIds = new Set<string>();
      const nextMatches = state.nextMatches.map((candidate) => {
        if (candidate.id === matchId) {
          changedMatchIds.add(candidate.id);
          return updateManualMatch(candidate, [...roster], reconciledPlayers, state.courts, state.runtimeVersion);
        }
        let changed = false;
        const nextRoster = candidate.roster.map((playerId) => {
          const replacementId = replacementByAddedId.get(playerId);
          if (!replacementId) return playerId;
          changed = true;
          return replacementId;
        });
        return changed
          ? (() => {
              changedMatchIds.add(candidate.id);
              return updateManualMatch(candidate, nextRoster, reconciledPlayers, state.courts, state.runtimeVersion);
            })()
          : candidate;
      });
      const queuedIds = nextMatches.flatMap((candidate) => candidate.roster);
      if (new Set(queuedIds).size !== queuedIds.length) {
        result = { changed: false, errors: ['DUPLICATE_PLAYER'], warnings: [] };
        return state;
      }

      const validations = nextMatches
        .filter((candidate) => changedMatchIds.has(candidate.id))
        .map((candidate) => validateRuntimeRoster({
          roster: candidate.roster,
          players: reconciledPlayers,
          courts: state.courts,
          allowedStatuses: ['WAITING', 'JUST_FINISHED', 'PRIORITY'],
          // Manual edits define their actual content. Format/Couple/balance
          // deviations are advisory and are surfaced through warning codes.
          expectedFormat: candidate.matchFormat ?? 'AUTO'
        }));
      const errors = [...new Set(validations.flatMap((validation) => validation.errors))];
      const warnings = [...new Set(validations.flatMap((validation) => validation.warnings))];
      if (errors.length > 0) {
        result = { changed: false, errors, warnings };
        return state;
      }
      result = { changed: true, errors: [], warnings };
      return { players: reconciledPlayers, nextMatches };
    });
    return result;
  },
  toggleNextMatchLock: (matchId: string) => {
    set((state) => ({
      nextMatches: state.nextMatches.map((match) => (
        match.id === matchId ? { ...match, locked: !match.locked } : match
      ))
    }));
  },
  startMatch: (courtId: string) => {
    let result: RuntimeActionResult = EMPTY_RUNTIME_ACTION_RESULT;
    set((state) => {
      const court = state.courts.find((c) => c.id === courtId);
      if (!court || court.status !== 'READY') {
        result = { changed: false, errors: ['COURT_NOT_AVAILABLE'], warnings: [] };
        return state;
      }

      const now = Date.now();
      const activePlayerIds = court.slots.filter((s): s is string => Boolean(s));
      const validation = validateRuntimeRoster({
        roster: activePlayerIds,
        players: state.players,
        courts: state.courts,
        targetCourtId: court.id,
        allowedStatuses: ['PRIORITY'],
        expectedFormat: inferRuntimeMatchFormat(activePlayerIds, state.players),
        sourceRevision: court.sourceRevision,
        runtimeVersion: state.runtimeVersion
      });
      if (validation.errors.length > 0) {
        result = { changed: false, errors: validation.errors, warnings: validation.warnings };
        return state;
      }

      const nextPlayers = state.players.map((player) => {
        if (activePlayerIds.includes(player.id)) {
          const tags = normalizePlayerTags(player.playerTags).filter((tag) => tag !== 'PRIORITY');
          return replacePlayerStatus(player, {
            status: 'PLAYING',
            statusUpdatedAt: now,
            lastCourt: court.name,
            justFinishedAt: null,
            restUntil: null,
            playerTags: tags,
            nextMatchRequestedAt: null,
            nextMatchRequestMode: null,
            entryPriorityConsumedAt: player.entryPriorityConsumedAt ?? now,
            deferredRounds: 0,
            waitingSince: null
          });
        }
        if (isEligibleForAutoSuggestion(player) && !hasPlayerTag(player, 'HOST')) {
          return replacePlayerStatus(player, { deferredRounds: player.deferredRounds + 1 });
        }
        return player;
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId ? { ...item, status: 'PLAYING' as CourtStatus, startedAt: now } : item
      );
      const suggestionGeneration = state.suggestionGeneration + 1;
      const nextMatches = generateSchedulerNextMatches(
        { ...state, players: nextPlayers, courts: nextCourts, suggestionGeneration },
        state.suggestionMode,
        suggestionGeneration,
        'top-up'
      );

      result = { changed: true, errors: [], warnings: validation.warnings };
      return { players: nextPlayers, courts: nextCourts, nextMatches, suggestionGeneration };
    });
    return result;
  },
  endMatch: (courtId: string) => {
    set((state) => {
      const court = state.courts.find((c) => c.id === courtId);
      if (!court || court.status !== 'PLAYING') return state;

      const now = Date.now();
      const finishedIds = court.slots.filter((slot): slot is string => Boolean(slot));

      if (finishedIds.length === 0) return state;

      const playerNameLookup = new Map(state.players.map((player) => [player.id, player.name]));

      const nextPlayers = state.players.map((player) => {
        if (!finishedIds.includes(player.id)) return player;

        const shouldEnd = player.endGameAfterMatch || normalizePlayerTags(player.playerTags).includes('END_GAME');
        return replacePlayerStatus(player, {
          status: shouldEnd ? 'FINISHED' : 'WAITING',
          statusUpdatedAt: now,
          justFinishedAt: null,
          lastFinishedAt: now,
          waitingSince: shouldEnd ? null : now,
          endGameAt: shouldEnd ? player.endGameAt ?? now : player.endGameAt,
          endGameAfterMatch: false,
          lastCourt: court.name,
          matchesPlayed: player.matchesPlayed + 1,
          setsPlayed: player.setsPlayed + 1,
          fatigue: clamp(player.fatigue + 1, 0, 5)
        });
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId
          ? {
              ...item,
              status: 'EMPTY' as CourtStatus,
              slots: [null, null, null, null] as [string | null, string | null, string | null, string | null],
              startedAt: null
            }
          : item
      );

      const nextHistory: MatchHistory[] = [
        {
          id: `history-${courtId}-${now}`,
          courtId: court.id,
          courtName: court.name,
          endedAt: now,
          durationMs: court.startedAt ? now - court.startedAt : null,
          playerNames: finishedIds
            .map((id) => playerNameLookup.get(id))
            .filter((value): value is string => Boolean(value)),
          playerIds: finishedIds,
          round: state.session.round
        },
        ...state.history
      ].slice(0, MATCH_HISTORY_LIMIT);

      const recentQuartets = [{ matchId: `local-${courtId}-${now}`, playerIds: [...finishedIds].sort(), endedAt: now }, ...state.recentQuartets].slice(0, 16);
      const suggestionGeneration = state.suggestionGeneration + 1;
      const nextMatches = generateSchedulerNextMatches(
        { ...state, players: nextPlayers, courts: nextCourts, recentQuartets, suggestionGeneration },
        state.suggestionMode,
        suggestionGeneration,
        'top-up'
      );
      return { players: nextPlayers, courts: nextCourts, nextMatches, history: nextHistory, recentQuartets, suggestionGeneration };
    });
  },
  setRuntimeSessionId: (sessionId: string | null) => {
    set({ runtimeSessionId: sessionId });
  },
  hydrateRuntimeSnapshot: (snapshot: RuntimeSnapshot) => {
    set((state) => {
      const hydratedPlayers = snapshot.players.map((rp) => mapSessionPlayerToPlayer(rp));
      const hydratedCourts = mapRuntimeCourtsToCourts(snapshot.courts, snapshot.matches);
      const hydratedNextMatches = mapRuntimeMatchesToNextMatches(snapshot.matches, hydratedPlayers);
      const reconciledPlayers = reconcilePreparedPlayerStatuses(hydratedPlayers, hydratedCourts);

      return {
        runtimeSessionId: snapshot.session?.id || null,
        players: reconciledPlayers,
        courts: hydratedCourts,
        nextMatches: hydratedNextMatches,
        session: snapshot.session ? mapRuntimeSession(snapshot.session, state.session) : state.session,
        recentQuartets: snapshot.recentQuartets,
        runtimeVersion: snapshot.version,
        suggestionGeneration: Math.max(0, ...hydratedNextMatches.map((match) => match.generation ?? 0))
      };
    });
  }
};
});
