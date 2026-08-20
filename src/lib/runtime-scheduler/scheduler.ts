import type {
  GenerateSchedulerPreviewsInput,
  GenerateSchedulerPreviewsResult,
  SchedulerConfig,
  SchedulerCouple,
  SchedulerEligibilityReason,
  SchedulerLockedMatch,
  SchedulerMatchFormat,
  SchedulerMode,
  SchedulerNextMatchRequest,
  SchedulerPlayer,
  SchedulerReasonCode,
  SchedulerSuggestion,
  SchedulerSuggestionMetrics,
  SchedulerWarning
} from './types';

const FORMATS: readonly SchedulerMatchFormat[] = ['mixed', 'women', 'men'];

export const DEFAULT_RUNTIME_SCHEDULER_CONFIG: Readonly<SchedulerConfig> = {
  candidatePoolLimit: 18,
  maxOptionsPerFormat: 500,
  maxBatchOptions: 800,
  beamWidth: 64,
  preferredTeamGap: 1,
  maxTeamGap: 2,
  protectedDeferredCycles: 1,
  recentQuartetWindow: undefined,
  levelMin: 1,
  levelMax: 6,
  femaleEffectiveLevelOffset: -1,
  // JUST_FINISHED remains accepted during migration, but receives no hard
  // cooldown. The target lifecycle can map a completed player to WAITING.
  eligibleStatuses: ['WAITING', 'JUST_FINISHED']
};

type TeamIds = readonly [string, string];
type RosterIds = readonly [string, string, string, string];

interface CoupleIndex {
  activeById: Map<string, SchedulerCouple>;
  partnerByFormat: Record<SchedulerMatchFormat, Map<string, string>>;
  coupleIdByTeamKey: Record<SchedulerMatchFormat, Map<string, string>>;
  blockedByFormat: Record<SchedulerMatchFormat, Set<string>>;
  warnings: SchedulerWarning[];
}

interface ApplicableRequest {
  id: string;
  requestedAt: number;
  playerIds: readonly string[];
}

interface CandidateUnit {
  playerIds: readonly string[];
  protectedCount: number;
  deferredCycles: number;
  oldestRequestAt: number | null;
  entryPriorityCount: number;
  fairMatchesMax: number;
  fairMatchesTotal: number;
  waitingDurationMs: number;
  hostCount: number;
  previousPreviewPlayerCount: number;
  tieBreak: number;
}

interface TeamOption {
  ids: TeamIds;
  key: string;
  strength: number;
  coupleId: string | null;
}

interface MatchOption {
  format: SchedulerMatchFormat;
  teamA: TeamIds;
  teamB: TeamIds;
  roster: RosterIds;
  quartetSignature: string;
  metrics: SchedulerSuggestionMetrics;
  reasons: readonly SchedulerReasonCode[];
  balanceTier: number;
  formationTier: number;
  tieBreak: number;
}

interface BatchState {
  options: readonly MatchOption[];
  usedPlayerIds: ReadonlySet<string>;
  tieBreak: number;
}

interface GenerationCounters {
  evaluatedTeamCount: number;
  evaluatedMatchCount: number;
  exploredBatchStateCount: number;
}

export function getSchedulerFairMatches(
  player: Pick<SchedulerPlayer, 'matchesPlayed' | 'fairnessOffset' | 'fairMatches'>
): number {
  if (Number.isFinite(player.fairMatches)) {
    return Math.max(0, Number(player.fairMatches));
  }

  const matches = Number.isFinite(player.matchesPlayed) ? Math.max(0, player.matchesPlayed) : 0;
  const offset = Number.isFinite(player.fairnessOffset) ? Math.max(0, Number(player.fairnessOffset)) : 0;
  return matches + offset;
}

export function getEffectiveSchedulerLevel(
  player: Pick<SchedulerPlayer, 'gender' | 'level'>,
  config: Pick<SchedulerConfig, 'levelMin' | 'levelMax' | 'femaleEffectiveLevelOffset'> = DEFAULT_RUNTIME_SCHEDULER_CONFIG
): number {
  const normalizedLevel = clamp(
    Math.floor(Number.isFinite(player.level) ? player.level : config.levelMin),
    config.levelMin,
    config.levelMax
  );
  const offset = player.gender === 'Nữ' ? config.femaleEffectiveLevelOffset : 0;
  return clamp(normalizedLevel + offset, config.levelMin, config.levelMax);
}

export function createQuartetSignature(playerIds: readonly string[]): string {
  return [...new Set(playerIds.filter(Boolean))].sort(compareText).join(':');
}

export function evaluateSchedulerPlayerEligibility(
  player: SchedulerPlayer,
  reservedPlayerIds: ReadonlySet<string> = new Set<string>(),
  config: Pick<SchedulerConfig, 'eligibleStatuses'> = DEFAULT_RUNTIME_SCHEDULER_CONFIG
): SchedulerEligibilityReason[] {
  const reasons: SchedulerEligibilityReason[] = [];
  if (player.active === false) reasons.push('INACTIVE');
  if (!player.arrived) reasons.push('NOT_ARRIVED');
  if (player.endGame) reasons.push('END_GAME');
  if (!config.eligibleStatuses.includes(player.status)) reasons.push('STATUS_BLOCKED');
  if (reservedPlayerIds.has(player.id)) reasons.push('RESERVED');
  return reasons;
}

/**
 * Pure, deterministic scheduler entrypoint. It never mutates input and never
 * reads time, browser state, Zustand, or the database.
 */
