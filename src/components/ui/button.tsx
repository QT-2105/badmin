import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: React.ReactNode;
  iconOnly?: boolean;
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
  (
    {
      children,
      className,
      disabled,
      iconOnly = false,
      loading = false,
      loadingText,
      variant = 'primary',
      size = 'md',
      type = 'button',
      'aria-busy': ariaBusy,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={ariaBusy ?? (loading || undefined)}
        data-loading={loading ? 'true' : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium outline-none backdrop-blur-sm transition-[background-color,border-color,color,box-shadow,opacity] duration-150 ease-out active:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none',
          variantStyles[variant],
          sizeStyles[size],
          iconOnly ? 'aspect-square px-0' : '',
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type IconButtonProps = Omit<ButtonProps, 'children' | 'iconOnly'> & {
  icon: React.ReactNode;
  label: string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, 'aria-label': ariaLabel, title, ...props }, ref) => (
    <Button ref={ref} iconOnly aria-label={ariaLabel ?? label} title={title ?? label} {...props}>
      {icon}
    </Button>
  )
);

IconButton.displayName = 'IconButton';
