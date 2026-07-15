import * as React from 'react';

import { cn } from '@/lib/utils';

const fieldBaseClass =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-inputHover focus:border-focus focus:ring-2 focus:ring-focus/15 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={cn('h-10', fieldBaseClass, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn('min-h-24 py-2', fieldBaseClass, className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('h-10', fieldBaseClass, className)} {...props}>
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
        'h-4 w-4 rounded border-input bg-background text-primary outline-none transition focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-50',
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
        'h-5 w-9 cursor-pointer appearance-none rounded-full border border-border bg-surface-subtle transition checked:bg-primary focus:outline-none focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-50',
        'before:block before:h-4 before:w-4 before:translate-x-0 before:rounded-full before:bg-white before:shadow-xs before:transition-transform checked:before:translate-x-4',
        className
      )}
    />
  )
);
Switch.displayName = 'Switch';

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-text-secondary', className)} {...props} />;
}

export function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs leading-5 text-muted-foreground', className)} {...props} />;
}

export function FormMessage({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs font-medium leading-5 text-danger', className)} {...props} />;
}
