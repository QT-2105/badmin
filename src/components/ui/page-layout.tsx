import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MetricTone = 'neutral' | 'income' | 'expense' | 'profit' | 'inventory' | 'warning' | 'info' | 'success' | 'danger' | 'violet';
type NoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type SectionCardDensity = 'compact' | 'default' | 'comfortable';

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
  info: 'border-info/30 bg-info-soft text-info-foreground',
  success: 'border-success/30 bg-success-soft text-success-foreground',
  warning: 'border-warning/35 bg-warning-soft text-warning-foreground',
  danger: 'border-danger/30 bg-danger-soft text-danger-foreground'
};

const sectionCardDensityStyles: Record<SectionCardDensity, { shell: string; header: string; content: string }> = {
  compact: {
    shell: 'p-3 sm:p-3 md:p-4',
    header: 'gap-2',
    content: 'mt-3'
  },
  default: {
    shell: 'p-3 sm:p-4 md:p-5',
    header: 'gap-2',
    content: 'mt-3'
  },
  comfortable: {
    shell: 'p-4 sm:p-5 md:p-6',
    header: 'gap-3',
    content: 'mt-4'
  }
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
    <div className="w-full min-w-0 overflow-x-clip">
      <div className={cn('mx-auto flex w-full max-w-full min-w-0 flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 md:gap-5 md:px-6 md:py-6 xl:px-8', maxWidth, minWidth, className)}>
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
    <header className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        {backAction ? (
          <nav aria-label="Điều hướng trang" className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
            {backAction}
          </nav>
        ) : null}
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">{eyebrow}</p> : null}
        <h1 className="mt-1 text-page-title">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {(actions || filters) ? (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-start xl:justify-end">
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
    <div className={cn('flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0">
        <h2 className="text-section-title">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}

export function PageFeedbackStack({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid min-w-0 gap-2', className)} {...props}>{children}</div>;
}

export function PageSummaryGrid({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return <section className={cn('grid min-w-0 auto-rows-fr gap-3', className)} {...props}>{children}</section>;
}

export function PageContentStack({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid min-w-0 gap-4 md:gap-5', className)} {...props}>{children}</div>;
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
    <section className={cn('min-w-0 rounded-xl border border-border bg-surface px-3 py-3 sm:px-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {(title || description) ? (
          <div className="min-w-0">
            {title ? <div className="text-card-title">{title}</div> : null}
            {description ? <div className="text-xs leading-5 text-muted-foreground">{description}</div> : null}
          </div>
        ) : null}
        {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="mt-3 min-w-0">{children}</div> : null}
    </section>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  density = 'default'
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  density?: SectionCardDensity;
}) {
  const densityStyle = sectionCardDensityStyles[density];

  return (
    <section className={cn('min-w-0 rounded-xl border border-border bg-surface', densityStyle.shell, className)}>
      {(title || description || actions) ? (
        <div className={cn('flex min-w-0 flex-col md:flex-row md:items-start md:justify-between', densityStyle.header)}>
          <div className="min-w-0">
            {title ? <h2 className="text-section-title">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex min-w-0 shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('min-w-0', title || description || actions ? densityStyle.content : '', contentClassName)}>{children}</div>
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
  'mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-inputHover focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20 disabled:bg-surface-subtle disabled:text-text-disabled motion-reduce:transition-none';

export const compactFormInputClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-inputHover focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20 disabled:bg-surface-subtle disabled:text-text-disabled motion-reduce:transition-none sm:w-40';

export const formLabelClass = 'text-xs font-medium text-text-secondary';
