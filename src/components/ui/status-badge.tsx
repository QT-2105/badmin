import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inventory';

const toneStyles: Record<StatusTone, string> = {
  neutral: 'border-border bg-surface-subtle text-text-secondary',
  info: 'border-info/30 bg-info-soft text-info-foreground',
  success: 'border-success/30 bg-success-soft text-success-foreground',
  warning: 'border-warning/35 bg-warning-soft text-warning-foreground',
  danger: 'border-danger/30 bg-danger-soft text-danger-foreground',
  inventory: 'border-inventory/30 bg-inventory-soft text-inventory-foreground'
};

export function StatusBadge({
  children,
  leading,
  tone = 'neutral',
  className,
  'aria-label': ariaLabel,
  title
}: {
  children: ReactNode;
  leading?: ReactNode;
  tone?: StatusTone;
  className?: string;
  'aria-label'?: string;
  title?: string;
}) {
  return (
    <span
      aria-label={ariaLabel}
      title={title}
      className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold leading-none transition-colors duration-150 motion-reduce:transition-none', toneStyles[tone], className)}
    >
      {leading ? (
        <span className="shrink-0" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      {children}
    </span>
  );
}