export function generateSchedulerPreviews(input: GenerateSchedulerPreviewsInput): GenerateSchedulerPreviewsResult {
  const config = resolveConfig(input.config);
  const seed = String(input.seed ?? '0');
  const targetMatchCount = Math.max(0, Math.floor(input.targetMatchCount));
  const players = dedupePlayers(input.players);
  const playerById = new Map(players.map((player) => [player.id, player]));
  const warnings: SchedulerWarning[] = [];
  const reservedPlayerIds = toPlayerIdSet(input.reservedPlayerIds);
  const previousPreviewPlayerIds = toPlayerIdSet(input.previousPreviewPlayerIds);
  const lockedMatches = input.lockedMatches ?? [];

  reserveLockedMatches(lockedMatches, reservedPlayerIds, warnings);
  const lockedMatchCount = Math.min(targetMatchCount, lockedMatches.length);
  const availableMatchSlots = Math.max(0, targetMatchCount - lockedMatchCount);
  const coupleIndex = buildCoupleIndex(input.couples ?? [], playerById);
  warnings.push(...coupleIndex.warnings);

  const excludedPlayers: Record<string, readonly SchedulerEligibilityReason[]> = {};
  const eligiblePlayers: SchedulerPlayer[] = [];
  for (const player of players) {
    const reasons = evaluateSchedulerPlayerEligibility(player, reservedPlayerIds, config);
    if (reasons.length === 0) {
      eligiblePlayers.push(player);
    } else {
      excludedPlayers[player.id] = reasons;
    }
  }

  if (eligiblePlayers.length === 0 && availableMatchSlots > 0) {
    warnings.push({ code: 'NO_ELIGIBLE_PLAYERS', message: 'Không có người chơi hợp lệ để tạo gợi ý.' });
  }

  const requests = normalizeRequests(players, input.nextMatchRequests ?? []);
  const formats = getFormats(input.mode);
  const recentQuartetWindow = config.recentQuartetWindow
    ?? Math.max(4, targetMatchCount * 2);
  const recentQuartetRank = buildRecentQuartetRank(input.recentMatches ?? [], recentQuartetWindow);
  const counters: GenerationCounters = {
    evaluatedTeamCount: 0,
    evaluatedMatchCount: 0,
    exploredBatchStateCount: 0
  };
  const candidatePlayerIdsByFormat: Partial<Record<SchedulerMatchFormat, readonly string[]>> = {};
  const candidatePlayersByFormat: Partial<Record<SchedulerMatchFormat, readonly SchedulerPlayer[]>> = {};
  const allOptions: MatchOption[] = [];
  const recoveryOptions: MatchOption[] = [];
  let candidatePoolLimitReached = false;

  for (const format of formats) {
    const applicableRequests = buildApplicableRequests(format, requests, coupleIndex);
    const availableForFormat = filterPlayersForFormat(
      eligiblePlayers,
      format,
      coupleIndex,
      new Set(eligiblePlayers.map((player) => player.id))
    );
    const poolResult = buildCandidatePool(
      availableForFormat,
      format,
      applicableRequests,
      coupleIndex,
      input.now,
      seed,
      config,
      previousPreviewPlayerIds
    );
    candidatePlayerIdsByFormat[format] = poolResult.players.map((player) => player.id);
    candidatePlayersByFormat[format] = poolResult.players;
    candidatePoolLimitReached ||= poolResult.limitReached;
    if (poolResult.limitReached) {
      warnings.push({
        code: 'CANDIDATE_POOL_LIMIT_REACHED',
        entityId: format,
        message: `Nhóm ứng viên ${format} đã được giới hạn ở ${config.candidatePoolLimit} người.`
      });
    }

    const formatOptions = generateFormatOptions({
      players: poolResult.players,
      format,
      requests: applicableRequests,
      coupleIndex,
      recentQuartetRank,
      previousPreviewPlayerIds,
      now: input.now,
      seed,
      strictMaxTeamGap: config.maxTeamGap,
      config,
      counters
    });
    const fallbackConfig = {
      ...config,
      maxTeamGap: Math.max(config.maxTeamGap, config.levelMax * 2)
    };
    const fallbackOptions = fallbackConfig.maxTeamGap > config.maxTeamGap
      ? generateFormatOptions({
          players: poolResult.players,
          format,
          requests: applicableRequests,
          coupleIndex,
          recentQuartetRank,
          previousPreviewPlayerIds,
          now: input.now,
          seed: `${seed}|fallback`,
          strictMaxTeamGap: config.maxTeamGap,
          config: fallbackConfig,
          counters
        }).filter((option) => option.metrics.teamGap > config.maxTeamGap)
      : [];
    const formatOptionsWithFallback = [...formatOptions, ...fallbackOptions];
    recoveryOptions.push(...formatOptionsWithFallback);
    allOptions.push(...retainOptionsForFallback(formatOptionsWithFallback, config.maxOptionsPerFormat));
  }

  // Auto mode may need a mixed-team fallback to reach maximum cardinality.
  // Example: 9 men + 3 women can fill three courts only as three matches of
  // mixed-team vs men's-team. Explicit Men/Women/Mixed tabs remain strict.
  if (input.mode === 'auto') {
    const fallbackConfig = {
      ...config,
      maxTeamGap: Math.max(config.maxTeamGap, config.levelMax * 2)
    };
    const crossFormatOptions = generateCrossFormatOptions({
      playersByFormat: candidatePlayersByFormat,
      requests,
      coupleIndex,
      recentQuartetRank,
      previousPreviewPlayerIds,
      now: input.now,
      seed: `${seed}|cross-format`,
      strictMaxTeamGap: config.maxTeamGap,
      config: fallbackConfig,
      counters
    });
    recoveryOptions.push(...crossFormatOptions);
    allOptions.push(...retainOptionsForFallback(crossFormatOptions, config.maxOptionsPerFormat));
  }

  allOptions.sort(compareMatchOptions);
  const retainedOptions = retainOptionsForFallback(allOptions, config.maxBatchOptions);
  const ordinaryRetainedOptions = retainedOptions.filter((option) => option.metrics.hostCount === 0);
  const ordinaryRecoveryOptions = recoveryOptions.filter((option) => option.metrics.hostCount === 0);
  const ordinaryOptionPlayerCount = new Set(ordinaryRecoveryOptions.flatMap((option) => [...option.roster])).size;
  const ordinaryBatchCanReachTargetByCardinality = ordinaryOptionPlayerCount >= availableMatchSlots * 4;
  let selectedOptions: MatchOption[] = [];
  if (availableMatchSlots > 0) {
    // Host is a strict operational fallback. First prove whether ordinary
    // players can fill the whole batch; only expose Host options when they
    // increase the achievable match count.
    if (ordinaryBatchCanReachTargetByCardinality) {
      selectedOptions = selectBoundedBatch(ordinaryRetainedOptions, availableMatchSlots, `${seed}|ordinary`, config, counters);
      if (selectedOptions.length < availableMatchSlots && ordinaryRecoveryOptions.length > ordinaryRetainedOptions.length) {
        selectedOptions = selectMaxCardinalityBatch(ordinaryRecoveryOptions, availableMatchSlots, selectedOptions, counters)
          .sort(compareMatchOptions);
      }
    }
    if (selectedOptions.length < availableMatchSlots) {
      selectedOptions = selectBoundedBatch(retainedOptions, availableMatchSlots, seed, config, counters);
      if (selectedOptions.length < availableMatchSlots && recoveryOptions.length > retainedOptions.length) {
        selectedOptions = selectMaxCardinalityBatch(recoveryOptions, availableMatchSlots, selectedOptions, counters)
          .sort(compareMatchOptions);
      }
    }
  }
  const freeIndexes = getFreeSuggestionIndexes(targetMatchCount, lockedMatches);
  const suggestions = selectedOptions.map((option, optionIndex) => toSuggestion(
    option,
    freeIndexes[optionIndex] ?? lockedMatchCount + optionIndex + 1,
    seed
  ));

  if (availableMatchSlots > 0 && suggestions.length === 0 && eligiblePlayers.length > 0) {
    warnings.push({ code: 'NO_VALID_MATCH', message: 'Không có phương án đạt điều kiện nội dung, Couple và cân bằng.' });
  }
  if (selectedOptions.some((option) => option.metrics.teamGap > config.maxTeamGap)) {
    warnings.push({
      code: 'BALANCE_FALLBACK_USED',
      message: 'Có gợi ý fallback lệch trình để lấp đủ sân; kiểm tra trước khi áp dụng.'
    });
  }

  return {
    suggestions,
    requestedMatchCount: targetMatchCount,
    lockedMatchCount,
    generatedMatchCount: suggestions.length,
    diagnostics: {
      eligiblePlayerIds: eligiblePlayers.map((player) => player.id),
      excludedPlayers,
      reservedPlayerIds: [...reservedPlayerIds].sort(compareText),
      candidatePlayerIdsByFormat,
      evaluatedTeamCount: counters.evaluatedTeamCount,
      evaluatedMatchCount: counters.evaluatedMatchCount,
      retainedMatchOptionCount: retainedOptions.length,
      exploredBatchStateCount: counters.exploredBatchStateCount,
      candidatePoolLimitReached,
      warnings
    }
  };
}

