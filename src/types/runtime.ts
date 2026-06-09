export type RuntimePlayerStatus = 'WAITING' | 'JUST_FINISHED' | 'PLAYING' | 'RESTING' | 'PRIORITY' | 'FINISHED';
export type RuntimeGender = 'Nam' | 'Nữ';

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
  joinedAt: number | null;
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
};

export type RuntimeSnapshot = {
  session: RuntimeSession | null;
  players: RuntimeSessionPlayer[];
  courts: RuntimeCourt[];
  matches: RuntimeMatch[];
};

export type RuntimeSyncPlayer = {
  id: string;
  status: RuntimePlayerStatus;
  matchesPlayed: number;
  lastCourtNumber: number | null;
};

export type RuntimeSyncCourt = {
  courtId: string;
  status: RuntimeCourtStatus;
  startedAt: number | null;
  roster: Array<string | null>;
};

export type RuntimeSyncMatch = {
  queueOrder: number;
  roster: Array<string | null>;
  score?: number | null;
};

export type RuntimeSyncPayload = {
  sessionId: string;
  players: RuntimeSyncPlayer[];
  courts: RuntimeSyncCourt[];
  nextMatches: RuntimeSyncMatch[];
};

export type RuntimeSnapshotResponse = RuntimeSnapshot;
