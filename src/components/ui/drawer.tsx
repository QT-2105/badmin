'use client';

import { X } from 'lucide-react';
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type DrawerPlacement = 'left' | 'right' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  placement?: DrawerPlacement;
  size?: DrawerSize;
  closeLabel?: string;
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

const placementStyles: Record<DrawerPlacement, string> = {
  left: 'inset-y-0 left-0 h-full rounded-r-xl border-r',
  right: 'inset-y-0 right-0 h-full rounded-l-xl border-l',
  bottom: 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-xl border-t'
};

const sizeStyles: Record<DrawerPlacement, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-xl',
    full: 'w-full max-w-none'
  },
  right: {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-md',
    lg: 'w-full max-w-xl',
    full: 'w-full max-w-none'
  },
  bottom: {
    sm: 'h-auto',
    md: 'h-auto',
    lg: 'h-auto',
    full: 'h-full max-h-none'
  }
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
  });
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  actions,
  footer,
  children,
  placement = 'right',
  size = 'md',
  closeLabel = 'Đóng',
  closeOnEscape = true,
  closeOnOutsideClick = true,
  initialFocusRef,
  returnFocusRef,
  className,
  contentClassName
}: DrawerProps) {
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

  const closeDrawer = () => onOpenChange(false);

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && event.target === event.currentTarget) {
      closeDrawer();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      closeDrawer();
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
      className="fixed inset-0 z-modal bg-overlay"
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={cn(
          'fixed flex flex-col overflow-hidden border-border bg-surface shadow-md outline-none',
          placementStyles[placement],
          sizeStyles[placement][size],
          className
        )}
        role="dialog"
        tabIndex={-1}
      >
        {(title || description || actions) ? (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              {title ? (
                <h2 id={titleId} className="text-section-title">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="mt-1 text-sm leading-5 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <Button aria-label={closeLabel} onClick={closeDrawer} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button aria-label={closeLabel} className="absolute right-4 top-4 z-10" onClick={closeDrawer} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', contentClassName)}>{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
