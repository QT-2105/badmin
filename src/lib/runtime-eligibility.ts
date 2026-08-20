import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';

type EligibleStatus = 'WAITING' | 'JUST_FINISHED';
type ReplacementEligibleStatus = EligibleStatus | 'PRIORITY';

type RuntimeEligibilityPlayer = {
  id: string;
  status: string;
  playerTags: PlayerTag[];
};

const ELIGIBLE_STATUSES: EligibleStatus[] = ['WAITING', 'JUST_FINISHED'];
const REPLACEMENT_ELIGIBLE_STATUSES: ReplacementEligibleStatus[] = ['WAITING', 'JUST_FINISHED', 'PRIORITY'];

function hasEligibleAttendance(tags: PlayerTag[]): boolean {
  if (tags.includes('END_GAME') || tags.includes('INJURED') || tags.includes('LEFT_EARLY')) return false;
  if (tags.includes('NOT_ARRIVED')) return false;
  return tags.includes('ARRIVED');
}

export function isPlayerEligibleForAutoSuggestion(
  player: RuntimeEligibilityPlayer,
  excludedPlayerIds?: ReadonlySet<string>
): boolean {
  if (excludedPlayerIds?.has(player.id)) return false;
  if (!ELIGIBLE_STATUSES.includes(player.status as EligibleStatus)) return false;

  const tags = normalizePlayerTags(player.playerTags);
  return hasEligibleAttendance(tags);
}

export function isPlayerEligibleForReplacement(player: RuntimeEligibilityPlayer): boolean {
  if (!REPLACEMENT_ELIGIBLE_STATUSES.includes(player.status as ReplacementEligibleStatus)) return false;
  return hasEligibleAttendance(normalizePlayerTags(player.playerTags));
}
