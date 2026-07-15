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
    card: 'border-border bg-surface ring-1 ring-success/10',
    label: 'text-foreground',
    value: 'text-success',
    sub: 'text-muted-foreground',
    icon: 'text-success'
  },
  expense: {
    card: 'border-border bg-surface ring-1 ring-danger/10',
    label: 'text-foreground',
    value: 'text-danger',
    sub: 'text-muted-foreground',
    icon: 'text-danger'
  },
  profit: {
    card: 'border-border bg-surface ring-1 ring-info/10',
    label: 'text-foreground',
    value: 'text-info',
    sub: 'text-muted-foreground',
    icon: 'text-info'
  },
  inventory: {
    card: 'border-border bg-surface ring-1 ring-inventory/10',
    label: 'text-foreground',
    value: 'text-inventory',
    sub: 'text-muted-foreground',
    icon: 'text-inventory'
  },
  warning: {
    card: 'border-border bg-surface ring-1 ring-warning/10',
    label: 'text-foreground',
    value: 'text-warning',
    sub: 'text-muted-foreground',
    icon: 'text-warning'
  },
  info: {
    card: 'border-border bg-surface ring-1 ring-info/10',
    label: 'text-foreground',
    value: 'text-info',
    sub: 'text-muted-foreground',
    icon: 'text-info'
  },
  success: {
    card: 'border-border bg-surface ring-1 ring-success/10',
    label: 'text-foreground',
    value: 'text-success',
    sub: 'text-muted-foreground',
    icon: 'text-success'
  },
  danger: {
    card: 'border-border bg-surface ring-1 ring-danger/10',
    label: 'text-foreground',
    value: 'text-danger',
    sub: 'text-muted-foreground',
    icon: 'text-danger'
  },
  violet: {
    card: 'border-border bg-surface ring-1 ring-info/10',
    label: 'text-foreground',
    value: 'text-info',
    sub: 'text-muted-foreground',
    icon: 'text-info'
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
  maxWidth = 'max-w-none',
  minWidth
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  minWidth?: string;
}) {
  return (
    <div className={cn('operational-x-scroll w-full')}>
      <div className={cn('mx-auto flex w-full flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 xl:px-8', maxWidth, minWidth, className)}>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backAction,
  filters
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backAction?: ReactNode;
  filters?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {backAction ? <div className="mb-2">{backAction}</div> : null}
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">{eyebrow}</p> : null}
        <h1 className="mt-1 text-page-title">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {(actions || filters) ? (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {filters}
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0">
        <h2 className="text-section-title">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div> : null}
    </div>
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
    <section className={cn('rounded-xl border border-border bg-surface px-4 py-3 shadow-soft', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {(title || description) ? (
          <div className="min-w-0">
            {title ? <div className="text-card-title">{title}</div> : null}
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
    <section className={cn('rounded-xl border border-border bg-surface p-4 shadow-soft md:p-5', className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-section-title">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
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
    <div className={cn('relative grid min-h-[112px] grid-rows-[22px_1fr_22px] gap-2 overflow-hidden rounded-xl border p-4 before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-r-full before:bg-current before:opacity-60', toneStyle.card, toneStyle.icon, className)}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('truncate text-[13px] font-semibold uppercase tracking-[0.12em]', toneStyle.label, labelClassName)}>{label}</div>
        {Icon ? <Icon className={cn('h-4 w-4 shrink-0', toneStyle.icon)} /> : null}
      </div>
      <div className={cn('self-center break-words font-display text-[30px] font-bold leading-tight tracking-tight tabular-nums', toneStyle.value, valueClassName)}>{value}</div>
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
  'mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition hover:border-inputHover focus:border-focus focus:ring-2 focus:ring-focus/15 disabled:bg-surface-subtle disabled:text-text-disabled';

export const compactFormInputClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition hover:border-inputHover focus:border-focus focus:ring-2 focus:ring-focus/15 disabled:bg-surface-subtle disabled:text-text-disabled sm:w-40';

export const formLabelClass = 'text-xs font-medium text-text-secondary';
