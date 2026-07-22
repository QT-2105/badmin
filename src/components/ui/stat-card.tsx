import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type StatCardTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'income' | 'expense' | 'profit' | 'inventory';
type StatCardDensity = 'compact' | 'default';

export type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: StatCardTone;
  trend?: ReactNode;
  density?: StatCardDensity;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  subClassName?: string;
  'aria-label'?: string;
};

const toneStyles: Record<StatCardTone, { card: string; accent: string; value: string; icon: string }> = {
  neutral: {
    card: 'border-border bg-surface',
    accent: 'bg-muted-foreground',
    value: 'text-foreground',
    icon: 'text-muted-foreground'
  },
  primary: {
    card: 'border-border bg-surface ring-1 ring-primary/15',
    accent: 'bg-primary',
    value: 'text-primary',
    icon: 'text-primary'
  },
  info: {
    card: 'border-border bg-surface ring-1 ring-info/15',
    accent: 'bg-info',
    value: 'text-info-foreground',
    icon: 'text-info'
  },
  success: {
    card: 'border-border bg-surface ring-1 ring-success/15',
    accent: 'bg-success',
    value: 'text-success-foreground',
    icon: 'text-success'
  },
  warning: {
    card: 'border-border bg-surface ring-1 ring-warning/20',
    accent: 'bg-warning',
    value: 'text-warning-foreground',
    icon: 'text-warning'
  },
  danger: {
    card: 'border-border bg-surface ring-1 ring-danger/15',
    accent: 'bg-danger',
    value: 'text-danger-foreground',
    icon: 'text-danger'
  },
  income: {
    card: 'border-border bg-surface ring-1 ring-success/15',
    accent: 'bg-success',
    value: 'text-success-foreground',
    icon: 'text-success'
  },
  expense: {
    card: 'border-border bg-surface ring-1 ring-danger/15',
    accent: 'bg-danger',
    value: 'text-danger-foreground',
    icon: 'text-danger'
  },
  profit: {
    card: 'border-border bg-surface ring-1 ring-info/15',
    accent: 'bg-info',
    value: 'text-info-foreground',
    icon: 'text-info'
  },
  inventory: {
    card: 'border-border bg-surface ring-1 ring-inventory/15',
    accent: 'bg-inventory',
    value: 'text-inventory-foreground',
    icon: 'text-inventory'
  }
};

const densityStyles: Record<StatCardDensity, { card: string; value: string; sub: string }> = {
  compact: {
    card: 'min-h-[96px] p-3',
    value: 'text-xl md:text-2xl',
    sub: 'text-xs'
  },
  default: {
    card: 'min-h-[112px] p-4',
    value: 'text-2xl md:text-[28px]',
    sub: 'text-sm'
  }
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'neutral',
  trend,
  density = 'default',
  className,
  labelClassName,
  valueClassName,
  subClassName,
  'aria-label': ariaLabel
}: StatCardProps) {
  const toneStyle = toneStyles[tone];
  const densityStyle = densityStyles[density];

  return (
    <div aria-label={ariaLabel} className={cn('relative grid grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-xl border transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none', toneStyle.card, densityStyle.card, className)}>
      <div className={cn('absolute inset-y-4 left-0 w-1 rounded-r-full', toneStyle.accent)} />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className={cn('min-w-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground', labelClassName)}>{label}</div>
        <div className="flex shrink-0 items-center gap-2">
          {trend}
          {Icon ? <Icon className={cn('h-4 w-4', toneStyle.icon)} aria-hidden="true" /> : null}
        </div>
      </div>
      <div className={cn('self-center break-words font-display font-bold leading-tight tracking-tight tabular-nums', toneStyle.value, densityStyle.value, valueClassName)}>
        {value}
      </div>
      <div className={cn('min-h-5 self-start font-medium leading-snug text-muted-foreground', densityStyle.sub, sub ? '' : 'invisible', subClassName)}>
        {sub || '-'}
      </div>
    </div>
  );
}