function resolveConfig(overrides: Partial<SchedulerConfig> | undefined): SchedulerConfig {
  const merged = { ...DEFAULT_RUNTIME_SCHEDULER_CONFIG, ...overrides };
  const preferredTeamGap = Math.max(0, Math.floor(merged.preferredTeamGap));
  return {
    ...merged,
    candidatePoolLimit: clamp(Math.floor(merged.candidatePoolLimit), 4, 48),
    maxOptionsPerFormat: clamp(Math.floor(merged.maxOptionsPerFormat), 4, 500),
    maxBatchOptions: clamp(Math.floor(merged.maxBatchOptions), 4, 800),
    beamWidth: clamp(Math.floor(merged.beamWidth), 1, 256),
    preferredTeamGap,
    maxTeamGap: Math.max(preferredTeamGap, Math.floor(merged.maxTeamGap)),
    protectedDeferredCycles: Math.max(1, Math.floor(merged.protectedDeferredCycles)),
    recentQuartetWindow: merged.recentQuartetWindow === undefined
      ? undefined
      : Math.max(0, Math.floor(merged.recentQuartetWindow)),
    levelMin: Math.floor(Math.min(merged.levelMin, merged.levelMax)),
    levelMax: Math.floor(Math.max(merged.levelMin, merged.levelMax)),
    femaleEffectiveLevelOffset: Math.floor(merged.femaleEffectiveLevelOffset),
    eligibleStatuses: [...new Set(merged.eligibleStatuses)]
  };
}

function dedupePlayers(players: readonly SchedulerPlayer[]): SchedulerPlayer[] {
  const playerById = new Map<string, SchedulerPlayer>();
  for (const player of players) {
    if (!player.id || playerById.has(player.id)) continue;
    playerById.set(player.id, player);
  }
  return [...playerById.values()];
}

function toPlayerIdSet(value: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  return new Set(value ? [...value].filter(Boolean) : []);
}

function reserveLockedMatches(
  lockedMatches: readonly SchedulerLockedMatch[],
  reservedPlayerIds: Set<string>,
  warnings: SchedulerWarning[]
): void {
  for (const match of lockedMatches) {
    const uniqueIds = [...new Set(match.playerIds.filter(Boolean))];
    uniqueIds.forEach((playerId) => reservedPlayerIds.add(playerId));
    if (uniqueIds.length !== 4) {
      warnings.push({
        code: 'INVALID_LOCKED_MATCH',
        entityId: match.id,
        message: `Gợi ý khóa ${match.id} không có đúng 4 người chơi duy nhất.`
      });
    }
  }
}

function buildCoupleIndex(
  couples: readonly SchedulerCouple[],
  playerById: ReadonlyMap<string, SchedulerPlayer>
): CoupleIndex {
  const index: CoupleIndex = {
    activeById: new Map(),
    partnerByFormat: createFormatMap(() => new Map<string, string>()),
    coupleIdByTeamKey: createFormatMap(() => new Map<string, string>()),
    blockedByFormat: createFormatMap(() => new Set<string>()),
    warnings: []
  };
  const structurallyValid: SchedulerCouple[] = [];
  const memberships = new Map<string, SchedulerCouple[]>();

  for (const couple of couples) {
    if (couple.active === false) continue;
    const [leftId, rightId] = couple.memberIds;
    if (!leftId || !rightId || leftId === rightId) {
      index.warnings.push({
        code: 'INVALID_COUPLE_MEMBERS',
        entityId: couple.id,
        message: `Couple ${couple.id} phải có đúng hai người khác nhau.`
      });
      continue;
    }

    const left = playerById.get(leftId);
    const right = playerById.get(rightId);
    if (!left || !right) {
      if (left) index.blockedByFormat[couple.mode].add(left.id);
      if (right) index.blockedByFormat[couple.mode].add(right.id);
      index.warnings.push({
        code: 'COUPLE_MEMBER_NOT_FOUND',
        entityId: couple.id,
        message: `Couple ${couple.id} có thành viên không thuộc danh sách người chơi hiện tại.`
      });
      continue;
    }

    if (!isGenderPairValid(left, right, couple.mode)) {
      index.blockedByFormat[couple.mode].add(left.id);
      index.blockedByFormat[couple.mode].add(right.id);
      index.warnings.push({
        code: 'COUPLE_GENDER_MISMATCH',
        entityId: couple.id,
        message: `Giới tính thành viên Couple ${couple.id} không phù hợp nội dung ${couple.mode}.`
      });
      continue;
    }

    structurallyValid.push(couple);
    for (const memberId of couple.memberIds) {
      const key = `${couple.mode}:${memberId}`;
      const current = memberships.get(key) ?? [];
      current.push(couple);
      memberships.set(key, current);
    }
  }

  const conflictedKeys = new Set<string>();
  for (const [key, membershipsForPlayer] of memberships) {
    if (membershipsForPlayer.length <= 1) continue;
    conflictedKeys.add(key);
    const separator = key.indexOf(':');
    const format = key.slice(0, separator) as SchedulerMatchFormat;
    const playerId = key.slice(separator + 1);
    index.blockedByFormat[format].add(playerId);
    index.warnings.push({
      code: 'COUPLE_MEMBERSHIP_CONFLICT',
      entityId: playerId,
      message: `Người chơi ${playerId} thuộc nhiều Couple trong cùng nội dung ${format}.`
    });
  }

  for (const couple of structurallyValid) {
    if (couple.memberIds.some((memberId) => conflictedKeys.has(`${couple.mode}:${memberId}`))) {
      couple.memberIds.forEach((memberId) => index.blockedByFormat[couple.mode].add(memberId));
      continue;
    }

    const [leftId, rightId] = couple.memberIds;
    index.activeById.set(couple.id, couple);
    index.partnerByFormat[couple.mode].set(leftId, rightId);
    index.partnerByFormat[couple.mode].set(rightId, leftId);
    index.coupleIdByTeamKey[couple.mode].set(createTeamKey(leftId, rightId), couple.id);
  }

  return index;
}

