import { AlertCircle, AlertTriangle, CheckCircle2, CircleOff, Inbox, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FeedbackTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type FeedbackSize = 'sm' | 'md';

export type FeedbackStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: FeedbackTone;
  size?: FeedbackSize;
  className?: string;
};

type SkeletonProps = {
  className?: string;
};

const toneStyles: Record<FeedbackTone, { container: string; icon: string }> = {
  neutral: {
    container: 'border-border bg-surface-subtle text-foreground',
    icon: 'bg-surface-elevated text-muted-foreground'
  },
  info: {
    container: 'border-info/25 bg-info-soft text-info',
    icon: 'bg-info-soft text-info'
  },
  success: {
    container: 'border-success/25 bg-success-soft text-success',
    icon: 'bg-success-soft text-success'
  },
  warning: {
    container: 'border-warning/30 bg-warning-soft text-warning',
    icon: 'bg-warning-soft text-warning'
  },
  danger: {
    container: 'border-danger/25 bg-danger-soft text-danger',
    icon: 'bg-danger-soft text-danger'
  }
};

const sizeStyles: Record<FeedbackSize, { container: string; icon: string; title: string; description: string }> = {
  sm: {
    container: 'p-4',
    icon: 'h-9 w-9',
    title: 'text-sm',
    description: 'text-xs leading-5'
  },
  md: {
    container: 'p-6',
    icon: 'h-10 w-10',
    title: 'text-sm',
    description: 'text-sm leading-6'
  }
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-subtle', className)} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />;
}

function FeedbackState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  size = 'md',
  className
}: FeedbackStateProps) {
  const toneStyle = toneStyles[tone];
  const sizeStyle = sizeStyles[size];

  return (
    <div className={cn('rounded-xl border text-center', toneStyle.container, sizeStyle.container, className)}>
      {Icon ? (
        <div className={cn('mx-auto mb-3 grid place-items-center rounded-full border border-current/10', toneStyle.icon, sizeStyle.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className={cn('font-semibold text-foreground', sizeStyle.title)}>{title}</div>
      {description ? <div className={cn('mx-auto mt-1 max-w-md text-muted-foreground', sizeStyle.description)}>{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return <FeedbackState icon={Icon ?? Inbox} title={title} description={description} action={action} tone="neutral" className={cn('border-dashed', className)} />;
}

export function LoadingState({ icon: Icon = Loader2, className, ...props }: FeedbackStateProps) {
  return (
    <FeedbackState
      icon={Icon}
      tone="info"
      className={className}
      {...props}
    />
  );
}

export function ErrorState({ icon: Icon = AlertCircle, className, ...props }: Omit<FeedbackStateProps, 'tone'>) {
  return <FeedbackState icon={Icon} tone="danger" className={className} {...props} />;
}

export function WarningState({ icon: Icon = AlertTriangle, className, ...props }: Omit<FeedbackStateProps, 'tone'>) {
  return <FeedbackState icon={Icon} tone="warning" className={className} {...props} />;
}

export function SuccessState({ icon: Icon = CheckCircle2, className, ...props }: Omit<FeedbackStateProps, 'tone'>) {
  return <FeedbackState icon={Icon} tone="success" className={className} {...props} />;
}

export function DisabledState({ icon: Icon = CircleOff, className, ...props }: Omit<FeedbackStateProps, 'tone'>) {
  return <FeedbackState icon={Icon} tone="neutral" className={className} {...props} />;
}
