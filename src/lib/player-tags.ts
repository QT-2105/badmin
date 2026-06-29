export type PlayerTag = 'ARRIVED' | 'NOT_ARRIVED' | 'HOST' | 'INJURED' | 'LEFT_EARLY' | 'PRIORITY';

export const PLAYER_TAG_OPTIONS: Array<{
  value: PlayerTag;
  label: string;
  className: string;
  activeClassName: string;
}> = [
  {
    value: 'ARRIVED',
    label: 'Đã tới',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-emerald-300 bg-emerald-300 text-slate-950'
  },
  {
    value: 'NOT_ARRIVED',
    label: 'Chưa tới',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-slate-300 bg-slate-300 text-slate-950'
  },
  {
    value: 'HOST',
    label: 'Host',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-violet-300 bg-violet-300 text-slate-950'
  },
  {
    value: 'INJURED',
    label: 'Chấn thương',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-rose-300 bg-rose-300 text-slate-950'
  },
  {
    value: 'LEFT_EARLY',
    label: 'Về sớm',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-orange-300 bg-orange-300 text-slate-950'
  },
  {
    value: 'PRIORITY',
    label: 'Ưu tiên',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-cyan-300 bg-cyan-300 text-slate-950'
  }
];

const TAG_VALUES = new Set<PlayerTag>(PLAYER_TAG_OPTIONS.map((tag) => tag.value));

export function normalizePlayerTags(tags: unknown): PlayerTag[] {
  const input = Array.isArray(tags) ? tags : [];
  const normalized = input.filter((tag): tag is PlayerTag => TAG_VALUES.has(tag as PlayerTag));

  if (normalized.includes('LEFT_EARLY')) return uniqueTags(['LEFT_EARLY']);
  if (normalized.includes('INJURED')) return uniqueTags(['INJURED']);

  const withoutArrivalConflict = normalized.filter((tag) => tag !== 'ARRIVED' && tag !== 'NOT_ARRIVED');
  const arrivalTag: PlayerTag = normalized.includes('ARRIVED') || normalized.includes('PRIORITY') || normalized.includes('HOST')
    ? 'ARRIVED'
    : 'NOT_ARRIVED';

  return uniqueTags([arrivalTag, ...withoutArrivalConflict]);
}

export function uniqueTags(tags: PlayerTag[]): PlayerTag[] {
  return [...new Set(tags)];
}

export function togglePlayerTag(tags: PlayerTag[], tag: PlayerTag): PlayerTag[] {
  const current = new Set(normalizePlayerTags(tags));
  if (current.has(tag)) {
    current.delete(tag);
  } else {
    current.add(tag);
  }

  if (tag === 'ARRIVED') current.delete('NOT_ARRIVED');
  if (tag === 'NOT_ARRIVED') {
    current.delete('ARRIVED');
    current.delete('PRIORITY');
  }
  if (tag === 'INJURED') {
    current.delete('LEFT_EARLY');
    current.delete('ARRIVED');
    current.delete('PRIORITY');
  }
  if (tag === 'LEFT_EARLY') {
    current.delete('INJURED');
    current.delete('ARRIVED');
    current.delete('PRIORITY');
  }
  if (tag === 'PRIORITY' || tag === 'HOST') {
    current.add('ARRIVED');
    current.delete('NOT_ARRIVED');
  }

  return normalizePlayerTags([...current]);
}

export function getPlayerTagMeta(tag: PlayerTag) {
  return PLAYER_TAG_OPTIONS.find((option) => option.value === tag) ?? PLAYER_TAG_OPTIONS[1];
}
