'use client';

import { cn } from '@/lib/utils';

type PlayerAvatarProps = {
  name: string;
  gender?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClass = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg'
};

export function initialsForName(name: string): string {
  const value = name.trim();
  if (!value) return 'B';
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PlayerAvatar({ name, gender, avatarUrl, size = 'sm', className }: PlayerAvatarProps) {
  const female = String(gender ?? '').toLowerCase().includes('nữ') || String(gender ?? '').toLowerCase().includes('nu');

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-border font-bold shadow-xs',
        female ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info',
        sizeClass[size],
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        initialsForName(name)
      )}
    </span>
  );
}
