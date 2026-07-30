'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export const PLAYER_FEE_OPTIONS = [60000, 65000, 70000, 75000, 80000];

export function PlayerFeeInput({
  value,
  onChange,
  disabled = false,
  className
}: {
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function selectFee(fee: number) {
    onChange(String(fee));
    setOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    function updatePlacement() {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;

      const gap = 6;
      const viewportPadding = 8;
      const rootRect = root.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const spaceBelow = window.innerHeight - rootRect.bottom - gap - viewportPadding;
      const spaceAbove = rootRect.top - gap - viewportPadding;
      const nextPlacement = spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

      setPlacement((current) => current === nextPlacement ? current : nextPlacement);
    }

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative mt-1', className)}>
      <input
        type="number"
        min={0}
        step={1000}
        value={value}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition hover:border-inputHover focus:border-focus focus:ring-2 focus:ring-focus/15 disabled:bg-surface-subtle disabled:text-text-disabled"
      />
      {open && !disabled ? (
        <div
          ref={menuRef}
          className={cn(
            'absolute left-0 z-dropdown grid max-h-[min(14rem,calc(100vh-1rem))] w-full min-w-[150px] grid-cols-1 gap-1 overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 shadow-md',
            placement === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          )}
        >
          {PLAYER_FEE_OPTIONS.map((fee) => {
            const active = String(fee) === String(value);
            return (
              <button
                key={fee}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectFee(fee);
                }}
                onClick={() => {
                  selectFee(fee);
                }}
                className={cn(
                  'flex h-9 items-center justify-between rounded-md px-3 text-sm font-semibold transition',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-subtle text-foreground hover:bg-primary-soft hover:text-primary'
                )}
              >
                <span>{fee.toLocaleString('vi-VN')}đ</span>
                <span className="text-xs opacity-70">{fee / 1000}k</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
