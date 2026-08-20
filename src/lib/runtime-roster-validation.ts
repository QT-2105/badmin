import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';

export type RuntimeRosterValidationCode =
  | 'ROSTER_SIZE'
  | 'DUPLICATE_PLAYER'
  | 'PLAYER_NOT_FOUND'
  | 'PLAYER_NOT_ARRIVED'
  | 'PLAYER_END_GAME'
  | 'PLAYER_STATUS_BLOCKED'
  | 'PLAYER_ON_OTHER_COURT'
  | 'FORMAT_MISMATCH'
  | 'COUPLE_SPLIT'
  | 'LEVEL_IMBALANCE'
  | 'STALE_RUNTIME'
  | 'COURT_NOT_AVAILABLE'
  | 'NO_VALID_SUGGESTION';

export type RuntimeActionResult = {
  changed: boolean;
  errors: RuntimeRosterValidationCode[];
  warnings: RuntimeRosterValidationCode[];
  diagnostics?: string[];
};

type ValidationPlayer = {
  id: string;
  gender: 'Nam' | 'Nữ';
  level: number;
  status: string;
  playerTags: PlayerTag[];
  coupleNumber: number | null;
  coupleMatchMode: 'MEN' | 'WOMEN' | 'MIXED' | null;
};

type ValidationCourt = {
  id: string;
  slots: readonly (string | null)[];
};

export type RuntimeMatchFormat = 'AUTO' | 'MEN' | 'WOMEN' | 'MIXED';

export const EMPTY_RUNTIME_ACTION_RESULT: RuntimeActionResult = {
  changed: false,
  errors: [],
  warnings: []
};

export const RUNTIME_VALIDATION_MESSAGES: Record<RuntimeRosterValidationCode, string> = {
  ROSTER_SIZE: 'Đội hình cần đúng 4 người chơi.',
  DUPLICATE_PLAYER: 'Đội hình đang có người chơi bị trùng.',
  PLAYER_NOT_FOUND: 'Có người chơi không còn tồn tại trong ca.',
  PLAYER_NOT_ARRIVED: 'Có người chơi chưa được điểm danh Đã tới.',
  PLAYER_END_GAME: 'Có người chơi đã End-Game.',
  PLAYER_STATUS_BLOCKED: 'Có người chơi không còn ở trạng thái phù hợp.',
  PLAYER_ON_OTHER_COURT: 'Có người chơi đang được giữ ở sân khác.',
  FORMAT_MISMATCH: 'Đội hình không còn đúng nội dung trận đã chọn.',
  COUPLE_SPLIT: 'Đội hình đang tách Couple trong nội dung đã đăng ký.',
  LEVEL_IMBALANCE: 'Hai đội đang chênh lệch trình độ đáng kể.',
  STALE_RUNTIME: 'Dữ liệu điều phối đã thay đổi. Hãy đồng bộ lại trước khi tiếp tục.',
  COURT_NOT_AVAILABLE: 'Không còn sân trống phù hợp để áp dụng.',
  NO_VALID_SUGGESTION: 'Chưa tạo được phương án hợp lệ với trạng thái người chơi hiện tại.'
};

export function getRuntimeValidationMessage(result: RuntimeActionResult): string | null {
  const code = result.errors[0] ?? result.warnings[0];
  return code ? RUNTIME_VALIDATION_MESSAGES[code] : null;
}

export function inferRuntimeMatchFormat(
  roster: readonly string[],
  players: readonly ValidationPlayer[]
): RuntimeMatchFormat {
  const selected = roster
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is ValidationPlayer => Boolean(player));
  if (selected.length !== 4) return 'AUTO';

  const maleCount = selected.filter((player) => player.gender === 'Nam').length;
  if (maleCount === 4) return 'MEN';
  if (maleCount === 0) return 'WOMEN';

  const teamA = selected.slice(0, 2);
  const teamB = selected.slice(2, 4);
  const isMixedTeam = (team: ValidationPlayer[]) => team.some((player) => player.gender === 'Nam')
    && team.some((player) => player.gender === 'Nữ');
  return isMixedTeam(teamA) && isMixedTeam(teamB) ? 'MIXED' : 'AUTO';
}

