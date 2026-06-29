import { create } from 'zustand';
import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';
import type { RuntimeCourt, RuntimeMatch, RuntimeSession, RuntimeSessionPlayer, RuntimeSnapshot } from '@/types/runtime';

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
  locked?: boolean;
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
  suggestionMode: SuggestionMode;
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
  updatePlayer: (playerId: string, patch: Partial<Pick<Player, 'name' | 'gender' | 'level' | 'money' | 'paymentType' | 'discount' | 'note' | 'playerTags'>>) => void;
  updatePlayerPayment: (playerId: string, patch: Partial<Pick<Player, 'paymentStatus' | 'paymentType' | 'money' | 'discount'>>) => void;
  setCourtCount?: (count: number) => void;
  refreshNextMatches: (mode?: SuggestionMode) => void;
  replaceNextMatchPlayer: (matchId: string, slotIndex: number, playerId: string) => void;
  toggleNextMatchLock: (matchId: string) => void;
  endMatch: (courtId: string) => void;
  startMatch: (courtId: string) => void;
}

const JUST_FINISHED_COOLDOWN_MS = 120_000;
const SUGGESTION_POOL_LIMIT = 18;
const MATCH_HISTORY_LIMIT = 8;
const RECENT_PAIR_HISTORY_LIMIT = 12;
const LEVEL_MIN = 1;
const LEVEL_MAX = 6;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const normalizeLevel = (level: number): number => clamp(Math.floor(Number(level || LEVEL_MIN)), LEVEL_MIN, LEVEL_MAX);
const getEffectiveLevel = (player: Pick<Player, 'level' | 'gender'>): number => {
  const normalized = normalizeLevel(player.level);
  return player.gender === 'Nữ' ? clamp(normalized - 1, LEVEL_MIN, LEVEL_MAX) : normalized;
};

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

export function buildCourtSuggestion(players: Player[], court: Court, excludedPlayerIds: Set<string> = new Set(), mode: SuggestionMode = 'random', history: MatchHistory[] = []): string[] {
  const availableCandidates = players
    .filter((player) => isPlayerEligibleForAutoSuggestion(player, excludedPlayerIds));
  const nonHostCandidates = availableCandidates.filter((player) => !hasPlayerTag(player, 'HOST'));
  const candidateSource = nonHostCandidates.length >= 4 ? nonHostCandidates : availableCandidates;
  const baseCandidates = candidateSource
    .sort((left, right) => {
      const leftPriority = hasPlayerTag(left, 'PRIORITY') ? 0 : 1;
      const rightPriority = hasPlayerTag(right, 'PRIORITY') ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftHost = hasPlayerTag(left, 'HOST') ? 1 : 0;
      const rightHost = hasPlayerTag(right, 'HOST') ? 1 : 0;
      if (leftHost !== rightHost) return leftHost - rightHost;

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

      const leftLevel = getEffectiveLevel(left);
      const rightLevel = getEffectiveLevel(right);

      if (leftLevel !== rightLevel) {
        return leftLevel - rightLevel;
      }

      if (left.fatigue !== right.fatigue) {
        return left.fatigue - right.fatigue;
      }

      return left.name.localeCompare(right.name, 'vi');
    });

  const candidates = filterCandidatesBySuggestionMode(baseCandidates, mode);

  if (candidates.length < 4) {
    return [];
  }

  return pickBestRoster(candidates, court, mode, history);
}

function hasPlayerTag(player: Pick<Player, 'playerTags'>, tag: PlayerTag): boolean {
  return normalizePlayerTags(player.playerTags).includes(tag);
}

function isPlayerEligibleForAutoSuggestion(player: Player, excludedPlayerIds: Set<string>): boolean {
  if (excludedPlayerIds.has(player.id)) return false;
  if (player.status !== 'WAITING' && player.status !== 'JUST_FINISHED') return false;
  const tags = normalizePlayerTags(player.playerTags);
  if (tags.includes('INJURED') || tags.includes('LEFT_EARLY')) return false;
  if (tags.includes('NOT_ARRIVED') && !tags.includes('PRIORITY') && !tags.includes('HOST')) return false;
  return tags.includes('ARRIVED') || tags.includes('PRIORITY') || tags.includes('HOST');
}

