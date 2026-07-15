import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SurfaceVariant = 'default' | 'subtle' | 'elevated' | 'interactive';
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

const variantStyles: Record<SurfaceVariant, string> = {
  default: 'border-border bg-surface shadow-soft',
  subtle: 'border-border bg-surface-subtle',
  elevated: 'border-border bg-surface-elevated shadow-sm',
  interactive: 'border-border bg-surface shadow-soft transition-colors hover:bg-surface-hover'
};

const paddingStyles: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5'
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
  return <div className={cn('rounded-xl border', variantStyles[variant], paddingStyles[padding], className)} {...props}>{children}</div>;
}

export function Card(props: Parameters<typeof Surface>[0]) {
  return <Surface {...props} />;
}

export function SectionSurface(props: Parameters<typeof Surface>[0]) {
  return <Surface padding="lg" {...props} />;
}