function normalizeRequests(
  players: readonly SchedulerPlayer[],
  explicitRequests: readonly SchedulerNextMatchRequest[]
): SchedulerNextMatchRequest[] {
  const hostPlayerIds = new Set(players.filter((player) => player.host === true).map((player) => player.id));
  const requestById = new Map<string, SchedulerNextMatchRequest>();
  const explicitPlayerIds = new Set<string>();
  for (const request of explicitRequests) {
    if (!request.id || !Number.isFinite(request.requestedAt)) continue;
    if (request.scope === 'player' && hostPlayerIds.has(request.playerId)) continue;
    requestById.set(request.id, request);
    if (request.scope === 'player') explicitPlayerIds.add(request.playerId);
  }

  for (const player of players) {
    if (player.host === true) continue;
    if (explicitPlayerIds.has(player.id)) continue;
    if (!Number.isFinite(player.nextMatchRequestedAt)) continue;
    const requestedAt = Number(player.nextMatchRequestedAt);
    const id = `player:${player.id}:${requestedAt}`;
    if (requestById.has(id)) continue;
    requestById.set(id, {
      id,
      scope: 'player',
      playerId: player.id,
      requestedAt,
      mode: player.nextMatchRequestedMode ?? null
    });
  }

  return [...requestById.values()];
}

function buildApplicableRequests(
  format: SchedulerMatchFormat,
  requests: readonly SchedulerNextMatchRequest[],
  coupleIndex: CoupleIndex
): ApplicableRequest[] {
  const applicable: ApplicableRequest[] = [];
  for (const request of requests) {
    if (!requestModeApplies(request.mode, format)) continue;
    if (request.scope === 'player') {
      applicable.push({ id: request.id, requestedAt: request.requestedAt, playerIds: [request.playerId] });
      continue;
    }

    const couple = coupleIndex.activeById.get(request.coupleId);
    if (!couple || couple.mode !== format) continue;
    applicable.push({ id: request.id, requestedAt: request.requestedAt, playerIds: couple.memberIds });
  }
  return applicable.sort((left, right) => left.requestedAt - right.requestedAt || compareText(left.id, right.id));
}

function requestModeApplies(mode: SchedulerMode | null | undefined, format: SchedulerMatchFormat): boolean {
  return mode === undefined || mode === null || mode === 'auto' || mode === format;
}

function getFormats(mode: SchedulerMode): readonly SchedulerMatchFormat[] {
  return mode === 'auto' ? FORMATS : [mode];
}

function filterPlayersForFormat(
  players: readonly SchedulerPlayer[],
  format: SchedulerMatchFormat,
  coupleIndex: CoupleIndex,
  eligiblePlayerIds: ReadonlySet<string>
): SchedulerPlayer[] {
  return players.filter((player) => {
    if (!isGenderEligibleForFormat(player.gender, format)) return false;
    if (coupleIndex.blockedByFormat[format].has(player.id)) return false;
    const partnerId = coupleIndex.partnerByFormat[format].get(player.id);
    return !partnerId || eligiblePlayerIds.has(partnerId);
  });
}

