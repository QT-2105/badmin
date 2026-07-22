import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Surface } from './surface';

type FilterBarDensity = 'compact' | 'default' | 'comfortable';

export type FilterBarProps = {
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  density?: FilterBarDensity;
  className?: string;
  contentClassName?: string;
};

const densityStyles: Record<FilterBarDensity, string> = {
  compact: 'gap-3 p-3',
  default: 'gap-4 p-4',
  comfortable: 'gap-5 p-5'
};

export function FilterBar({
  title,
  description,
  leading,
  filters,
  actions,
  children,
  density = 'default',
  className,
  contentClassName
}: FilterBarProps) {
  return (
    <Surface className={cn(densityStyles[density], className)} padding="none">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {(title || description || leading) ? (
          <div className="flex min-w-0 items-start gap-3">
            {leading ? <div className="shrink-0">{leading}</div> : null}
            <div className="min-w-0">
              {title ? <div className="text-card-title">{title}</div> : null}
              {description ? <div className="mt-1 text-sm leading-5 text-muted-foreground">{description}</div> : null}
            </div>
          </div>
        ) : null}
        {(filters || actions || children) ? (
          <div className={cn('flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end', contentClassName)}>
            {filters}
            {children}
            {actions}
          </div>
        ) : null}
      </div>
    </Surface>
  );
}
