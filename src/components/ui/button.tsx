import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover focus-visible:ring-primary/60',
  secondary:
    'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border hover:bg-surface-hover focus-visible:ring-ring/40',
  outline:
    'border border-border bg-transparent text-foreground hover:border-borderStrong hover:bg-surface-hover focus-visible:ring-ring/40',
  ghost: 'bg-transparent text-foreground hover:bg-surface-hover focus-visible:ring-ring/35',
  danger: 'bg-danger text-destructive-foreground shadow-xs hover:bg-danger/90 focus-visible:ring-danger/50',
  link: 'h-auto bg-transparent px-0 text-primary underline-offset-4 hover:underline focus-visible:ring-ring/35'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-lg px-3 text-sm',
  md: 'h-10 rounded-lg px-4 text-sm',
  lg: 'h-11 rounded-xl px-5 text-base'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60',
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