function buildCandidatePool(
  players: readonly SchedulerPlayer[],
  format: SchedulerMatchFormat,
  requests: readonly ApplicableRequest[],
  coupleIndex: CoupleIndex,
  now: number,
  seed: string,
  config: SchedulerConfig,
  previousPreviewPlayerIds: ReadonlySet<string>
): { players: SchedulerPlayer[]; limitReached: boolean } {
  if (players.length <= config.candidatePoolLimit) {
    return { players: [...players], limitReached: false };
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const consumed = new Set<string>();
  const units: CandidateUnit[] = [];
  for (const player of players) {
    if (consumed.has(player.id)) continue;
    const partnerId = coupleIndex.partnerByFormat[format].get(player.id);
    const partner = partnerId ? playerById.get(partnerId) : undefined;
    const memberPlayers = partner ? [player, partner] : [player];
    memberPlayers.forEach((member) => consumed.add(member.id));
    units.push(createCandidateUnit(memberPlayers, requests, now, seed, config, previousPreviewPlayerIds));
  }
  units.sort(compareCandidateUnits);

  const selectedIds = new Set<string>();
  for (const unit of units) {
    if (selectedIds.size + unit.playerIds.length > config.candidatePoolLimit) continue;
    unit.playerIds.forEach((playerId) => selectedIds.add(playerId));
    if (selectedIds.size === config.candidatePoolLimit) break;
  }

  return {
    players: players.filter((player) => selectedIds.has(player.id)),
    limitReached: selectedIds.size < players.length
  };
}

function createCandidateUnit(
  players: readonly SchedulerPlayer[],
  requests: readonly ApplicableRequest[],
  now: number,
  seed: string,
  config: SchedulerConfig,
  previousPreviewPlayerIds: ReadonlySet<string>
): CandidateUnit {
  const playerIds = players.map((player) => player.id).sort(compareText);
  const ordinaryPlayers = players.filter((player) => player.host !== true);
  const requestTimes = players.some((player) => player.host === true) ? [] : requests
    .filter((request) => request.playerIds.every((playerId) => playerIds.includes(playerId)))
    .map((request) => request.requestedAt);
  const fairMatches = ordinaryPlayers.length > 0 ? ordinaryPlayers.map(getSchedulerFairMatches) : players.map(getSchedulerFairMatches);
  return {
    playerIds,
    protectedCount: ordinaryPlayers.filter((player) => getDeferredCycles(player) >= config.protectedDeferredCycles).length,
    deferredCycles: ordinaryPlayers.reduce((total, player) => total + getDeferredCycles(player), 0),
    oldestRequestAt: requestTimes.length > 0 ? Math.min(...requestTimes) : null,
    entryPriorityCount: ordinaryPlayers.filter((player) => player.entryPriority === true).length,
    fairMatchesMax: Math.max(...fairMatches),
    fairMatchesTotal: sum(fairMatches),
    waitingDurationMs: ordinaryPlayers.reduce((total, player) => total + getWaitingDuration(player, now), 0),
    hostCount: players.filter((player) => player.host === true).length,
    previousPreviewPlayerCount: players.filter((player) => previousPreviewPlayerIds.has(player.id)).length,
    tieBreak: stableHash(`${seed}|pool|${playerIds.join(':')}`)
  };
}

function compareCandidateUnits(left: CandidateUnit, right: CandidateUnit): number {
  return compareNumbersAsc(left.hostCount, right.hostCount)
    || compareNumbersAsc(left.fairMatchesMax, right.fairMatchesMax)
    || compareNumbersAsc(left.fairMatchesTotal, right.fairMatchesTotal)
    || compareNumbersAsc(left.previousPreviewPlayerCount, right.previousPreviewPlayerCount)
    || compareNullableTimes(left.oldestRequestAt, right.oldestRequestAt)
    || compareNumbersDesc(left.entryPriorityCount, right.entryPriorityCount)
    || compareNumbersDesc(left.waitingDurationMs, right.waitingDurationMs)
    || compareNumbersDesc(left.protectedCount, right.protectedCount)
    || compareNumbersDesc(left.deferredCycles, right.deferredCycles)
    || compareNumbersAsc(left.tieBreak, right.tieBreak);
}

function generateFormatOptions(args: {
  players: readonly SchedulerPlayer[];
  format: SchedulerMatchFormat;
  requests: readonly ApplicableRequest[];
  coupleIndex: CoupleIndex;
  recentQuartetRank: ReadonlyMap<string, number>;
  previousPreviewPlayerIds: ReadonlySet<string>;
  now: number;
  seed: string;
  strictMaxTeamGap: number;
  config: SchedulerConfig;
  counters: GenerationCounters;
}): MatchOption[] {
  if (args.players.length < 4) return [];
  const teams = generateTeamOptions(args.players, args.format, args.coupleIndex, args.config);
  args.counters.evaluatedTeamCount += teams.length;
  const playerById = new Map(args.players.map((player) => [player.id, player]));
  const bestByQuartet = new Map<string, MatchOption>();

  for (let leftIndex = 0; leftIndex < teams.length - 1; leftIndex += 1) {
    const left = teams[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < teams.length; rightIndex += 1) {
      const right = teams[rightIndex];
      if (teamsOverlap(left, right)) continue;
      args.counters.evaluatedMatchCount += 1;
      const teamGap = Math.abs(left.strength - right.strength);
      if (teamGap > args.config.maxTeamGap) continue;

      const quartetSignature = createQuartetSignature([...left.ids, ...right.ids]);
      if (quartetSignature.split(':').length !== 4) continue;
      const players = [...left.ids, ...right.ids]
        .map((playerId) => playerById.get(playerId))
        .filter((player): player is SchedulerPlayer => Boolean(player));
      if (players.length !== 4) continue;
      const metrics = createSuggestionMetrics({
        players,
        teamStrengths: [left.strength, right.strength],
        teamGap,
        requests: args.requests,
        coupleIds: [left.coupleId, right.coupleId].filter((value): value is string => Boolean(value)),
        recentQuartetRank: args.recentQuartetRank.get(quartetSignature) ?? null,
        previousPreviewPlayerIds: args.previousPreviewPlayerIds,
        now: args.now,
        config: args.config
      });
      const option: MatchOption = {
        format: args.format,
        teamA: left.ids,
        teamB: right.ids,
        roster: [...left.ids, ...right.ids],
        quartetSignature,
        metrics,
        reasons: buildReasonCodes(metrics, args.config),
        balanceTier: teamGap <= args.config.preferredTeamGap ? 0 : teamGap <= args.strictMaxTeamGap ? 1 : 2,
        formationTier: 0,
        tieBreak: stableHash(`${args.seed}|match|${args.format}|${left.key}|${right.key}`)
      };
      const optionKey = `${args.format}|${quartetSignature}`;
      const current = bestByQuartet.get(optionKey);
      if (!current || compareMatchOptions(option, current) < 0) {
        bestByQuartet.set(optionKey, option);
      }
    }
  }

  return [...bestByQuartet.values()].sort(compareMatchOptions);
}

function generateCrossFormatOptions(args: {
  playersByFormat: Partial<Record<SchedulerMatchFormat, readonly SchedulerPlayer[]>>;
  requests: readonly SchedulerNextMatchRequest[];
  coupleIndex: CoupleIndex;
  recentQuartetRank: ReadonlyMap<string, number>;
  previousPreviewPlayerIds: ReadonlySet<string>;
  now: number;
  seed: string;
  strictMaxTeamGap: number;
  config: SchedulerConfig;
  counters: GenerationCounters;
}): MatchOption[] {
  const formatPairs: readonly (readonly [SchedulerMatchFormat, SchedulerMatchFormat])[] = [
    ['mixed', 'men'],
    ['mixed', 'women']
  ];
  const bestByQuartet = new Map<string, MatchOption>();

  for (const [leftFormat, rightFormat] of formatPairs) {
    const leftPlayers = args.playersByFormat[leftFormat] ?? [];
    const rightPlayers = args.playersByFormat[rightFormat] ?? [];
    if (leftPlayers.length < 2 || rightPlayers.length < 2) continue;
    const leftTeams = generateTeamOptions(leftPlayers, leftFormat, args.coupleIndex, args.config);
    const rightTeams = generateTeamOptions(rightPlayers, rightFormat, args.coupleIndex, args.config);
    args.counters.evaluatedTeamCount += leftTeams.length + rightTeams.length;
    const playerById = new Map(
      [...leftPlayers, ...rightPlayers].map((player) => [player.id, player])
    );
    const applicableRequests = dedupeApplicableRequests([
      ...buildApplicableRequests(leftFormat, args.requests, args.coupleIndex),
      ...buildApplicableRequests(rightFormat, args.requests, args.coupleIndex)
    ]);

    for (const left of leftTeams) {
      for (const right of rightTeams) {
        if (teamsOverlap(left, right)) continue;
        args.counters.evaluatedMatchCount += 1;
        const teamGap = Math.abs(left.strength - right.strength);
        if (teamGap > args.config.maxTeamGap) continue;
        const quartetSignature = createQuartetSignature([...left.ids, ...right.ids]);
        if (quartetSignature.split(':').length !== 4) continue;
        const players = [...left.ids, ...right.ids]
          .map((playerId) => playerById.get(playerId))
          .filter((player): player is SchedulerPlayer => Boolean(player));
        if (players.length !== 4) continue;
        const metrics = createSuggestionMetrics({
          players,
          teamStrengths: [left.strength, right.strength],
          teamGap,
          requests: applicableRequests,
          coupleIds: [left.coupleId, right.coupleId].filter((value): value is string => Boolean(value)),
          recentQuartetRank: args.recentQuartetRank.get(quartetSignature) ?? null,
          previousPreviewPlayerIds: args.previousPreviewPlayerIds,
          now: args.now,
          config: args.config,
          mixedFormatFallback: true
        });
        const option: MatchOption = {
          format: 'mixed',
          teamA: left.ids,
          teamB: right.ids,
          roster: [...left.ids, ...right.ids],
          quartetSignature,
          metrics,
          reasons: buildReasonCodes(metrics, args.config),
          balanceTier: teamGap <= args.config.preferredTeamGap ? 0 : teamGap <= args.strictMaxTeamGap ? 1 : 2,
          formationTier: 1,
          tieBreak: stableHash(`${args.seed}|${leftFormat}-${rightFormat}|${left.key}|${right.key}`)
        };
        const optionKey = `${leftFormat}-${rightFormat}|${quartetSignature}`;
        const current = bestByQuartet.get(optionKey);
        if (!current || compareMatchOptions(option, current) < 0) {
          bestByQuartet.set(optionKey, option);
        }
      }
    }
  }

  return [...bestByQuartet.values()].sort(compareMatchOptions);
}

function dedupeApplicableRequests(requests: readonly ApplicableRequest[]): ApplicableRequest[] {
  return [...new Map(requests.map((request) => [request.id, request])).values()]
    .sort((left, right) => left.requestedAt - right.requestedAt || compareText(left.id, right.id));
}

function generateTeamOptions(
  players: readonly SchedulerPlayer[],
  format: SchedulerMatchFormat,
  coupleIndex: CoupleIndex,
  config: SchedulerConfig
): TeamOption[] {
  const teams: TeamOption[] = [];
  for (let leftIndex = 0; leftIndex < players.length - 1; leftIndex += 1) {
    const left = players[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < players.length; rightIndex += 1) {
      const right = players[rightIndex];
      if (!isGenderPairValid(left, right, format)) continue;
      const leftPartnerId = coupleIndex.partnerByFormat[format].get(left.id);
      const rightPartnerId = coupleIndex.partnerByFormat[format].get(right.id);
      if ((leftPartnerId && leftPartnerId !== right.id) || (rightPartnerId && rightPartnerId !== left.id)) {
        continue;
      }

      const ids = [left.id, right.id].sort(compareText) as [string, string];
      const key = createTeamKey(ids[0], ids[1]);
      teams.push({
        ids,
        key,
        strength: getEffectiveSchedulerLevel(left, config) + getEffectiveSchedulerLevel(right, config),
        coupleId: coupleIndex.coupleIdByTeamKey[format].get(key) ?? null
      });
    }
  }
  return teams.sort((left, right) => compareText(left.key, right.key));
}

function createSuggestionMetrics(args: {
  players: readonly SchedulerPlayer[];
  teamStrengths: readonly [number, number];
  teamGap: number;
  requests: readonly ApplicableRequest[];
  coupleIds: readonly string[];
  recentQuartetRank: number | null;
  previousPreviewPlayerIds: ReadonlySet<string>;
  now: number;
  config: SchedulerConfig;
  mixedFormatFallback?: boolean;
}): SchedulerSuggestionMetrics {
  const rosterIds = new Set(args.players.map((player) => player.id));
  const fulfilledRequests = args.requests.filter((request) => request.playerIds.every((playerId) => rosterIds.has(playerId)));
  const ordinaryPlayers = args.players.filter((player) => player.host !== true);
  const fairnessPlayers = ordinaryPlayers.length > 0 ? ordinaryPlayers : args.players;
  const fairMatches = fairnessPlayers.map(getSchedulerFairMatches);
  return {
    teamStrengths: args.teamStrengths,
    teamGap: args.teamGap,
    fairMatchesMax: Math.max(...fairMatches),
    fairMatchesTotal: sum(fairMatches),
    fairMatchesSpread: Math.max(...fairMatches) - Math.min(...fairMatches),
    deferredCyclesTotal: ordinaryPlayers.reduce((total, player) => total + getDeferredCycles(player), 0),
    waitingDurationTotalMs: ordinaryPlayers.reduce((total, player) => total + getWaitingDuration(player, args.now), 0),
    restDurationTotalMs: ordinaryPlayers.reduce((total, player) => total + getRestDuration(player, args.now), 0),
    hostCount: args.players.filter((player) => player.host === true).length,
    mixedFormatFallback: args.mixedFormatFallback === true,
    previousPreviewPlayerCount: args.players.filter((player) => args.previousPreviewPlayerIds.has(player.id)).length,
    protectedPlayerIds: ordinaryPlayers
      .filter((player) => getDeferredCycles(player) >= args.config.protectedDeferredCycles)
      .map((player) => player.id)
      .sort(compareText),
    fulfilledRequestIds: fulfilledRequests.map((request) => request.id),
    fulfilledRequestOldestAt: fulfilledRequests.length > 0
      ? Math.min(...fulfilledRequests.map((request) => request.requestedAt))
      : null,
    entryPriorityPlayerIds: ordinaryPlayers
      .filter((player) => player.entryPriority === true)
      .map((player) => player.id)
      .sort(compareText),
    fulfilledCoupleIds: [...new Set(args.coupleIds)].sort(compareText),
    recentQuartetRank: args.recentQuartetRank
  };
}

function buildReasonCodes(metrics: SchedulerSuggestionMetrics, config: SchedulerConfig): SchedulerReasonCode[] {
  const reasons: SchedulerReasonCode[] = [metrics.teamGap <= config.preferredTeamGap ? 'BALANCED' : 'BALANCE_FALLBACK'];
  if (metrics.fulfilledRequestIds.length > 0) reasons.push('NEXT_MATCH');
  if (metrics.entryPriorityPlayerIds.length > 0) reasons.push('ENTRY_PRIORITY');
  reasons.push('FAIR_MATCHES');
  if (metrics.fulfilledCoupleIds.length > 0) reasons.push('COUPLE');
  reasons.push(metrics.recentQuartetRank === null ? 'FRESH_QUARTET' : 'REPEAT_FORCED');
  if (metrics.hostCount > 0) reasons.push('HOST_FILL');
  if (metrics.restDurationTotalMs === 0) reasons.push('RECENTLY_FINISHED');
  return reasons;
}

function compareMatchOptions(left: MatchOption, right: MatchOption): number {
  const leftMetrics = left.metrics;
  const rightMetrics = right.metrics;
  return compareNumbersAsc(left.balanceTier, right.balanceTier)
    || compareNumbersAsc(left.formationTier, right.formationTier)
    || compareNumbersAsc(leftMetrics.hostCount, rightMetrics.hostCount)
    || compareNumbersAsc(leftMetrics.fairMatchesMax, rightMetrics.fairMatchesMax)
    || compareNumbersAsc(leftMetrics.fairMatchesTotal, rightMetrics.fairMatchesTotal)
    || compareNumbersAsc(leftMetrics.fairMatchesSpread, rightMetrics.fairMatchesSpread)
    || compareNumbersAsc(leftMetrics.previousPreviewPlayerCount, rightMetrics.previousPreviewPlayerCount)
    || compareRepeatRank(leftMetrics.recentQuartetRank, rightMetrics.recentQuartetRank)
    || compareNumbersAsc(leftMetrics.teamGap, rightMetrics.teamGap)
    || compareRequestCoverage(leftMetrics, rightMetrics)
    || compareNumbersDesc(leftMetrics.entryPriorityPlayerIds.length, rightMetrics.entryPriorityPlayerIds.length)
    || compareNumbersDesc(leftMetrics.fulfilledCoupleIds.length, rightMetrics.fulfilledCoupleIds.length)
    || compareNumbersDesc(leftMetrics.waitingDurationTotalMs, rightMetrics.waitingDurationTotalMs)
    || compareNumbersDesc(leftMetrics.protectedPlayerIds.length, rightMetrics.protectedPlayerIds.length)
    || compareNumbersDesc(leftMetrics.deferredCyclesTotal, rightMetrics.deferredCyclesTotal)
    || compareNumbersDesc(leftMetrics.restDurationTotalMs, rightMetrics.restDurationTotalMs)
    || compareNumbersAsc(left.tieBreak, right.tieBreak);
}

function selectBoundedBatch(
  options: readonly MatchOption[],
  targetCount: number,
  seed: string,
  config: SchedulerConfig,
  counters: GenerationCounters
): MatchOption[] {
  if (targetCount <= 0 || options.length === 0) return [];
  let frontier: BatchState[] = [{ options: [], usedPlayerIds: new Set<string>(), tieBreak: stableHash(`${seed}|empty`) }];

  for (let depth = 0; depth < targetCount; depth += 1) {
    const expandedByPlayers = new Map<string, BatchState>();
    for (const state of frontier) {
      for (const option of options) {
        if (option.roster.some((playerId) => state.usedPlayerIds.has(playerId))) continue;
        counters.exploredBatchStateCount += 1;
        const usedPlayerIds = new Set(state.usedPlayerIds);
        option.roster.forEach((playerId) => usedPlayerIds.add(playerId));
        const nextOptions = [...state.options, option];
        const nextState: BatchState = {
          options: nextOptions,
          usedPlayerIds,
          tieBreak: stableHash(`${seed}|batch|${nextOptions.map((item) => item.quartetSignature).sort(compareText).join('|')}`)
        };
        const stateKey = [...usedPlayerIds].sort(compareText).join(':');
        const current = expandedByPlayers.get(stateKey);
        if (!current || compareBatchStates(nextState, current) < 0) {
          expandedByPlayers.set(stateKey, nextState);
        }
      }
    }

    if (expandedByPlayers.size === 0) break;
    frontier = [...expandedByPlayers.values()]
      .sort(compareBatchStates)
      .slice(0, config.beamWidth);
  }

  const beamResult = [...(frontier.sort(compareBatchStates)[0]?.options ?? [])];
  if (beamResult.length >= targetCount) return beamResult.sort(compareMatchOptions);

  // Beam pruning can keep individually strong matches that overlap too much and
  // dead-end below the requested court count. A bounded cardinality recovery
  // pass protects the operational contract: when a disjoint full batch exists,
  // fill it before comparing the softer fairness metrics.
  return selectMaxCardinalityBatch(options, targetCount, beamResult, counters)
    .sort(compareMatchOptions);
}

function selectMaxCardinalityBatch(
  options: readonly MatchOption[],
  targetCount: number,
  initialBest: readonly MatchOption[],
  counters: GenerationCounters
): MatchOption[] {
  const MAX_RECOVERY_STATES = 80_000;
  let explored = 0;
  let best = [...initialBest];
  const playerFrequency = new Map<string, number>();
  for (const option of options) {
    option.roster.forEach((playerId) => playerFrequency.set(playerId, (playerFrequency.get(playerId) ?? 0) + 1));
  }
  const searchOptions = [...options].sort((left, right) => {
    const leftFrequency = left.roster.reduce((total, playerId) => total + (playerFrequency.get(playerId) ?? 0), 0);
    const rightFrequency = right.roster.reduce((total, playerId) => total + (playerFrequency.get(playerId) ?? 0), 0);
    return compareNumbersAsc(leftFrequency, rightFrequency)
      || compareNumbersAsc(left.metrics.hostCount, right.metrics.hostCount)
      || compareMatchOptions(left, right);
  });

  function visit(startIndex: number, selected: MatchOption[], usedPlayerIds: Set<string>): boolean {
    if (selected.length > best.length
      || selected.length === best.length && compareBatchStates(
        { options: selected, usedPlayerIds, tieBreak: 0 },
        { options: best, usedPlayerIds: new Set(best.flatMap((option) => [...option.roster])), tieBreak: 0 }
      ) < 0) {
      best = [...selected];
    }
    if (selected.length >= targetCount) return true;
    if (explored >= MAX_RECOVERY_STATES) return false;
    if (selected.length + (searchOptions.length - startIndex) < Math.min(targetCount, best.length + 1)) return false;

    for (let optionIndex = startIndex; optionIndex < searchOptions.length; optionIndex += 1) {
      const option = searchOptions[optionIndex];
      if (option.roster.some((playerId) => usedPlayerIds.has(playerId))) continue;
      explored += 1;
      counters.exploredBatchStateCount += 1;
      option.roster.forEach((playerId) => usedPlayerIds.add(playerId));
      selected.push(option);
      const completed = visit(optionIndex + 1, selected, usedPlayerIds);
      selected.pop();
      option.roster.forEach((playerId) => usedPlayerIds.delete(playerId));
      if (completed) return true;
      if (explored >= MAX_RECOVERY_STATES) break;
    }
    return false;
  }

  visit(0, [], new Set<string>());
  return best;
}

function compareBatchStates(left: BatchState, right: BatchState): number {
  if (left.options.length !== right.options.length) return right.options.length - left.options.length;
  const leftMetrics = aggregateBatchMetrics(left.options);
  const rightMetrics = aggregateBatchMetrics(right.options);
  return compareNumbersAsc(leftMetrics.balanceFallbackCount, rightMetrics.balanceFallbackCount)
    || compareNumbersAsc(leftMetrics.formationFallbackCount, rightMetrics.formationFallbackCount)
    || compareNumbersAsc(leftMetrics.hostCount, rightMetrics.hostCount)
    || compareNumbersAsc(leftMetrics.fairMatchesMaxTotal, rightMetrics.fairMatchesMaxTotal)
    || compareNumbersAsc(leftMetrics.fairMatchesTotal, rightMetrics.fairMatchesTotal)
    || compareNumbersAsc(leftMetrics.fairMatchesSpreadTotal, rightMetrics.fairMatchesSpreadTotal)
    || compareNumbersAsc(leftMetrics.previousPreviewPlayerCount, rightMetrics.previousPreviewPlayerCount)
    || compareNumbersAsc(leftMetrics.repeatCount, rightMetrics.repeatCount)
    || compareNumbersAsc(leftMetrics.teamGapTotal, rightMetrics.teamGapTotal)
    || compareBatchRequestCoverage(leftMetrics, rightMetrics)
    || compareNumbersDesc(leftMetrics.entryPriorityCount, rightMetrics.entryPriorityCount)
    || compareNumbersDesc(leftMetrics.coupleCount, rightMetrics.coupleCount)
    || compareNumbersDesc(leftMetrics.waitingDurationTotalMs, rightMetrics.waitingDurationTotalMs)
    || compareNumbersDesc(leftMetrics.protectedCount, rightMetrics.protectedCount)
    || compareNumbersDesc(leftMetrics.deferredCycles, rightMetrics.deferredCycles)
    || compareNumbersDesc(leftMetrics.restDurationTotalMs, rightMetrics.restDurationTotalMs)
    || compareNumbersAsc(left.tieBreak, right.tieBreak);
}

function aggregateBatchMetrics(options: readonly MatchOption[]) {
  const requestTimes = options
    .map((option) => option.metrics.fulfilledRequestOldestAt)
    .filter((value): value is number => value !== null)
    .sort((left, right) => left - right);
  return {
    balanceFallbackCount: options.filter((option) => option.balanceTier > 0).length,
    protectedCount: options.reduce((total, option) => total + option.metrics.protectedPlayerIds.length, 0),
    deferredCycles: options.reduce((total, option) => total + option.metrics.deferredCyclesTotal, 0),
    requestCount: options.reduce((total, option) => total + option.metrics.fulfilledRequestIds.length, 0),
    oldestRequestAt: requestTimes[0] ?? null,
    entryPriorityCount: options.reduce((total, option) => total + option.metrics.entryPriorityPlayerIds.length, 0),
    fairMatchesMaxTotal: options.reduce((total, option) => total + option.metrics.fairMatchesMax, 0),
    fairMatchesTotal: options.reduce((total, option) => total + option.metrics.fairMatchesTotal, 0),
    fairMatchesSpreadTotal: options.reduce((total, option) => total + option.metrics.fairMatchesSpread, 0),
    repeatCount: options.filter((option) => option.metrics.recentQuartetRank !== null).length,
    teamGapTotal: options.reduce((total, option) => total + option.metrics.teamGap, 0),
    formationFallbackCount: options.filter((option) => option.metrics.mixedFormatFallback).length,
    waitingDurationTotalMs: options.reduce((total, option) => total + option.metrics.waitingDurationTotalMs, 0),
    coupleCount: options.reduce((total, option) => total + option.metrics.fulfilledCoupleIds.length, 0),
    restDurationTotalMs: options.reduce((total, option) => total + option.metrics.restDurationTotalMs, 0),
    hostCount: options.reduce((total, option) => total + option.metrics.hostCount, 0),
    previousPreviewPlayerCount: options.reduce((total, option) => total + option.metrics.previousPreviewPlayerCount, 0)
  };
}

function retainOptionsForFallback(options: readonly MatchOption[], limit: number): MatchOption[] {
  if (options.length <= limit) return [...options];
  const hostOptions = options.filter((option) => option.metrics.hostCount > 0);
  if (hostOptions.length === 0) return options.slice(0, limit);

  // Host is a fallback, not an exclusion. Keep a bounded slice of Host options
  // so batch selection can use the minimum Host count when it is required to
  // reach the maximum number of courts.
  const hostReserve = Math.min(hostOptions.length, Math.max(24, Math.floor(limit / 2)));
  const ordinaryOptions = options.filter((option) => option.metrics.hostCount === 0).slice(0, limit - hostReserve);
  return [...ordinaryOptions, ...hostOptions.slice(0, hostReserve)].sort(compareMatchOptions);
}

function compareRequestCoverage(left: SchedulerSuggestionMetrics, right: SchedulerSuggestionMetrics): number {
  const leftCount = left.fulfilledRequestIds.length;
  const rightCount = right.fulfilledRequestIds.length;
  if ((leftCount > 0) !== (rightCount > 0)) return leftCount > 0 ? -1 : 1;
  return compareNullableTimes(left.fulfilledRequestOldestAt, right.fulfilledRequestOldestAt)
    || compareNumbersDesc(leftCount, rightCount);
}

function compareBatchRequestCoverage(
  left: { requestCount: number; oldestRequestAt: number | null },
  right: { requestCount: number; oldestRequestAt: number | null }
): number {
  if ((left.requestCount > 0) !== (right.requestCount > 0)) return left.requestCount > 0 ? -1 : 1;
  return compareNullableTimes(left.oldestRequestAt, right.oldestRequestAt)
    || compareNumbersDesc(left.requestCount, right.requestCount);
}

function compareRepeatRank(left: number | null, right: number | null): number {
  if (left === null && right !== null) return -1;
  if (left !== null && right === null) return 1;
  if (left === null || right === null) return 0;
  // A larger rank is an older repeat and therefore less harmful.
  return right - left;
}

function buildRecentQuartetRank(
  recentMatches: readonly { playerIds: readonly string[] }[],
  window: number
): Map<string, number> {
  const ranks = new Map<string, number>();
  recentMatches.slice(0, window).forEach((match, index) => {
    const signature = createQuartetSignature(match.playerIds);
    if (signature.split(':').length !== 4 || ranks.has(signature)) return;
    ranks.set(signature, index);
  });
  return ranks;
}

function toSuggestion(option: MatchOption, index: number, seed: string): SchedulerSuggestion {
  return {
    id: `rs-${stableHash(`${seed}|${index}|${option.format}|${option.quartetSignature}`).toString(36)}`,
    index,
    format: option.format,
    roster: option.roster,
    teamA: option.teamA,
    teamB: option.teamB,
    quartetSignature: option.quartetSignature,
    reasons: option.reasons,
    metrics: option.metrics
  };
}

function getFreeSuggestionIndexes(targetCount: number, lockedMatches: readonly SchedulerLockedMatch[]): number[] {
  const occupied = new Set<number>();
  let unindexedLocks = 0;
  for (const match of lockedMatches.slice(0, targetCount)) {
    if (match.index && match.index >= 1 && match.index <= targetCount && !occupied.has(match.index)) {
      occupied.add(match.index);
    } else {
      unindexedLocks += 1;
    }
  }
  for (let index = 1; index <= targetCount && unindexedLocks > 0; index += 1) {
    if (occupied.has(index)) continue;
    occupied.add(index);
    unindexedLocks -= 1;
  }
  return Array.from({ length: targetCount }, (_, index) => index + 1).filter((index) => !occupied.has(index));
}

function isGenderPairValid(
  left: Pick<SchedulerPlayer, 'gender'>,
  right: Pick<SchedulerPlayer, 'gender'>,
  format: SchedulerMatchFormat
): boolean {
  if (format === 'men') return left.gender === 'Nam' && right.gender === 'Nam';
  if (format === 'women') return left.gender === 'Nữ' && right.gender === 'Nữ';
  return left.gender !== right.gender;
}

function isGenderEligibleForFormat(gender: SchedulerPlayer['gender'], format: SchedulerMatchFormat): boolean {
  if (format === 'men') return gender === 'Nam';
  if (format === 'women') return gender === 'Nữ';
  return gender === 'Nam' || gender === 'Nữ';
}

function teamsOverlap(left: TeamOption, right: TeamOption): boolean {
  return left.ids.some((playerId) => right.ids.includes(playerId));
}

function createTeamKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort(compareText).join(':');
}

