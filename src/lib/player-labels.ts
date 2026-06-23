export const LEVEL_OPTIONS = [
  { value: 1, label: 'Y' },
  { value: 2, label: 'Y+' },
  { value: 3, label: 'TBY' },
  { value: 4, label: 'TB-' },
  { value: 5, label: 'TB' },
  { value: 6, label: 'TB+' }
] as const;

export function getLevelLabel(level: number | null | undefined): string {
  const normalized = Math.max(1, Math.min(6, Math.floor(Number(level || 1))));
  return LEVEL_OPTIONS.find((option) => option.value === normalized)?.label ?? 'Y';
}
