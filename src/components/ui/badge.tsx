import * as React from 'react';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10',
  success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20',
  warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/20',
  danger: 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/20',
  muted: 'bg-slate-800 text-slate-300 ring-1 ring-inset ring-white/10'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