function getDeferredCycles(player: Pick<SchedulerPlayer, 'deferredCycles'>): number {
  return Number.isFinite(player.deferredCycles) ? Math.max(0, Math.floor(Number(player.deferredCycles))) : 0;
}

function getWaitingDuration(player: Pick<SchedulerPlayer, 'waitingSince'>, now: number): number {
  return Number.isFinite(player.waitingSince) ? Math.max(0, now - Number(player.waitingSince)) : 0;
}

function getRestDuration(player: Pick<SchedulerPlayer, 'lastFinishedAt' | 'waitingSince'>, now: number): number {
  if (Number.isFinite(player.lastFinishedAt)) return Math.max(0, now - Number(player.lastFinishedAt));
  return getWaitingDuration(player, now);
}

function createFormatMap<T>(factory: () => T): Record<SchedulerMatchFormat, T> {
  return { mixed: factory(), women: factory(), men: factory() };
}

function compareNullableTimes(left: number | null, right: number | null): number {
  if (left === null && right !== null) return 1;
  if (left !== null && right === null) return -1;
  if (left === null || right === null) return 0;
  return left - right;
}

function compareNumbersAsc(left: number, right: number): number {
  return left - right;
}

function compareNumbersDesc(left: number, right: number): number {
  return right - left;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
