'use client';

import { X } from 'lucide-react';
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

import { Button, IconButton } from './button';

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
  closeDisabled?: boolean;
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
  closeDisabled = false,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) {
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
  }, [initialFocusRef, mounted, open, returnFocusRef]);

  if (!open || !mounted) {
    return null;
  }

  const closeDialog = () => {
    if (closeDisabled) {
      return;
    }
    onOpenChange(false);
  };

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

  return createPortal(
    <div
      className="motion-overlay-in fixed inset-0 z-modal flex items-center justify-center bg-overlay p-3 motion-reduce:animate-none sm:p-4"
      onKeyDown={handleKeyDown}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          'motion-dialog-in max-h-[calc(100dvh-1.5rem)] w-full overflow-hidden rounded-xl border bg-surface shadow-md outline-none motion-reduce:animate-none sm:max-h-[calc(100vh-2rem)]',
          sizeStyles[size],
          toneStyles[tone],
          className
        )}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
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
          <IconButton
            className="h-10 w-10 shrink-0"
            icon={<X className="h-4 w-4" />}
            label={closeLabel}
            onClick={closeDialog}
            disabled={closeDisabled}
            size="sm"
            variant="ghost"
          />
        </div>
        {children ? <div className={cn('max-h-[calc(100dvh-11rem)] min-w-0 overflow-y-auto px-4 py-3 sm:max-h-[calc(100vh-13rem)] sm:px-5 sm:py-4', contentClassName)}>{children}</div> : null}
        {footer ? <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-5 sm:py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export type ConfirmationDialogProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  tone?: DialogTone;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isLoading) {
          onCancel();
        }
      }}
      title={title}
      description={description}
      tone={tone}
      size="sm"
      closeDisabled={isLoading}
      closeOnEscape={!isLoading}
      closeOnOutsideClick={!isLoading}
      footer={(
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => void onConfirm()} loading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      )}
    />
  );
}
