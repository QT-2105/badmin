'use client';

import { MoreHorizontal } from 'lucide-react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type ActionMenuAlign = 'start' | 'end';
type ActionMenuSide = 'top' | 'right' | 'bottom' | 'left';

export type ActionMenuItem = {
  key: string;
  label: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
};

export type ActionMenuProps = {
  items: ActionMenuItem[];
  trigger?: ReactNode;
  label?: string;
  align?: ActionMenuAlign;
  side?: ActionMenuSide;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
};

const sideStyles: Record<ActionMenuSide, string> = {
  top: 'bottom-full mb-2',
  right: 'left-full ml-2 top-0',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2 top-0'
};

const alignStyles: Record<ActionMenuAlign, string> = {
  start: 'left-0',
  end: 'right-0'
};

function getEnabledIndex(items: ActionMenuItem[], startIndex: number, direction: 1 | -1) {
  if (items.length === 0) {
    return -1;
  }

  for (let offset = 0; offset < items.length; offset += 1) {
    const index = (startIndex + offset * direction + items.length) % items.length;
    if (!items[index].disabled) {
      return index;
    }
  }

  return -1;
}

export function ActionMenu({
  items,
  trigger,
  label = 'Mở menu thao tác',
  align = 'end',
  side = 'bottom',
  disabled = false,
  className,
  menuClassName
}: ActionMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasEnabledItems = items.some((item) => !item.disabled);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstEnabledIndex = getEnabledIndex(items, 0, 1);
    window.requestAnimationFrame(() => {
      if (firstEnabledIndex >= 0) {
        itemRefs.current[firstEnabledIndex]?.focus();
      }
    });
  }, [items, open]);

  const closeMenu = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!disabled && hasEnabledItems) {
      setOpen((current) => !current);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const activeIndex = itemRefs.current.findIndex((element) => element === document.activeElement);
    const nextIndex = getEnabledIndex(items, activeIndex + (event.key === 'ArrowDown' ? 1 : -1), event.key === 'ArrowDown' ? 1 : -1);
    if (nextIndex >= 0) {
      itemRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <Button
        ref={triggerRef}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        disabled={disabled || !hasEnabledItems}
        className="h-10 min-w-10 px-3"
        onClick={handleTriggerClick}
        size="sm"
        variant="secondary"
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
      </Button>
      {open ? (
        <div
          className={cn(
            'motion-feedback-in absolute z-dropdown min-w-44 overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-sm motion-reduce:animate-none',
            sideStyles[side],
            side === 'top' || side === 'bottom' ? alignStyles[align] : '',
            menuClassName
          )}
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                className={cn(
                  'flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium outline-none transition-colors focus-visible:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
                  item.danger ? 'text-danger hover:bg-danger-soft' : 'text-foreground hover:bg-surface-hover'
                )}
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect();
                  closeMenu(true);
                }}
                role="menuitem"
                type="button"
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="min-w-0 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