export function validateRuntimeRoster({
  roster,
  players,
  courts,
  targetCourtId,
  allowedStatuses,
  expectedFormat = 'AUTO',
  sourceRevision,
  runtimeVersion
}: {
  roster: readonly string[];
  players: readonly ValidationPlayer[];
  courts: readonly ValidationCourt[];
  targetCourtId?: string | null;
  allowedStatuses: readonly string[];
  expectedFormat?: RuntimeMatchFormat;
  sourceRevision?: number | null;
  runtimeVersion?: number;
}): Omit<RuntimeActionResult, 'changed'> {
  const errors = new Set<RuntimeRosterValidationCode>();
  const warnings = new Set<RuntimeRosterValidationCode>();
  if (roster.length !== 4) errors.add('ROSTER_SIZE');
  if (new Set(roster).size !== roster.length) errors.add('DUPLICATE_PLAYER');
  if (sourceRevision !== undefined && sourceRevision !== null && runtimeVersion !== undefined && sourceRevision !== runtimeVersion) {
    errors.add('STALE_RUNTIME');
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const selected = roster.flatMap((playerId) => {
    const player = playerById.get(playerId);
    if (!player) {
      errors.add('PLAYER_NOT_FOUND');
      return [];
    }
    const tags = normalizePlayerTags(player.playerTags);
    if (!tags.includes('ARRIVED') || tags.includes('NOT_ARRIVED')) errors.add('PLAYER_NOT_ARRIVED');
    if (tags.includes('END_GAME')) errors.add('PLAYER_END_GAME');
    if (!allowedStatuses.includes(player.status)) errors.add('PLAYER_STATUS_BLOCKED');
    return [player];
  });

  const occupiedElsewhere = new Set(
    courts
      .filter((court) => court.id !== targetCourtId)
      .flatMap((court) => court.slots)
      .filter((playerId): playerId is string => Boolean(playerId))
  );
  if (roster.some((playerId) => occupiedElsewhere.has(playerId))) errors.add('PLAYER_ON_OTHER_COURT');

  const actualFormat = inferRuntimeMatchFormat(roster, players);
  if (expectedFormat !== 'AUTO' && actualFormat !== expectedFormat) errors.add('FORMAT_MISMATCH');

  if (selected.length === 4) {
    const teamIndexByPlayerId = new Map<string, number>();
    roster.forEach((playerId, index) => teamIndexByPlayerId.set(playerId, index < 2 ? 0 : 1));
    const coupleGroups = new Map<string, ValidationPlayer[]>();
    for (const player of players) {
      if (player.coupleNumber === null || player.coupleMatchMode === null) continue;
      const key = `${player.coupleNumber}:${player.coupleMatchMode}`;
      coupleGroups.set(key, [...(coupleGroups.get(key) ?? []), player]);
    }
    for (const members of coupleGroups.values()) {
      if (members.length !== 2 || members[0].coupleMatchMode !== actualFormat) continue;
      const memberIndexes = members.map((member) => teamIndexByPlayerId.get(member.id));
      const includedCount = memberIndexes.filter((index) => index !== undefined).length;
      if (includedCount === 1 || includedCount === 2 && memberIndexes[0] !== memberIndexes[1]) warnings.add('COUPLE_SPLIT');
    }

    const effectiveLevel = (player: ValidationPlayer) => Math.max(1, player.level + (player.gender === 'Nữ' ? -1 : 0));
    const teamAGap = selected.slice(0, 2).reduce((total, player) => total + effectiveLevel(player), 0);
    const teamBGap = selected.slice(2, 4).reduce((total, player) => total + effectiveLevel(player), 0);
    if (Math.abs(teamAGap - teamBGap) > 2) warnings.add('LEVEL_IMBALANCE');
  }

  return { errors: [...errors], warnings: [...warnings] };
}
