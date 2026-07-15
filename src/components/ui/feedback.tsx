import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-subtle', className)} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border', className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-dashed border-border bg-surface-subtle p-6 text-center', className)}>
      {Icon ? (
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? <div className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
