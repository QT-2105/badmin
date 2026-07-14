'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export function FullscreenToggle({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled));
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function toggleFullscreen() {
    if (!supported) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  }

  const Icon = isFullscreen ? Minimize2 : Maximize2;
  const label = isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình';

  return (
    <button
      type="button"
      onClick={() => void toggleFullscreen()}
      disabled={!supported}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
        compact && 'w-10 px-0',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {!compact ? <span>{label}</span> : null}
    </button>
  );
}
