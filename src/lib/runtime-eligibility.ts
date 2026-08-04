import { normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';

type EligibleStatus = 'WAITING' | 'JUST_FINISHED';

type RuntimeEligibilityPlayer = {
  id: string;
  status: string;
  playerTags: PlayerTag[];
};

const ELIGIBLE_STATUSES: EligibleStatus[] = ['WAITING', 'JUST_FINISHED'];

export function isPlayerEligibleForAutoSuggestion(
  player: RuntimeEligibilityPlayer,
  excludedPlayerIds?: ReadonlySet<string>
): boolean {
  if (excludedPlayerIds?.has(player.id)) return false;
  if (!ELIGIBLE_STATUSES.includes(player.status as EligibleStatus)) return false;

  const tags = normalizePlayerTags(player.playerTags);
  if (tags.includes('INJURED') || tags.includes('LEFT_EARLY')) return false;
  if (tags.includes('NOT_ARRIVED') && !tags.includes('PRIORITY') && !tags.includes('HOST')) return false;
  return tags.includes('ARRIVED') || tags.includes('PRIORITY') || tags.includes('HOST');
}
