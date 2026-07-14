import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MetricTone = 'neutral' | 'income' | 'expense' | 'profit' | 'inventory' | 'warning' | 'info' | 'success' | 'danger' | 'violet';
type NoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const metricToneStyles: Record<MetricTone, { card: string; label: string; value: string; sub: string; icon: string }> = {
  neutral: {
    card: 'border-border bg-surface text-foreground',
    label: 'text-foreground',
    value: 'text-foreground',
    sub: 'text-muted-foreground',
    icon: 'text-muted-foreground'
  },
  income: {
    card: 'border-success/45 bg-surface ring-1 ring-success/10',
    label: 'text-foreground',
    value: 'text-success',
    sub: 'text-muted-foreground',
    icon: 'text-success'
  },
  expense: {
    card: 'border-danger/45 bg-surface ring-1 ring-danger/10',
    label: 'text-foreground',
    value: 'text-danger',
    sub: 'text-muted-foreground',
    icon: 'text-danger'
  },
  profit: {
    card: 'border-info/45 bg-surface ring-1 ring-info/10',
    label: 'text-foreground',
    value: 'text-info',
    sub: 'text-muted-foreground',
    icon: 'text-info'
  },
  inventory: {
    card: 'border-inventory/50 bg-surface ring-1 ring-inventory/10',
    label: 'text-foreground',
    value: 'text-inventory',
    sub: 'text-muted-foreground',
    icon: 'text-inventory'
  },
  warning: {
    card: 'border-warning/50 bg-surface ring-1 ring-warning/10',
    label: 'text-foreground',
    value: 'text-warning',
    sub: 'text-muted-foreground',
    icon: 'text-warning'
  },
  info: {
    card: 'border-info/45 bg-surface ring-1 ring-info/10',
    label: 'text-foreground',
    value: 'text-info',
    sub: 'text-muted-foreground',
    icon: 'text-info'
  },
  success: {
    card: 'border-success/45 bg-surface ring-1 ring-success/10',
    label: 'text-foreground',
    value: 'text-success',
    sub: 'text-muted-foreground',
    icon: 'text-success'
  },
  danger: {
    card: 'border-danger/45 bg-surface ring-1 ring-danger/10',
    label: 'text-foreground',
    value: 'text-danger',
    sub: 'text-muted-foreground',
    icon: 'text-danger'
  },
  violet: {
    card: 'border-violet-500/45 bg-surface ring-1 ring-violet-500/10',
    label: 'text-foreground',
    value: 'text-violet-700 dark:text-violet-200',
    sub: 'text-muted-foreground',
    icon: 'text-violet-700 dark:text-violet-200'
  }
};

const noticeToneStyles: Record<NoticeTone, string> = {
  neutral: 'border-border bg-surface-muted text-muted-foreground',
  info: 'border-info/25 bg-info-soft text-info',
  success: 'border-success/25 bg-success-soft text-success',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/25 bg-danger-soft text-danger'
};

export function PageShell({
  children,
  className,
  maxWidth = 'max-w-7xl',
  minWidth
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  minWidth?: string;
}) {
  return (
    <div className={cn('operational-x-scroll w-full')}>
      <div className={cn('mx-auto flex w-full flex-col gap-4 px-4 py-5 md:px-6', maxWidth, minWidth, className)}>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-info">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function ToolbarCard({
  title,
  description,
  actions,
  children,
  className
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-surface px-3 py-2.5 shadow-soft', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {(title || description) ? (
          <div className="min-w-0">
            {title ? <div className="text-sm font-semibold text-foreground">{title}</div> : null}
            {description ? <div className="text-xs leading-5 text-muted-foreground">{description}</div> : null}
          </div>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-surface p-4 shadow-soft', className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(title || description || actions ? 'mt-3' : '', contentClassName)}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'neutral',
  className,
  valueClassName,
  labelClassName,
  subClassName
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTone;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  subClassName?: string;
}) {
  const toneStyle = metricToneStyles[tone];
  return (
    <div className={cn('grid min-h-[112px] grid-rows-[24px_1fr_22px] gap-2 rounded-xl border p-4', toneStyle.card, className)}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('truncate text-sm font-semibold uppercase tracking-[0.12em]', toneStyle.label, labelClassName)}>{label}</div>
        {Icon ? <Icon className={cn('h-4 w-4 shrink-0', toneStyle.icon)} /> : null}
      </div>
      <div className={cn('self-center break-words font-display text-3xl font-semibold leading-tight tracking-tight', toneStyle.value, valueClassName)}>{value}</div>
      <div className={cn('self-start text-sm font-medium leading-snug', toneStyle.sub, sub ? '' : 'invisible', subClassName)}>{sub || '-'}</div>
    </div>
  );
}

export function NoticeCard({
  tone = 'neutral',
  children,
  className
}: {
  tone?: NoticeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4 text-sm', noticeToneStyles[tone], className)}>
      {children}
    </div>
  );
}

export const formInputClass =
  'mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring disabled:text-muted-foreground';

export const compactFormInputClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring disabled:text-muted-foreground sm:w-40';

export const formLabelClass = 'text-xs font-medium text-muted-foreground';
