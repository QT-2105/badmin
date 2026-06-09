import { create } from 'zustand';
import type { RuntimeCourt, RuntimeMatch, RuntimeSession, RuntimeSessionPlayer, RuntimeSnapshot } from '@/types/runtime';

export type PlayerStatus = 'WAITING' | 'JUST_FINISHED' | 'PLAYING' | 'RESTING' | 'PRIORITY' | 'FINISHED';
export type CourtStatus = 'EMPTY' | 'READY' | 'PLAYING';
export type PaymentType = 'TM' | 'CK';
export type PaymentStatus = 'PAID' | 'WAIVED' | 'UNPAID';
export type GenderType = 'Nam' | 'Nữ';

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
  status: PlayerStatus;
  fatigue: number;
  lastCourt: string | null;
  statusUpdatedAt: number;
  justFinishedAt: number | null;
  restUntil: number | null;
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
}

export interface MatchHistory {
  id: string;
  courtId: string;
  courtName: string;
  endedAt: number;
  durationMs: number | null;
  playerNames: string[];
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
  history: MatchHistory[];
  setRuntimeSessionId: (sessionId: string | null) => void;
  hydrateRuntimeSnapshot: (snapshot: RuntimeSnapshot) => void;
  updateCooldowns: (now: number) => void;
  applyNextMatch: (matchId: string, courtId?: string) => void;
  replaceSlot: (courtId: string, slotIndex: number, playerId: string) => void;
  swapPairs: (courtId: string) => void;
  cancelReadyCourt: (courtId: string) => void;
  toggleMatch: (courtId: string) => void;
  checkIn: (playerId: string) => void;
  updatePlayer: (playerId: string, patch: Partial<Pick<Player, 'name' | 'gender' | 'level' | 'money' | 'paymentType' | 'discount' | 'note'>>) => void;
  updatePlayerPayment: (playerId: string, patch: Partial<Pick<Player, 'paymentStatus' | 'paymentType' | 'money' | 'discount'>>) => void;
  setCourtCount?: (count: number) => void;
  refreshNextMatches: () => void;
  replaceNextMatchPlayer: (matchId: string, slotIndex: number, playerId: string) => void;
  endMatch: (courtId: string) => void;
  startMatch: (courtId: string) => void;
}

const JUST_FINISHED_COOLDOWN_MS = 120_000;
const SUGGESTION_POOL_LIMIT = 18;
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

export function buildCourtSuggestion(players: Player[], court: Court, excludedPlayerIds: Set<string> = new Set()): string[] {
  const candidates = players
    .filter((player) => !excludedPlayerIds.has(player.id) && (player.status === 'WAITING' || player.status === 'JUST_FINISHED'))
    .sort((left, right) => {
      if (left.matchesPlayed !== right.matchesPlayed) {
        return left.matchesPlayed - right.matchesPlayed;
      }

      const leftStatus = left.status === 'WAITING' ? 0 : 1;
      const rightStatus = right.status === 'WAITING' ? 0 : 1;

      if (leftStatus !== rightStatus) {
        return leftStatus - rightStatus;
      }

      const leftClock = left.status === 'JUST_FINISHED' ? left.justFinishedAt ?? left.statusUpdatedAt : left.statusUpdatedAt;
      const rightClock = right.status === 'JUST_FINISHED' ? right.justFinishedAt ?? right.statusUpdatedAt : right.statusUpdatedAt;

      if (leftClock !== rightClock) {
        return leftClock - rightClock;
      }

      if (Math.abs(left.level - right.level) > 0) {
        return left.level - right.level;
      }

      if (left.fatigue !== right.fatigue) {
        return left.fatigue - right.fatigue;
      }

      return left.name.localeCompare(right.name, 'vi');
    });

  if (candidates.length < 4) {
    return [];
  }

  return pickBestRoster(candidates, court);
}

