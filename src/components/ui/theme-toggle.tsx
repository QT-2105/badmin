'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type ThemeMode = 'dark' | 'light';

const storageKey = 'badmin_theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle({
  compact = false,
  align = 'center',
  className
}: {
  compact?: boolean;
  align?: 'center' | 'start';
  className?: string;
}) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Theme vẫn có hiệu lực cho phiên hiện tại nếu trình duyệt chặn localStorage.
    }
  }

  const Icon = theme === 'dark' ? Moon : Sun;
  const actionLabel = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={actionLabel}
      aria-label={actionLabel}
      aria-pressed={theme === 'dark'}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        align === 'start' && !compact ? 'justify-start' : 'justify-center',
        align === 'start' && !compact ? 'px-0' : '',
        compact && 'w-10 px-0',
        className
      )}
    >
      <span className={cn('grid shrink-0 place-items-center', align === 'start' && !compact ? 'h-10 w-10' : '')}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {!compact ? <span>{theme === 'dark' ? 'Tối' : 'Sáng'}</span> : null}
    </button>
  );
}
