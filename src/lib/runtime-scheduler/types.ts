export type SchedulerMode = 'auto' | 'mixed' | 'men' | 'women';

export type SchedulerMatchFormat = Exclude<SchedulerMode, 'auto'>;

export type SchedulerGender = 'Nam' | 'Nữ';

export type SchedulerPlayerStatus =
  | 'WAITING'
  | 'JUST_FINISHED'
  | 'PLAYING'
  | 'RESTING'
  | 'PRIORITY'
  | 'FINISHED';

/**
 * Runtime Scheduler intentionally accepts a small, persistence-agnostic player
 * projection. Store/DB adapters can derive these fields without coupling the
 * pure engine to Zustand, Prisma, or the current runtime types.
 */
export interface SchedulerPlayer {
  id: string;
  gender: SchedulerGender;
  level: number;
  matchesPlayed: number;
  status: SchedulerPlayerStatus;
  arrived: boolean;
  endGame: boolean;
  active?: boolean;
  host?: boolean;
  fairnessOffset?: number;
  fairMatches?: number;
  entryPriority?: boolean;
  deferredCycles?: number;
  waitingSince?: number | null;
  lastFinishedAt?: number | null;
  nextMatchRequestedAt?: number | null;
  nextMatchRequestedMode?: SchedulerMode | null;
}

export interface SchedulerCouple {
  id: string;
  memberIds: readonly [string, string];
  mode: SchedulerMatchFormat;
  displayNumber?: number;
  active?: boolean;
}

export type SchedulerNextMatchRequest =
  | {
      id: string;
      scope: 'player';
      playerId: string;
      requestedAt: number;
      mode?: SchedulerMode | null;
    }
  | {
      id: string;
      scope: 'couple';
      coupleId: string;
      requestedAt: number;
      mode?: SchedulerMode | null;
    };

export interface SchedulerRecentMatch {
  /** Four session-player ids. Input should be ordered newest first. */
  playerIds: readonly string[];
  endedAt?: number | null;
}

export interface SchedulerLockedMatch {
  id: string;
  playerIds: readonly string[];
  index?: number;
}

export type SchedulerEligibilityReason =
  | 'INACTIVE'
  | 'NOT_ARRIVED'
  | 'END_GAME'
  | 'STATUS_BLOCKED'
  | 'RESERVED';

export type SchedulerReasonCode =
  | 'BALANCED'
  | 'BALANCE_FALLBACK'
  | 'PROTECTED_WAIT'
  | 'NEXT_MATCH'
  | 'ENTRY_PRIORITY'
  | 'FAIR_MATCHES'
  | 'LONG_WAIT'
  | 'COUPLE'
  | 'FRESH_QUARTET'
  | 'REPEAT_FORCED'
  | 'HOST_FILL'
  | 'RECENTLY_FINISHED';

export type SchedulerWarningCode =
  | 'INVALID_COUPLE_MEMBERS'
  | 'COUPLE_MEMBER_NOT_FOUND'
  | 'COUPLE_GENDER_MISMATCH'
  | 'COUPLE_MEMBERSHIP_CONFLICT'
  | 'INVALID_LOCKED_MATCH'
  | 'CANDIDATE_POOL_LIMIT_REACHED'
  | 'NO_ELIGIBLE_PLAYERS'
  | 'NO_VALID_MATCH'
  | 'BALANCE_FALLBACK_USED';

export interface SchedulerWarning {
  code: SchedulerWarningCode;
  message: string;
  entityId?: string;
}

export interface SchedulerConfig {
  candidatePoolLimit: number;
  maxOptionsPerFormat: number;
  maxBatchOptions: number;
  beamWidth: number;
  preferredTeamGap: number;
  maxTeamGap: number;
  protectedDeferredCycles: number;
  recentQuartetWindow?: number;
  levelMin: number;
  levelMax: number;
  femaleEffectiveLevelOffset: number;
  eligibleStatuses: readonly SchedulerPlayerStatus[];
}

export interface SchedulerSuggestionMetrics {
  teamStrengths: readonly [number, number];
  teamGap: number;
  fairMatchesMax: number;
  fairMatchesTotal: number;
  fairMatchesSpread: number;
  deferredCyclesTotal: number;
  waitingDurationTotalMs: number;
  restDurationTotalMs: number;
  hostCount: number;
  /** True when Auto mode uses two different team formations in one match. */
  mixedFormatFallback: boolean;
  previousPreviewPlayerCount: number;
  protectedPlayerIds: readonly string[];
  fulfilledRequestIds: readonly string[];
  fulfilledRequestOldestAt: number | null;
  entryPriorityPlayerIds: readonly string[];
  fulfilledCoupleIds: readonly string[];
  recentQuartetRank: number | null;
}

export interface SchedulerSuggestion {
  id: string;
  index: number;
  format: SchedulerMatchFormat;
  roster: readonly [string, string, string, string];
  teamA: readonly [string, string];
  teamB: readonly [string, string];
  quartetSignature: string;
  reasons: readonly SchedulerReasonCode[];
  metrics: SchedulerSuggestionMetrics;
}

export interface SchedulerDiagnostics {
  eligiblePlayerIds: readonly string[];
  excludedPlayers: Readonly<Record<string, readonly SchedulerEligibilityReason[]>>;
  reservedPlayerIds: readonly string[];
  candidatePlayerIdsByFormat: Readonly<Partial<Record<SchedulerMatchFormat, readonly string[]>>>;
  evaluatedTeamCount: number;
  evaluatedMatchCount: number;
  retainedMatchOptionCount: number;
  exploredBatchStateCount: number;
  candidatePoolLimitReached: boolean;
  warnings: readonly SchedulerWarning[];
}

export interface GenerateSchedulerPreviewsInput {
  players: readonly SchedulerPlayer[];
  couples?: readonly SchedulerCouple[];
  nextMatchRequests?: readonly SchedulerNextMatchRequest[];
  recentMatches?: readonly SchedulerRecentMatch[];
  lockedMatches?: readonly SchedulerLockedMatch[];
  reservedPlayerIds?: ReadonlySet<string> | readonly string[];
  /** Soft diversity input from the currently displayed unlocked previews. */
  previousPreviewPlayerIds?: ReadonlySet<string> | readonly string[];
  /** Total desired preview slots, including locked previews. */
  targetMatchCount: number;
  mode: SchedulerMode;
  /** Explicit clock input keeps the engine deterministic and straightforward to test. */
  now: number;
  /** Seed only changes otherwise equivalent choices; it never overrides quality tiers. */
  seed?: string | number;
  config?: Partial<SchedulerConfig>;
}

export interface GenerateSchedulerPreviewsResult {
  suggestions: readonly SchedulerSuggestion[];
  requestedMatchCount: number;
  lockedMatchCount: number;
  generatedMatchCount: number;
  diagnostics: SchedulerDiagnostics;
}