function pickBestRoster(candidates: Player[], court: Court): string[] {
  const pool = candidates.slice(0, SUGGESTION_POOL_LIMIT);
  const options: { roster: Player[]; score: number }[] = [];

  for (let a = 0; a < pool.length - 3; a++) {
    for (let b = a + 1; b < pool.length - 2; b++) {
      for (let c = b + 1; c < pool.length - 1; c++) {
        for (let d = c + 1; d < pool.length; d++) {
          const quartet = [pool[a], pool[b], pool[c], pool[d]];
          const arranged = arrangeRosterPairs(quartet);
          options.push({ roster: arranged.roster, score: scoreRosterOption(arranged.roster, court.name, arranged.pairScore, court.suggestionSeed) });
        }
      }
    }
  }

  if (options.length === 0) return [];

  options.sort((left, right) => right.score - left.score);
  const topOptions = options.slice(0, Math.min(4, options.length));
  return topOptions[court.suggestionSeed % topOptions.length].roster.map((player) => player.id);
}

function arrangeRosterPairs(players: Player[]): { roster: Player[]; pairScore: number } {
  const pairings = [
    [[players[0], players[1]], [players[2], players[3]]],
    [[players[0], players[2]], [players[1], players[3]]],
    [[players[0], players[3]], [players[1], players[2]]]
  ];

  const ranked = pairings.map(([teamA, teamB]) => {
    const teamALevel = teamA[0].level + teamA[1].level;
    const teamBLevel = teamB[0].level + teamB[1].level;
    const teamLevelGap = Math.abs(teamALevel - teamBLevel);
    const pairScore = scorePair(teamA[0], teamA[1]) + scorePair(teamB[0], teamB[1]) + scoreTeamGenderMatchup(teamA, teamB) + scoreTeamLevelBalance(teamLevelGap);
    return { roster: [...teamA, ...teamB], pairScore };
  });

  ranked.sort((left, right) => right.pairScore - left.pairScore);
  return ranked[0];
}

function scorePair(left: Player, right: Player): number {
  const sameGender = left.gender === right.gender;
  const levelGap = Math.abs(left.level - right.level);
  const matchGap = Math.abs(left.matchesPlayed - right.matchesPlayed);
  const levelScore = levelGap === 0 ? 70 : levelGap === 1 ? 42 : levelGap === 2 ? 8 : -70;
  return (sameGender ? 42 : 24) + levelScore + Math.max(0, 24 - matchGap * 8);
}

function scoreTeamLevelBalance(teamLevelGap: number): number {
  if (teamLevelGap === 0) return 120;
  if (teamLevelGap === 1) return 70;
  if (teamLevelGap === 2) return -20;
  return -180 - teamLevelGap * 60;
}

function scoreTeamGenderMatchup(teamA: Player[], teamB: Player[]): number {
  const teamASignature = teamA.map((player) => player.gender).sort().join('-');
  const teamBSignature = teamB.map((player) => player.gender).sort().join('-');
  if (teamASignature === teamBSignature) return 80;

  const teamAIsSameGender = teamA[0].gender === teamA[1].gender;
  const teamBIsSameGender = teamB[0].gender === teamB[1].gender;
  if (teamAIsSameGender && teamBIsSameGender) return -140;
  return -60;
}

function scoreRosterOption(roster: Player[], courtName: string, pairScore: number, seed: number): number {
  const averageMatches = roster.reduce((total, player) => total + player.matchesPlayed, 0) / roster.length;
  const matchSpread = Math.max(...roster.map((player) => player.matchesPlayed)) - Math.min(...roster.map((player) => player.matchesPlayed));
  const levelSpread = Math.max(...roster.map((player) => player.level)) - Math.min(...roster.map((player) => player.level));
  const justFinishedCount = roster.filter((player) => player.status === 'JUST_FINISHED').length;
  const repeatedCourtCount = roster.filter((player) => player.lastCourt === courtName).length;
  const fatigueTotal = roster.reduce((total, player) => total + player.fatigue, 0);
  const noveltyNudge = roster.reduce((total, player, index) => total + player.name.charCodeAt(0) * (index + 1), seed) % 18;

  return (
    pairScore
    + Math.max(0, 220 - averageMatches * 34)
    + Math.max(0, 90 - matchSpread * 22)
    + Math.max(0, 70 - levelSpread * 20)
    - justFinishedCount * 22
    - repeatedCourtCount * 18
    - fatigueTotal * 6
    + noveltyNudge
  );
}

