'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Surface } from './surface';

type FormSectionTone = 'neutral' | 'info' | 'warning' | 'danger';

export type FormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapseLabel?: string;
  expandLabel?: string;
  showCollapseLabel?: boolean;
  disabled?: boolean;
  tone?: FormSectionTone;
  className?: string;
  contentClassName?: string;
};

const toneStyles: Record<FormSectionTone, string> = {
  neutral: 'border-border',
  info: 'border-info/25 ring-1 ring-info/10',
  warning: 'border-warning/30 ring-1 ring-warning/10',
  danger: 'border-danger/25 ring-1 ring-danger/10'
};

export function FormSection({
  title,
  description,
  icon,
  actions,
  footer,
  children,
  collapsible = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  collapseLabel = 'Thu gọn',
  expandLabel = 'Mở rộng',
  showCollapseLabel = false,
  disabled = false,
  tone = 'neutral',
  className,
  contentClassName
}: FormSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === 'boolean';
  const isExpanded = collapsible ? (isControlled ? expanded : internalExpanded) : true;

  const setExpanded = (nextExpanded: boolean) => {
    if (!isControlled) {
      setInternalExpanded(nextExpanded);
    }
    onExpandedChange?.(nextExpanded);
  };

  return (
    <Surface
      aria-disabled={disabled || undefined}
      className={cn(toneStyles[tone], disabled ? 'opacity-70' : '', className)}
      padding="lg"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</div> : null}
          <div className="min-w-0">
            <h2 className="text-section-title">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
          {collapsible ? (
            <Button
              aria-expanded={isExpanded}
              aria-label={isExpanded ? collapseLabel : expandLabel}
              className="h-10 min-w-10"
              disabled={disabled}
              onClick={() => setExpanded(!isExpanded)}
              size="sm"
              variant="secondary"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', isExpanded ? 'rotate-180' : '')} />
              {showCollapseLabel ? <span>{isExpanded ? collapseLabel : expandLabel}</span> : null}
            </Button>
          ) : null}
        </div>
      </div>
      {isExpanded ? (
        <div className={cn('mt-4 min-w-0', disabled ? 'pointer-events-none' : '', contentClassName)}>
          {children}
          {footer ? <div className="mt-4 border-t border-border pt-4">{footer}</div> : null}
        </div>
      ) : null}
    </Surface>
  );
}
