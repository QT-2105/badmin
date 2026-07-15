'use client';

import { useEffect, useRef, useState } from 'react';

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
  const rootRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute left-0 top-[calc(100%+6px)] z-dropdown grid w-full min-w-[150px] grid-cols-1 gap-1 rounded-lg border border-border bg-popover p-1 shadow-md">
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
