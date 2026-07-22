'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type ThemeMode = 'dark' | 'light';

const storageKey = 'badmin_theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
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
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        compact && 'w-10 px-0',
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {!compact ? <span>{theme === 'dark' ? 'Tối' : 'Sáng'}</span> : null}
    </button>
  );
}
