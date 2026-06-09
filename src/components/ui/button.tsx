import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)] hover:bg-cyan-300 focus-visible:ring-cyan-400/60',
  secondary:
    'bg-white/7 text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/12 focus-visible:ring-white/25',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/8 focus-visible:ring-white/20',
  danger: 'bg-rose-500 text-white shadow-[0_0_28px_rgba(244,63,94,0.2)] hover:bg-rose-400 focus-visible:ring-rose-400/60'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-11 rounded-xl px-3 text-sm',
  md: 'h-12 rounded-2xl px-4 text-sm',
  lg: 'h-14 rounded-2xl px-5 text-base'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
