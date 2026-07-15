import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inventory';

const toneStyles: Record<StatusTone, string> = {
  neutral: 'border-border bg-surface-subtle text-text-secondary',
  info: 'border-info/25 bg-info-soft text-info',
  success: 'border-success/25 bg-success-soft text-success',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/25 bg-danger-soft text-danger',
  inventory: 'border-inventory/25 bg-inventory-soft text-inventory'
};

export function StatusBadge({
  children,
  tone = 'neutral',
  className
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold leading-none', toneStyles[tone], className)}>
      {children}
    </span>
  );
}
