'use client';

import { X } from 'lucide-react';
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type DialogTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  tone?: DialogTone;
  size?: DialogSize;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  contentClassName?: string;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const sizeStyles: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

const toneStyles: Record<DialogTone, string> = {
  neutral: 'border-border',
  info: 'border-info/25 ring-1 ring-info/10',
  success: 'border-success/25 ring-1 ring-success/10',
  warning: 'border-warning/30 ring-1 ring-warning/10',
  danger: 'border-danger/25 ring-1 ring-danger/10'
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
  });
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = 'Đóng',
  tone = 'neutral',
  size = 'md',
  closeOnEscape = true,
  closeOnOutsideClick = true,
  initialFocusRef,
  returnFocusRef,
  className,
  contentClassName
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocusElement = returnFocusRef?.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      const focusTarget = initialFocusRef?.current ?? getFocusableElements(panelRef.current)[0] ?? panelRef.current;
      focusTarget?.focus();
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      const returnTarget = returnFocusElement ?? previousActiveElementRef.current;
      returnTarget?.focus();
    };
  }, [initialFocusRef, open, returnFocusRef]);

  if (!open) {
    return null;
  }

  const closeDialog = () => onOpenChange(false);

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && event.target === event.currentTarget) {
      closeDialog();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(panelRef.current);
    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-overlay p-4"
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          'max-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-xl border bg-surface shadow-md outline-none',
          sizeStyles[size],
          toneStyles[tone],
          className
        )}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-section-title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label={closeLabel} onClick={closeDialog} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children ? <div className={cn('max-h-[calc(100vh-13rem)] overflow-y-auto px-5 py-4', contentClassName)}>{children}</div> : null}
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
