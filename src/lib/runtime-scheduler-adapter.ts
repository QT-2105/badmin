import { normalizePlayerTags } from '@/lib/player-tags';
import { isPlayerEligibleForAutoSuggestion as isEligibleForAutoSuggestion } from '@/lib/runtime-eligibility';
import {
  DEFAULT_RUNTIME_SCHEDULER_CONFIG,
  generateSchedulerPreviews,
  type GenerateSchedulerPreviewsResult,
  type SchedulerDiagnostics,
  type SchedulerMatchFormat,
  type SchedulerMode,
  type SchedulerPlayer
} from '@/lib/runtime-scheduler';
import type { BadmintonState, NextMatch, Player, SuggestionMode } from '@/lib/badminton-store';

export type SchedulerQueueStrategy = 'refresh' | 'top-up';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function toSchedulerMode(mode: SuggestionMode): SchedulerMode {
  return mode === 'random' ? 'auto' : mode;
}

function fromSchedulerFormat(
  format: SchedulerMatchFormat,
  mixedFormatFallback = false
): NextMatch['matchFormat'] {
  if (mixedFormatFallback) return 'AUTO';
  if (format === 'men') return 'MEN';
  if (format === 'women') return 'WOMEN';
  return 'MIXED';
}

function toSchedulerPlayer(player: Player): SchedulerPlayer {
  const tags = normalizePlayerTags(player.playerTags);
  const isHost = tags.includes('HOST');
  return {
    id: player.id,
    gender: player.gender,
    level: player.level,
    matchesPlayed: player.matchesPlayed,
    status: player.status,
    arrived: tags.includes('ARRIVED'),
    endGame: tags.includes('END_GAME') || player.endGameAt !== null,
    active: player.status !== 'FINISHED',
    host: isHost,
    // Host is an operational fallback, not a participant owed automatic
    // catch-up, wait protection, or a one-shot request. Its real match count is
    // retained only to choose sensibly between multiple otherwise equal Hosts.
    fairnessOffset: isHost ? 0 : player.fairnessOffset,
    entryPriority: !isHost && player.firstArrivedAt !== null && player.entryPriorityConsumedAt === null,
    deferredCycles: isHost ? 0 : player.deferredRounds,
    waitingSince: isHost ? null : player.waitingSince,
    lastFinishedAt: player.lastFinishedAt,
    nextMatchRequestedAt: isHost ? null : player.nextMatchRequestedAt,
    nextMatchRequestedMode: isHost ? null : player.nextMatchRequestMode === 'MEN'
      ? 'men'
      : player.nextMatchRequestMode === 'WOMEN'
        ? 'women'
        : player.nextMatchRequestMode === 'MIXED'
          ? 'mixed'
          : 'auto'
  };
}

function buildSchedulerCouples(players: Player[]) {
  const groups = new Map<string, Player[]>();
  for (const player of players) {
    if (player.coupleNumber === null || player.coupleMatchMode === null) continue;
    const key = `${player.coupleNumber}:${player.coupleMatchMode}`;
    const members = groups.get(key) ?? [];
    members.push(player);
    groups.set(key, members);
  }

  return [...groups.entries()].flatMap(([key, members]) => {
    if (members.length !== 2) return [];
    const [displayNumber, matchMode] = key.split(':') as [string, 'MEN' | 'WOMEN' | 'MIXED'];
    return [{
      id: `${displayNumber}:${matchMode}`,
      memberIds: [members[0].id, members[1].id] as [string, string],
      mode: matchMode === 'MEN' ? 'men' as const : matchMode === 'WOMEN' ? 'women' as const : 'mixed' as const,
      displayNumber: Number(displayNumber),
      active: true
    }];
  });
}

function mapSchedulerReason(code: string): string {
  if (code === 'BALANCED') return 'BALANCE_GOOD';
  if (code === 'NEXT_MATCH') return 'NEXT_MATCH_REQUEST';
  if (code === 'PROTECTED_WAIT') return 'WAIT_PROTECTION';
  if (code === 'COUPLE') return 'COUPLE_FIXED';
  return code;
}

export function qualityTierFromFairness(fairness: number): NonNullable<NextMatch['qualityTier']> {
  if (fairness >= 90) return 'EXCELLENT';
  if (fairness >= 75) return 'GOOD';
  if (fairness >= 60) return 'ACCEPTABLE';
  return 'REVIEW';
}

