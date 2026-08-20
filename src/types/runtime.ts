export type RuntimePlayerStatus = 'WAITING' | 'JUST_FINISHED' | 'PLAYING' | 'RESTING' | 'PRIORITY' | 'FINISHED';
export type RuntimeGender = 'Nam' | 'Nữ';
export type RuntimeMatchFormat = 'AUTO' | 'MEN' | 'WOMEN' | 'MIXED';
export type RuntimeNextMatchRequestMode = 'ANY' | 'MEN' | 'WOMEN' | 'MIXED';

export type RuntimePlayer = {
  id: string;
  name: string;
  gender: RuntimeGender;
  level: number;
  matchesPlayed: number;
  status: RuntimePlayerStatus;
  fatigue: number;
  statusUpdatedAt: number;
  justFinishedAt: number | null;
};

export type RuntimeSession = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  courtCount: number;
  status: string;
  runtimeVersion: number;
};

export type RuntimeSessionPlayer = {
  id: string;
  fullName: string;
  gender: RuntimeGender;
  level: number;
  totalMatches: number;
  paymentAmount: number;
  discount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  runtimeStatus: RuntimePlayerStatus;
  lastCourtNumber: number | null;
  note: string | null;
  playerTags: string[];
  avatarUrl: string | null;
  avatarS3Key: string | null;
  joinedAt: number | null;
  firstArrivedAt: number | null;
  arrivalBaselineMatches: number | null;
  fairnessOffset: number;
  deferredRounds: number;
  waitingSince: number | null;
  entryPriorityConsumedAt: number | null;
  lastFinishedAt: number | null;
  nextMatchRequestedAt: number | null;
  nextMatchRequestMode: RuntimeNextMatchRequestMode | null;
  endGameAt: number | null;
  endGameAfterMatch: boolean;
  coupleNumber: number | null;
  coupleMatchMode: Exclude<RuntimeMatchFormat, 'AUTO'> | null;
};

export type RuntimeCourtStatus = 'EMPTY' | 'READY' | 'PLAYING';

export type RuntimeCourt = {
  id: string;
  sessionId: string;
  courtId: string;
  courtName: string;
  status: RuntimeCourtStatus;
  runtimeMatchId: string | null;
  startedAt: number | null;
  updatedAt: number | null;
};

export type RuntimeRecentQuartet = {
  matchId: string;
  playerIds: string[];
  endedAt: number;
};

export type RuntimeMatch = {
  id: string;
  sessionId: string;
  queueOrder: number | null;
  courtId: string | null;
  status: string;
  fairnessScore: number | null;
  teamA: string[];
  teamB: string[];
  createdAt: number | null;
  updatedAt: number | null;
  locked: boolean;
  matchFormat: RuntimeMatchFormat | null;
  generation: number;
  manualEdited: boolean;
  sourceRevision: number | null;
};

export type RuntimeSnapshot = {
  session: RuntimeSession | null;
  players: RuntimeSessionPlayer[];
  courts: RuntimeCourt[];
  matches: RuntimeMatch[];
  recentQuartets: RuntimeRecentQuartet[];
  version: number;
};

export type RuntimeSyncPlayer = {
  id: string;
  status: RuntimePlayerStatus;
  matchesPlayed: number;
  lastCourtNumber: number | null;
  playerTags?: string[];
  firstArrivedAt?: number | null;
  arrivalBaselineMatches?: number | null;
  fairnessOffset?: number;
  deferredRounds?: number;
  waitingSince?: number | null;
  entryPriorityConsumedAt?: number | null;
  lastFinishedAt?: number | null;
  nextMatchRequestedAt?: number | null;
  nextMatchRequestMode?: RuntimeNextMatchRequestMode | null;
  endGameAt?: number | null;
  endGameAfterMatch?: boolean;
  coupleNumber?: number | null;
  coupleMatchMode?: Exclude<RuntimeMatchFormat, 'AUTO'> | null;
};

export type RuntimeSyncCourt = {
  courtId: string;
  status: RuntimeCourtStatus;
  startedAt: number | null;
  roster: Array<string | null>;
};

export type RuntimeSyncMatch = {
  id?: string;
  queueOrder: number;
  roster: Array<string | null>;
  score?: number | null;
  locked?: boolean;
  matchFormat?: RuntimeMatchFormat | null;
  generation?: number;
  manualEdited?: boolean;
  sourceRevision?: number | null;
};

export type RuntimeSyncPayload = {
  sessionId: string;
  expectedVersion?: number;
  mode?: 'FULL' | 'DELTA';
  players: RuntimeSyncPlayer[];
  courts: RuntimeSyncCourt[];
  nextMatches: RuntimeSyncMatch[];
  deletedQueueOrders?: number[];
};

export type RuntimeSyncResponse = {
  ok: true;
  version: number;
};

export type RuntimeSnapshotResponse = RuntimeSnapshot;
