export type PlayerTag = 'ARRIVED' | 'NOT_ARRIVED' | 'HOST' | 'END_GAME' | 'PRIORITY' | 'INJURED' | 'LEFT_EARLY';

type VisiblePlayerTag = Exclude<PlayerTag, 'INJURED' | 'LEFT_EARLY'>;

type PlayerTagMeta = {
  value: VisiblePlayerTag;
  label: string;
  className: string;
  activeClassName: string;
};

export const PLAYER_TAG_OPTIONS: PlayerTagMeta[] = [
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
    value: 'END_GAME',
    label: 'End-Game',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-rose-300 bg-rose-300 text-slate-950'
  },
  {
    value: 'PRIORITY',
    label: 'Trận kế',
    className: 'border-white/10 bg-white/[0.03] text-slate-500',
    activeClassName: 'border-cyan-300 bg-cyan-300 text-slate-950'
  }
];

const LEGACY_END_GAME_TAGS = new Set<PlayerTag>(['INJURED', 'LEFT_EARLY']);
const TAG_VALUES = new Set<PlayerTag>([
  ...PLAYER_TAG_OPTIONS.map((tag) => tag.value),
  ...LEGACY_END_GAME_TAGS
]);

export function normalizePlayerTags(tags: unknown): PlayerTag[] {
  const input = Array.isArray(tags) ? tags : [];
  const normalized = input
    .filter((tag): tag is PlayerTag => TAG_VALUES.has(tag as PlayerTag))
    .map((tag): PlayerTag => LEGACY_END_GAME_TAGS.has(tag) ? 'END_GAME' : tag);

  const withoutArrivalConflict = normalized.filter((tag) => tag !== 'ARRIVED' && tag !== 'NOT_ARRIVED');
  const arrivalTag: PlayerTag = normalized.includes('ARRIVED') ? 'ARRIVED' : 'NOT_ARRIVED';

  return uniqueTags([arrivalTag, ...withoutArrivalConflict]);
}

export function uniqueTags(tags: PlayerTag[]): PlayerTag[] {
  return [...new Set(tags)];
}

export function togglePlayerTag(tags: PlayerTag[], tag: PlayerTag): PlayerTag[] {
  const normalizedTag: PlayerTag = LEGACY_END_GAME_TAGS.has(tag) ? 'END_GAME' : tag;
  const current = new Set(normalizePlayerTags(tags));
  if (current.has(normalizedTag)) {
    current.delete(normalizedTag);
  } else {
    current.add(normalizedTag);
  }

  if (normalizedTag === 'ARRIVED') current.delete('NOT_ARRIVED');
  if (normalizedTag === 'HOST' && current.has('HOST')) {
    current.add('ARRIVED');
    current.delete('NOT_ARRIVED');
  }
  if (normalizedTag === 'NOT_ARRIVED') {
    current.delete('ARRIVED');
    current.delete('HOST');
    current.delete('PRIORITY');
    current.delete('END_GAME');
  }
  if (normalizedTag === 'END_GAME') {
    current.delete('PRIORITY');
  }

  return normalizePlayerTags([...current]);
}

export function getPlayerTagMeta(tag: PlayerTag) {
  const normalizedTag: VisiblePlayerTag = LEGACY_END_GAME_TAGS.has(tag) ? 'END_GAME' : tag as VisiblePlayerTag;
  return PLAYER_TAG_OPTIONS.find((option) => option.value === normalizedTag) ?? PLAYER_TAG_OPTIONS[1];
}