function filterCandidatesBySuggestionMode(candidates: Player[], mode: SuggestionMode): Player[] {
  if (mode === 'men') {
    return candidates.filter((player) => player.gender === 'Nam');
  }

  if (mode === 'women') {
    return candidates.filter((player) => player.gender === 'Nữ');
  }

  if (mode === 'mixed') {
    const male = candidates.filter((player) => player.gender === 'Nam');
    const female = candidates.filter((player) => player.gender === 'Nữ');
    if (male.length < 2 || female.length < 2) return [];
    return interleaveByGender(male, female);
  }

  return candidates;
}

function interleaveByGender(male: Player[], female: Player[]): Player[] {
  const output: Player[] = [];
  const max = Math.max(male.length, female.length);
  for (let index = 0; index < max; index++) {
    if (male[index]) output.push(male[index]);
    if (female[index]) output.push(female[index]);
  }
  return output;
}

function pickBestRoster(candidates: Player[], court: Court, mode: SuggestionMode = 'random', history: MatchHistory[] = []): string[] {
  const pool = buildFairnessPool(candidates);
  const minCandidateMatches = Math.min(...candidates.map((player) => player.matchesPlayed));
  const options: {
    roster: Player[];
    score: number;
    totalMatches: number;
    maxMatches: number;
    aboveMinCount: number;
    lowestMatchCount: number;
    hostCount: number;
    priorityCount: number;
  }[] = [];

  for (let a = 0; a < pool.length - 3; a++) {
    for (let b = a + 1; b < pool.length - 2; b++) {
      for (let c = b + 1; c < pool.length - 1; c++) {
        for (let d = c + 1; d < pool.length; d++) {
          const quartet = [pool[a], pool[b], pool[c], pool[d]];
          if (!matchesSuggestionMode(quartet, mode)) {
            continue;
          }
          const arranged = arrangeRosterPairs(quartet, history);
          options.push({
            roster: arranged.roster,
            score: scoreRosterOption(arranged.roster, court.name, arranged.pairScore, court.suggestionSeed, history, minCandidateMatches, mode),
            totalMatches: arranged.roster.reduce((total, player) => total + player.matchesPlayed, 0),
            maxMatches: Math.max(...arranged.roster.map((player) => player.matchesPlayed)),
            aboveMinCount: arranged.roster.filter((player) => player.matchesPlayed > minCandidateMatches).length,
            lowestMatchCount: arranged.roster.filter((player) => player.matchesPlayed === minCandidateMatches).length,
            hostCount: arranged.roster.filter((player) => hasPlayerTag(player, 'HOST')).length,
            priorityCount: arranged.roster.filter((player) => hasPlayerTag(player, 'PRIORITY')).length
          });
        }
      }
    }
  }

  if (options.length === 0) return [];

  options.sort((left, right) => {
    if (left.priorityCount !== right.priorityCount) return right.priorityCount - left.priorityCount;
    if (left.aboveMinCount !== right.aboveMinCount) return left.aboveMinCount - right.aboveMinCount;
    if (left.lowestMatchCount !== right.lowestMatchCount) return right.lowestMatchCount - left.lowestMatchCount;
    if (left.hostCount !== right.hostCount) return left.hostCount - right.hostCount;
    if (left.totalMatches !== right.totalMatches) return left.totalMatches - right.totalMatches;
    if (left.maxMatches !== right.maxMatches) return left.maxMatches - right.maxMatches;
    return right.score - left.score;
  });
  const bestOption = options[0];
  const alternateOptions = options.slice(1, Math.min(6, options.length));
  const suggestionIndex = getSuggestionIndex(court.name);
  const selected = suggestionIndex <= 1 || alternateOptions.length === 0
    ? bestOption
    : alternateOptions[(court.suggestionSeed + suggestionIndex) % alternateOptions.length];
  return selected.roster.map((player) => player.id);
}

