import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SurfaceVariant = 'default' | 'subtle' | 'elevated' | 'interactive';
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

const variantStyles: Record<SurfaceVariant, string> = {
  default: 'border-border bg-surface',
  subtle: 'border-border bg-surface-subtle',
  elevated: 'border-borderStrong bg-surface-elevated shadow-sm',
  interactive: 'border-border bg-surface shadow-xs transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:border-borderStrong hover:bg-surface-hover hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none'
};

const paddingStyles: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-3 sm:p-4',
  lg: 'p-4 md:p-5'
};

export function Surface({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  variant?: SurfaceVariant;
  padding?: SurfacePadding;
}) {
  return <div className={cn('min-w-0 rounded-xl border', variantStyles[variant], paddingStyles[padding], className)} {...props}>{children}</div>;
}

export function Card(props: Parameters<typeof Surface>[0]) {
  return <Surface {...props} />;
}

export function SectionSurface(props: Parameters<typeof Surface>[0]) {
  return <Surface padding="lg" {...props} />;
}
