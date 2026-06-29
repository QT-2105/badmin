import { getPlayerTagMeta, normalizePlayerTags, type PlayerTag } from '@/lib/player-tags';
import { cn } from '@/lib/utils';

export function PlayerTagBadges({
  tags,
  compact = false,
  className
}: {
  tags: PlayerTag[] | string[];
  compact?: boolean;
  className?: string;
}) {
  const normalized = normalizePlayerTags(tags);

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {normalized.map((tag) => {
        const meta = getPlayerTagMeta(tag);
        return (
          <span
            key={tag}
            className={cn(
              'rounded-full border font-semibold',
              compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
              meta.activeClassName
            )}
          >
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