export function evaluateRoster(players: Player[], roster: string[], courtName: string): {
  fairness: number;
  antiRepeat: number;
  fatigueBalance: number;
} {
  const selected = roster
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is Player => Boolean(player));

  if (selected.length === 0) {
    return { fairness: 0, antiRepeat: 0, fatigueBalance: 0 };
  }

  const teamA = selected.slice(0, 2);
  const teamB = selected.slice(2, 4);
  const skillA = teamA.reduce((total, player) => total + player.level, 0);
  const skillB = teamB.reduce((total, player) => total + player.level, 0);
  const fatigueA = teamA.reduce((total, player) => total + player.fatigue, 0);
  const fatigueB = teamB.reduce((total, player) => total + player.fatigue, 0);
  const repeatHits = selected.filter((player) => player.lastCourt === courtName).length;
  const averageFatigue = selected.reduce((total, player) => total + player.fatigue, 0) / selected.length;

  return {
    fairness: clamp(100 - Math.abs(skillA - skillB) * 10 - Math.abs(fatigueA - fatigueB) * 5, 0, 100),
    antiRepeat: clamp(100 - repeatHits * 18, 0, 100),
    fatigueBalance: clamp(100 - Math.abs(averageFatigue - 2) * 15, 0, 100)
  };
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
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const match = String(value).match(/\d{1,2}:\d{2}/);
  return match ? match[0] : null;
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
    status: normalizePlayerStatus(player.runtimeStatus),
    fatigue: 0,
    lastCourt: player.lastCourtNumber ? `Sân ${player.lastCourtNumber}` : null,
    statusUpdatedAt: player.joinedAt ?? Date.now(),
    justFinishedAt: null,
    restUntil: null
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
      suggestionSeed: idx
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
    if (uniqueRoster.length < 4 || uniqueRoster.some((playerId) => usedPlayerIds.has(playerId))) {
      return [];
    }
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
      appliedCourtId: match.courtId ?? null
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
    history: [],
  updateCooldowns: (now) => {
    set((state) => {
      let changed = false;
      const nextPlayers = state.players.map((player) => {
        if (player.status === 'JUST_FINISHED' && player.justFinishedAt !== null && now - player.justFinishedAt >= JUST_FINISHED_COOLDOWN_MS) {
          changed = true;
          return replacePlayerStatus(player, {
            status: 'WAITING',
            justFinishedAt: null,
            statusUpdatedAt: now
          });
        }

        if (player.status === 'RESTING' && player.restUntil !== null && now >= player.restUntil) {
          changed = true;
          return replacePlayerStatus(player, {
            status: 'WAITING',
            restUntil: null,
            statusUpdatedAt: now
          });
        }

        return player;
      });

      if (!changed) return state;
      return { players: nextPlayers };
    });
  },
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

      return { players: nextPlayers, courts: nextCourts };
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
      const nextPlayers = state.players.map((player) => {
        if (!cancelledPlayerIds.includes(player.id)) return player;

        return replacePlayerStatus(player, {
          status: 'WAITING',
          statusUpdatedAt: now,
          justFinishedAt: null,
          restUntil: null
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
      const nextMatches = generateNextMatches(state.session.courtCount, nextPlayers, nextCourts, now);

      return { players: nextPlayers, courts: nextCourts, nextMatches };
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

          return replacePlayerStatus(player, {
            status: 'JUST_FINISHED',
            statusUpdatedAt: now,
            justFinishedAt: now,
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
            round: state.session.round
          },
          ...state.history
        ].slice(0, MATCH_HISTORY_LIMIT);

        return { players: nextPlayers, courts: nextCourts, history: nextHistory };
      }

      if (court.slots.some((slot) => slot === null)) {
        return state;
      }

      const activePlayerIds = court.slots.filter((slot): slot is string => Boolean(slot));
      const nextPlayers = state.players.map((player) => {
        if (!activePlayerIds.includes(player.id)) {
          return player;
        }

        return replacePlayerStatus(player, {
          status: 'PLAYING',
          statusUpdatedAt: now,
          lastCourt: court.name,
          justFinishedAt: null,
          restUntil: null
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

      const nextPlayers = state.players.map((player) =>
        player.id === playerId
          ? replacePlayerStatus(player, {
              status: 'WAITING',
              statusUpdatedAt: now,
              justFinishedAt: null,
              restUntil: null
            })
          : player
      );

      return { players: nextPlayers };
    });
  },
  updatePlayer: (playerId, patch) => {
    set((state) => ({
      players: state.players.map((player) => (player.id === playerId ? { ...player, ...patch } : player))
    }));
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
      const nextMatches = generateNextMatches(count, state.players, nextCourts);
      return { session: nextSession, courts: nextCourts, nextMatches };
    });
  },
  refreshNextMatches: () => {
    set((state) => {
      const onCourtIds = new Set(state.courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
      const now = Date.now();
      const nextPlayers = state.players.map((player) => {
        if (player.status === 'PRIORITY' && !onCourtIds.has(player.id)) {
          return replacePlayerStatus(player, {
            status: 'WAITING',
            statusUpdatedAt: now,
            justFinishedAt: null,
            restUntil: null
          });
        }

        return player;
      });
      const nextMatches = generateNextMatches(state.session.courtCount, nextPlayers, state.courts, now);
      return { players: nextPlayers, nextMatches };
    });
  },
  applyNextMatch: (matchId: string, courtId?: string) => {
    set((state) => {
      const match = state.nextMatches.find((m) => m.id === matchId);
      if (!match || !match.roster || match.roster.length < 4) return state;

      let targetCourt: Court | undefined;
      if (courtId) {
        targetCourt = state.courts.find((c) => c.id === courtId && (c.status === 'EMPTY' || c.status === 'READY'));
      } else {
        targetCourt = state.courts.find((c) => c.status === 'EMPTY');
      }

      if (!targetCourt) return state;

      const now = Date.now();
      const roster = match.roster;
      const replacedReadyPlayerIds = targetCourt.slots.filter((slot): slot is string => Boolean(slot)).filter((slot) => !roster.includes(slot));

      const nextPlayers = state.players.map((player) => {
        if (roster.includes(player.id)) {
          return replacePlayerStatus(player, {
            status: 'PRIORITY',
            statusUpdatedAt: now,
            lastCourt: targetCourt!.name,
            justFinishedAt: null,
            restUntil: null
          });
        }

        if (replacedReadyPlayerIds.includes(player.id)) {
          return replacePlayerStatus(player, {
            status: 'WAITING',
            statusUpdatedAt: now,
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
              startedAt: null
            }
          : item
      );

      // Remove applied match and generate new one
      const remaining = state.nextMatches.filter((m) => m.id !== matchId);
      const usedPlayerIds = new Set<string>(remaining.flatMap((m) => m.roster));
      const newMatch = generateNextMatch(
        remaining.length + 1,
        nextPlayers,
        nextCourts,
        Math.max(...state.nextMatches.map((m) => m.index)) + 1,
        usedPlayerIds
      );
      const nextMatches = newMatch.roster.length >= 4 ? [...remaining, newMatch] : remaining;

      return {
        players: nextPlayers,
        courts: nextCourts,
        nextMatches
      };
    });
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

      const now = Date.now();
      const sourceMatch = state.nextMatches.find((m) => m.id !== matchId && m.roster.includes(playerId));
      const shouldSwapAcrossMatches = Boolean(sourceMatch);

      const nextPlayers = state.players.map((p) => {
        if (p.id === playerId) {
          return replacePlayerStatus(p, {
            status: 'PRIORITY',
            statusUpdatedAt: now,
            justFinishedAt: null,
            restUntil: null
          });
        }

        if (p.id === targetOldId) {
          return replacePlayerStatus(p, {
            status: shouldSwapAcrossMatches ? 'PRIORITY' : 'WAITING',
            statusUpdatedAt: now,
            justFinishedAt: null,
            restUntil: null
          });
        }

        return p;
      });

      const nextMatches = state.nextMatches.map((m) => {
        let updatedRoster = [...m.roster];
        if (m.id === matchId) {
          updatedRoster[slotIndex] = playerId;
        } else if (m.id === sourceMatch?.id) {
          updatedRoster = updatedRoster.map((id) => (id === playerId ? targetOldId : id));
        }

        if (updatedRoster === m.roster) return m;

        const scores = evaluateRoster(nextPlayers, updatedRoster, `Tiếp theo #${m.index}`);
        return { ...m, roster: updatedRoster, fairness: scores.fairness, antiRepeat: scores.antiRepeat, fatigueBalance: scores.fatigueBalance, score: Math.round((scores.fairness + scores.antiRepeat + scores.fatigueBalance) / 3) };
      });

      return { players: nextPlayers, nextMatches };
    });
  },
  startMatch: (courtId: string) => {
    set((state) => {
      const court = state.courts.find((c) => c.id === courtId);
      if (!court || court.status !== 'READY' || court.slots.some((s) => !s)) return state;

      const now = Date.now();
      const activePlayerIds = court.slots.filter((s): s is string => Boolean(s));

      const nextPlayers = state.players.map((player) => {
        if (activePlayerIds.includes(player.id)) {
          return replacePlayerStatus(player, {
            status: 'PLAYING',
            statusUpdatedAt: now,
            lastCourt: court.name,
            justFinishedAt: null,
            restUntil: null
          });
        }
        return player;
      });

      const nextCourts = state.courts.map((item) =>
        item.id === courtId ? { ...item, status: 'PLAYING' as CourtStatus, startedAt: now } : item
      );

      return { players: nextPlayers, courts: nextCourts };
    });
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

        return replacePlayerStatus(player, {
          status: 'JUST_FINISHED',
          statusUpdatedAt: now,
          justFinishedAt: now,
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
          round: state.session.round
        },
        ...state.history
      ].slice(0, MATCH_HISTORY_LIMIT);

      return { players: nextPlayers, courts: nextCourts, history: nextHistory };
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

      return {
        runtimeSessionId: snapshot.session?.id || null,
        players: hydratedPlayers,
        courts: hydratedCourts,
        nextMatches: hydratedNextMatches,
        session: snapshot.session ? mapRuntimeSession(snapshot.session, state.session) : state.session
      };
    });
  }
};

function generateNextMatch(
  index: number,
  players: Player[],
  courts: Court[],
  seed: number,
  excludedPlayerIds: Set<string> = new Set()
): NextMatch {
  const fakeCourt: Court = createCourt({
    id: `s-fake-${index}`,
    name: `Tiếp theo #${index}`,
    status: 'EMPTY',
    fairness: 0,
    antiRepeat: 0,
    fatigue: 0,
    slots: [null, null, null, null],
    suggestionSeed: seed
  });

  const roster = buildCourtSuggestion(players, fakeCourt, excludedPlayerIds);
  const scores = evaluateRoster(players, roster, fakeCourt.name);
  const score = Math.round((scores.fairness + scores.antiRepeat + scores.fatigueBalance) / 3);

  return {
    id: `nm-${Date.now()}-${index}`,
    index,
    roster,
    fairness: scores.fairness,
    antiRepeat: scores.antiRepeat,
    fatigueBalance: scores.fatigueBalance,
    score,
    appliedCourtId: null
  };
}

function generateNextMatches(
  count: number,
  players: Player[],
  courts: Court[],
  seedBase = 0
): NextMatch[] {
  const matches: NextMatch[] = [];
  const usedPlayerIds = new Set<string>();
  for (let i = 0; i < count; i++) {
    const match = generateNextMatch(i + 1, players, courts, seedBase + i, usedPlayerIds);
    if (match.roster.length < 4) break;
    matches.push(match);
    match.roster.forEach((playerId) => usedPlayerIds.add(playerId));
  }
  return matches;
}
});
