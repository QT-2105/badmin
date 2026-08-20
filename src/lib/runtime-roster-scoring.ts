export type RuntimeRosterScoringPlayer = {
  id: string;
  gender: 'Nam' | 'Nữ';
  level: number;
  fatigue: number;
  lastCourt: string | null;
};

const LEVEL_MIN = 1;
const LEVEL_MAX = 6;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

function normalizeLevel(level: number): number {
  return clamp(Math.floor(Number(level || LEVEL_MIN)), LEVEL_MIN, LEVEL_MAX);
}

export function getEffectiveRuntimeLevel(player: Pick<RuntimeRosterScoringPlayer, 'level' | 'gender'>): number {
  const normalized = normalizeLevel(player.level);
  return player.gender === 'Nữ' ? clamp(normalized - 1, LEVEL_MIN, LEVEL_MAX) : normalized;
}

export function evaluateRoster(
  players: RuntimeRosterScoringPlayer[],
  roster: string[],
  courtName: string
): {
  fairness: number;
  antiRepeat: number;
  fatigueBalance: number;
} {
  const selected = roster
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is RuntimeRosterScoringPlayer => Boolean(player));

  if (selected.length === 0) {
    return { fairness: 0, antiRepeat: 0, fatigueBalance: 0 };
  }

  const teamA = selected.slice(0, 2);
  const teamB = selected.slice(2, 4);
  const skillA = teamA.reduce((total, player) => total + getEffectiveRuntimeLevel(player), 0);
  const skillB = teamB.reduce((total, player) => total + getEffectiveRuntimeLevel(player), 0);
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
