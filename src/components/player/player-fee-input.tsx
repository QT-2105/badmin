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
        className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none disabled:text-slate-500"
      />
      {open && !disabled ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 grid w-full min-w-[150px] grid-cols-1 gap-1 rounded-lg border border-white/10 bg-slate-950 p-1 shadow-xl shadow-black/30">
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
                    ? 'bg-cyan-300 text-slate-950'
                    : 'bg-white/[0.03] text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-100'
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
