import * as React from 'react';

import { cn } from '@/lib/utils';

const fieldBaseClass =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-inputHover focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled motion-reduce:transition-none';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

const tabularInputTypes = new Set(['date', 'datetime-local', 'month', 'number', 'time', 'week']);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid ?? props['aria-invalid']}
      className={cn(
        'h-10',
        fieldBaseClass,
        tabularInputTypes.has(type) ? 'tabular-nums' : '',
        type === 'number' ? 'text-right' : '',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} aria-invalid={invalid ?? props['aria-invalid']} className={cn('min-h-24 py-2', fieldBaseClass, className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, ...props }, ref) => (
    <select ref={ref} aria-invalid={invalid ?? props['aria-invalid']} className={cn('h-10', fieldBaseClass, className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      type="checkbox"
      className={cn(
        'h-5 w-5 rounded border-input bg-background text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className
      )}
    />
  )
);
Checkbox.displayName = 'Checkbox';

export const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      type="checkbox"
      role="switch"
      className={cn(
        'h-6 w-11 cursor-pointer appearance-none rounded-full border border-border bg-surface-subtle transition-colors checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        'before:block before:h-5 before:w-5 before:translate-x-0 before:rounded-full before:bg-white before:shadow-xs before:transition-transform checked:before:translate-x-5 motion-reduce:before:transition-none',
        className
      )}
    />
  )
);
Switch.displayName = 'Switch';

export const Radio = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      type="radio"
      className={cn(
        'h-5 w-5 rounded-full border-input bg-background text-primary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/25 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className
      )}
    />
  )
);
Radio.displayName = 'Radio';

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-text-secondary', className)} {...props} />;
}

export function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs leading-5 text-muted-foreground', className)} {...props} />;
}

export function FormMessage({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p role="alert" className={cn('text-xs font-medium leading-5 text-danger', className)} {...props} />;
}

export function RequiredMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('ml-1 text-danger', className)}>
      *
    </span>
  );
}