function getSuggestionIndex(courtName: string): number {
  const match = courtName.match(/#(\d+)/);
  return match ? Number(match[1]) : 1;
}

function buildFairnessPool(candidates: Player[]): Player[] {
  if (candidates.length <= SUGGESTION_POOL_LIMIT) return candidates;

  const minMatches = Math.min(...candidates.map((player) => player.matchesPlayed));
  let spread = 0;
  let pool: Player[] = [];

  while (pool.length < Math.min(4, candidates.length) && spread < 8) {
    pool = candidates.filter((player) => player.matchesPlayed <= minMatches + spread);
    spread += 1;
  }

  const overflow = candidates.filter((player) => !pool.includes(player));
  return [...pool, ...overflow].slice(0, SUGGESTION_POOL_LIMIT);
}

function matchesSuggestionMode(roster: Player[], mode: SuggestionMode): boolean {
  const maleCount = roster.filter((player) => player.gender === 'Nam').length;
  const femaleCount = roster.filter((player) => player.gender === 'Nữ').length;

  if (mode === 'men') return maleCount === 4;
  if (mode === 'women') return femaleCount === 4;
  if (mode === 'mixed') return maleCount === 2 && femaleCount === 2;
  return true;
}

function arrangeRosterPairs(players: Player[], history: MatchHistory[] = []): { roster: Player[]; pairScore: number } {
  const pairings = [
    [[players[0], players[1]], [players[2], players[3]]],
    [[players[0], players[2]], [players[1], players[3]]],
    [[players[0], players[3]], [players[1], players[2]]]
  ];

  const ranked = pairings.map(([teamA, teamB]) => {
    const teamALevel = getEffectiveLevel(teamA[0]) + getEffectiveLevel(teamA[1]);
    const teamBLevel = getEffectiveLevel(teamB[0]) + getEffectiveLevel(teamB[1]);
    const teamLevelGap = Math.abs(teamALevel - teamBLevel);
    const pairScore =
      scorePair(teamA[0], teamA[1], history)
      + scorePair(teamB[0], teamB[1], history)
      + scoreTeamGenderMatchup(teamA, teamB)
      + scoreTeamLevelBalance(teamLevelGap);
    return { roster: [...teamA, ...teamB], pairScore };
  });

  ranked.sort((left, right) => right.pairScore - left.pairScore);
  return ranked[0];
}

function scorePair(left: Player, right: Player, history: MatchHistory[] = []): number {
  const sameGender = left.gender === right.gender;
  const levelGap = Math.abs(getEffectiveLevel(left) - getEffectiveLevel(right));
  const matchGap = Math.abs(left.matchesPlayed - right.matchesPlayed);
  const levelScore = levelGap === 0 ? 150 : levelGap === 1 ? 92 : levelGap === 2 ? -18 : -260 - levelGap * 70;
  const genderScore = sameGender ? 44 : 34;
  return genderScore + levelScore + Math.max(0, 34 - matchGap * 10) - recentPairPenalty(left.name, right.name, history);
}

function scoreTeamLevelBalance(teamLevelGap: number): number {
  if (teamLevelGap === 0) return 240;
  if (teamLevelGap === 1) return 155;
  if (teamLevelGap === 2) return 20;
  return -320 - teamLevelGap * 95;
}

function scoreTeamGenderMatchup(teamA: Player[], teamB: Player[]): number {
  const teamASignature = teamA.map((player) => player.gender).sort().join('-');
  const teamBSignature = teamB.map((player) => player.gender).sort().join('-');
  if (teamASignature === teamBSignature) {
    if (teamASignature === 'Nam-Nữ') return 180;
    if (teamASignature === 'Nam-Nam') return 165;
    if (teamASignature === 'Nữ-Nữ') return 155;
    return 120;
  }

  const teamAIsSameGender = teamA[0].gender === teamA[1].gender;
  const teamBIsSameGender = teamB[0].gender === teamB[1].gender;
  if (teamAIsSameGender && teamBIsSameGender) return -420;

  const sameGenderTeam = teamAIsSameGender ? teamASignature : teamBSignature;
  if (sameGenderTeam === 'Nam-Nam') return -75;
  if (sameGenderTeam === 'Nữ-Nữ') return -115;
  return -90;
}

function scoreRosterOption(
  roster: Player[],
  courtName: string,
  pairScore: number,
  seed: number,
  history: MatchHistory[] = [],
  minCandidateMatches = 0,
  mode: SuggestionMode = 'random'
): number {
  const averageMatches = roster.reduce((total, player) => total + player.matchesPlayed, 0) / roster.length;
  const matchSpread = Math.max(...roster.map((player) => player.matchesPlayed)) - Math.min(...roster.map((player) => player.matchesPlayed));
  const levels = roster.map((player) => getEffectiveLevel(player));
  const levelSpread = Math.max(...levels) - Math.min(...levels);
  const justFinishedCount = roster.filter((player) => player.status === 'JUST_FINISHED').length;
  const repeatedCourtCount = roster.filter((player) => player.lastCourt === courtName).length;
  const fatigueTotal = roster.reduce((total, player) => total + player.fatigue, 0);
  const minMatches = Math.min(...roster.map((player) => player.matchesPlayed));
  const lowMatchCount = roster.filter((player) => player.matchesPlayed <= minMatches + 1).length;
  const absoluteLowestCount = roster.filter((player) => player.matchesPlayed === minCandidateMatches).length;
  const overMinPenalty = roster.reduce((penalty, player) => penalty + Math.max(0, player.matchesPlayed - minCandidateMatches) * 95, 0);
  const priorityCount = roster.filter((player) => hasPlayerTag(player, 'PRIORITY')).length;
  const arrivedCount = roster.filter((player) => hasPlayerTag(player, 'ARRIVED')).length;
  const hostCount = roster.filter((player) => hasPlayerTag(player, 'HOST')).length;
  const historyPenalty = recentRosterPenalty(roster, history);
  const noveltyNudge = roster.reduce((total, player, index) => total + player.name.charCodeAt(0) * (index + 1), seed) % 10;

  return (
    pairScore
    + Math.max(0, 360 - averageMatches * 58)
    + Math.max(0, 180 - matchSpread * 42)
    + lowMatchCount * 38
    + absoluteLowestCount * 120
    + priorityCount * 240
    + arrivedCount * 28
    + scoreRosterGenderFormation(roster, mode)
    + Math.max(0, 120 - levelSpread * 34)
    - justFinishedCount * 28
    - repeatedCourtCount * 18
    - fatigueTotal * 6
    - hostCount * 220
    - overMinPenalty
    - historyPenalty
    + noveltyNudge
  );
}

function scoreRosterGenderFormation(roster: Player[], mode: SuggestionMode): number {
  const maleCount = roster.filter((player) => player.gender === 'Nam').length;
  const femaleCount = roster.length - maleCount;

  if (mode === 'women') return femaleCount === 4 ? 180 : -400;
  if (mode === 'men') return maleCount === 4 ? 150 : -400;
  if (mode === 'mixed') return maleCount === 2 && femaleCount === 2 ? 120 : -300;

  if (maleCount === 2 && femaleCount === 2) return 130;
  if (femaleCount === 4) return 110;
  if (maleCount === 4) return 100;
  if (maleCount === 3 && femaleCount === 1) return 52;
  if (maleCount === 1 && femaleCount === 3) return 28;
  return 0;
}

function recentPairPenalty(leftName: string, rightName: string, history: MatchHistory[]): number {
  return history.slice(0, RECENT_PAIR_HISTORY_LIMIT).reduce((penalty, match, index) => {
    const hasBoth = match.playerNames.includes(leftName) && match.playerNames.includes(rightName);
    if (!hasBoth) return penalty;
    return penalty + Math.max(24, 150 - index * 9);
  }, 0);
}

function recentRosterPenalty(roster: Player[], history: MatchHistory[]): number {
  const names = roster.map((player) => player.name);
  return history.slice(0, RECENT_PAIR_HISTORY_LIMIT).reduce((penalty, match, index) => {
    const overlap = names.filter((name) => match.playerNames.includes(name)).length;
    if (overlap < 2) return penalty;
    const sameQuartetPenalty = overlap === 4 ? 320 : 0;
    return penalty + sameQuartetPenalty + overlap * Math.max(18, 58 - index * 4);
  }, 0);
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
  const skillA = teamA.reduce((total, player) => total + getEffectiveLevel(player), 0);
  const skillB = teamB.reduce((total, player) => total + getEffectiveLevel(player), 0);
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
    playerTags: normalizePlayerTags(player.playerTags),
    status: normalizePlayerStatus(player.runtimeStatus),
    fatigue: 0,
    lastCourt: player.lastCourtNumber ? `Sân ${player.lastCourtNumber}` : null,
    statusUpdatedAt: player.joinedAt ?? Date.now(),
    justFinishedAt: null,
    restUntil: null,
    avatarUrl: player.avatarUrl,
    avatarS3Key: player.avatarS3Key
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
    suggestionMode: 'random',
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
      const nextMatches = generateNextMatches(state.session.courtCount, nextPlayers, nextCourts, now, state.suggestionMode, new Set<string>(), state.history);

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
      players: state.players.map((player) => (
        player.id === playerId
          ? { ...player, ...patch, playerTags: patch.playerTags ? normalizePlayerTags(patch.playerTags) : player.playerTags }
          : player
      ))
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
      const nextMatches = generateNextMatches(count, state.players, nextCourts, undefined, state.suggestionMode, new Set<string>(), state.history);
      return { session: nextSession, courts: nextCourts, nextMatches };
    });
  },
  refreshNextMatches: (mode) => {
    set((state) => {
      const nextMode = mode ?? state.suggestionMode;
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
      const lockedMatches = state.nextMatches.filter((match) => match.locked && match.roster.length >= 4);
      const lockedPlayerIds = new Set(lockedMatches.flatMap((match) => match.roster));
      const generatedMatches = generateNextMatches(
        Math.max(0, state.session.courtCount - lockedMatches.length),
        nextPlayers,
        state.courts,
        now,
        nextMode,
        lockedPlayerIds,
        state.history
      );
      const lockedByIndex = new Map(lockedMatches.map((match) => [match.index, match]));
      const nextMatches: NextMatch[] = [];
      let generatedIndex = 0;
      for (let index = 1; index <= state.session.courtCount; index++) {
        const lockedMatch = lockedByIndex.get(index);
        if (lockedMatch) {
          nextMatches.push({ ...lockedMatch, index });
          continue;
        }

        const generatedMatch = generatedMatches[generatedIndex];
        if (!generatedMatch) continue;
        nextMatches.push({ ...generatedMatch, index });
        generatedIndex += 1;
      }
      return { players: nextPlayers, nextMatches, suggestionMode: nextMode };
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
        usedPlayerIds,
        state.suggestionMode,
        state.history
      );
      const nextMatches = (newMatch.roster.length >= 4 ? [...remaining, newMatch] : remaining).map((item, index) => ({
        ...item,
        index: index + 1
      }));

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
  toggleNextMatchLock: (matchId: string) => {
    set((state) => ({
      nextMatches: state.nextMatches.map((match) => (
        match.id === matchId ? { ...match, locked: !match.locked } : match
      ))
    }));
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
  excludedPlayerIds: Set<string> = new Set(),
  mode: SuggestionMode = 'random',
  history: MatchHistory[] = []
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

  const roster = buildCourtSuggestion(players, fakeCourt, excludedPlayerIds, mode, history);
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
    appliedCourtId: null,
    locked: false
  };
}

function generateNextMatches(
  count: number,
  players: Player[],
  courts: Court[],
  seedBase = 0,
  mode: SuggestionMode = 'random',
  initialUsedPlayerIds: Set<string> = new Set(),
  history: MatchHistory[] = []
): NextMatch[] {
  const matches: NextMatch[] = [];
  const usedPlayerIds = new Set<string>(initialUsedPlayerIds);
  for (let i = 0; i < count; i++) {
    const match = generateNextMatch(i + 1, players, courts, seedBase + i, usedPlayerIds, mode, history);
    if (match.roster.length < 4) break;
    matches.push(match);
    match.roster.forEach((playerId) => usedPlayerIds.add(playerId));
  }
  return matches;
}
});