export function normalizeNextMatchQueue(matches: NextMatch[]): NextMatch[] {
  return [...matches]
    .sort((left, right) => left.index - right.index)
    .map((match, index) => ({ ...match, index: index + 1 }));
}

function getPreservedNextMatches(state: BadmintonState, strategy: SchedulerQueueStrategy): NextMatch[] {
  const onCourtIds = new Set(state.courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
  const orderedMatches = [...state.nextMatches].sort((left, right) => left.index - right.index);
  const lockedPlayerIds = new Set(
    orderedMatches
      .filter((match) => match.locked)
      .flatMap((match) => match.roster)
  );
  const usedPlayerIds = new Set<string>();
  const lockedCount = orderedMatches.filter((match) => match.locked).length;
  const unlockedCapacity = Math.max(0, state.session.courtCount - lockedCount);
  let preservedUnlockedCount = 0;

  const preserved = orderedMatches
    .filter((match) => {
      if (strategy === 'refresh' && !match.locked) return false;
      if (match.roster.length !== 4 || new Set(match.roster).size !== 4) return false;
      if (match.roster.some((playerId) => usedPlayerIds.has(playerId))) return false;
      if (match.locked) {
        match.roster.forEach((playerId) => usedPlayerIds.add(playerId));
        return true;
      }
      if (preservedUnlockedCount >= unlockedCapacity) return false;
      if (match.roster.some((playerId) => lockedPlayerIds.has(playerId))) return false;
      if (match.roster.some((playerId) => onCourtIds.has(playerId))) return false;
      const valid = match.roster.every((playerId) => {
        const player = state.players.find((candidate) => candidate.id === playerId);
        return Boolean(player && isEligibleForAutoSuggestion(player));
      });
      if (!valid) return false;
      match.roster.forEach((playerId) => usedPlayerIds.add(playerId));
      preservedUnlockedCount += 1;
      return true;
    });

  return normalizeNextMatchQueue(preserved);
}

export function generateSchedulerNextMatches(
  state: BadmintonState,
  mode: SuggestionMode,
  generation: number,
  strategy: SchedulerQueueStrategy = 'refresh'
): NextMatch[] {
  return createSchedulerNextMatchPlan(state, mode, generation, strategy).matches;
}

export function createSchedulerNextMatchPlan(
  state: BadmintonState,
  mode: SuggestionMode,
  generation: number,
  strategy: SchedulerQueueStrategy = 'refresh'
): { matches: NextMatch[]; diagnostics: string[] } {
  const preservedMatches = getPreservedNextMatches(state, strategy);
  const targetMatchCount = Math.max(state.session.courtCount, preservedMatches.length);
  const previousUnlockedQuartets = state.nextMatches
    .filter((match) => strategy === 'refresh' && !match.locked && match.roster.length === 4)
    .map((match) => ({
      matchId: `preview-${match.id}`,
      playerIds: [...match.roster],
      endedAt: Date.now()
    }));
  const onCourtIds = new Set(state.courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
  const result = generateSchedulerPreviews({
    players: state.players.map(toSchedulerPlayer),
    couples: buildSchedulerCouples(state.players),
    // The current unlocked previews are soft anti-repeat input only. This makes
    // each Auto gợi ý click produce a real alternative when one exists, while
    // locked previews remain exact and real match history stays authoritative.
    recentMatches: [...previousUnlockedQuartets, ...state.recentQuartets],
    previousPreviewPlayerIds: previousUnlockedQuartets.flatMap((match) => match.playerIds),
    lockedMatches: preservedMatches.map((match) => ({ id: match.id, playerIds: match.roster, index: match.index })),
    reservedPlayerIds: onCourtIds,
    targetMatchCount,
    mode: toSchedulerMode(mode),
    now: Date.now(),
    seed: `${state.runtimeSessionId ?? 'local'}:${generation}:${mode}`,
    config: {
      candidatePoolLimit: Math.min(48, Math.max(24, state.session.courtCount * 4 + 8))
    }
  });

  const preservedByIndex = new Map(preservedMatches.map((match) => [match.index, match]));
  const generatedByIndex = new Map(result.suggestions.map((suggestion) => [suggestion.index, suggestion]));
  const matches: NextMatch[] = [];
  for (let index = 1; index <= targetMatchCount; index += 1) {
    const preserved = preservedByIndex.get(index);
    if (preserved) {
      matches.push({ ...preserved, index });
      continue;
    }
    const suggestion = generatedByIndex.get(index);
    if (!suggestion) continue;
    const fairness = clamp(100 - suggestion.metrics.teamGap * 10, 0, 100);
    const antiRepeat = suggestion.metrics.recentQuartetRank === null ? 100 : clamp(70 + suggestion.metrics.recentQuartetRank * 5, 0, 95);
    const score = Math.round(fairness * 0.8 + antiRepeat * 0.2);
    const warningCodes = [
      ...(suggestion.metrics.recentQuartetRank === null ? [] : ['QUARTET_REPEAT_FALLBACK']),
      ...(suggestion.metrics.teamGap > DEFAULT_RUNTIME_SCHEDULER_CONFIG.maxTeamGap ? ['LEVEL_IMBALANCE'] : [])
    ];
    matches.push({
      id: suggestion.id,
      index,
      roster: [...suggestion.roster],
      fairness,
      antiRepeat,
      fatigueBalance: 100,
      score,
      appliedCourtId: null,
      locked: false,
      matchFormat: fromSchedulerFormat(suggestion.format, suggestion.metrics.mixedFormatFallback),
      generation,
      manualEdited: false,
      sourceRevision: state.runtimeVersion,
      qualityTier: qualityTierFromFairness(fairness),
      reasonCodes: suggestion.reasons.map(mapSchedulerReason),
      warningCodes,
      validity: warningCodes.length > 0 ? 'WARNING' : 'VALID'
    });
  }
  return {
    matches,
    diagnostics: describeSchedulerPlan(result, state, preservedMatches, targetMatchCount)
  };
}

function describeSchedulerPlan(
  result: GenerateSchedulerPreviewsResult,
  state: BadmintonState,
  preservedMatches: NextMatch[],
  targetMatchCount: number
): string[] {
  const diagnostics = result.diagnostics;
  const excludedCounts = countExcludedSchedulerReasons(diagnostics);
  const occupiedCourtPlayers = state.courts.flatMap((court) => court.slots).filter(Boolean).length;
  const lines = [
    `Auto gợi ý: ${preservedMatches.length + result.generatedMatchCount}/${targetMatchCount} trận.`,
    `${diagnostics.eligiblePlayerIds.length} người đủ điều kiện, ${occupiedCourtPlayers} người đang ở sân/giữ sân.`,
    `${result.lockedMatchCount} gợi ý Lock được giữ nguyên.`
  ];

  const excludedParts = [
    excludedCounts.NOT_ARRIVED ? `chưa tới ${excludedCounts.NOT_ARRIVED}` : null,
    excludedCounts.END_GAME ? `End-Game ${excludedCounts.END_GAME}` : null,
    excludedCounts.STATUS_BLOCKED ? `đang bận ${excludedCounts.STATUS_BLOCKED}` : null
  ].filter((part): part is string => Boolean(part));
  if (excludedParts.length > 0) {
    lines.push(`Bị loại: ${excludedParts.join(', ')}.`);
  }
  if (diagnostics.candidatePoolLimitReached) {
    lines.push('Nhóm ứng viên đã bị giới hạn để giữ tốc độ xử lý.');
  }
  for (const warning of diagnostics.warnings.slice(0, 3)) {
    lines.push(warning.message);
  }
  if (preservedMatches.length + result.generatedMatchCount < targetMatchCount) {
    lines.push('Không đủ phương án hợp lệ để lấp đầy toàn bộ số sân/gợi ý hiện tại.');
  }
  return [...new Set(lines)];
}

function countExcludedSchedulerReasons(diagnostics: SchedulerDiagnostics): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const reasons of Object.values(diagnostics.excludedPlayers)) {
    const primaryReason = reasons.includes('RESERVED')
      ? 'RESERVED'
      : reasons.includes('NOT_ARRIVED')
        ? 'NOT_ARRIVED'
        : reasons.includes('END_GAME')
          ? 'END_GAME'
          : reasons[0];
    if (primaryReason) counts[primaryReason] = (counts[primaryReason] ?? 0) + 1;
  }
  return counts;
}
