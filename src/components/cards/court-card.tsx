'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Clock, Play, Square, Users, X } from 'lucide-react';
import { useBadmintonStore, type Court } from '@/lib/badminton-store';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import { cn } from '@/lib/utils';
import { PlayerTeam } from './player-team';

const courtStatusConfig = {
  EMPTY: { label: 'TRỐNG', bgClass: 'border-slate-700/55 bg-slate-900/38', badgeClass: 'border-slate-600/50 bg-slate-800/70 text-slate-200', glowClass: '', icon: null },
  READY: { label: 'CHỜ XẾP', bgClass: 'border-amber-300/28 bg-amber-950/16', badgeClass: 'border-amber-300/30 bg-amber-400/15 text-amber-100', glowClass: 'ring-1 ring-amber-300/18', icon: '◆' },
  PLAYING: { label: 'ĐANG CHƠI', bgClass: 'border-emerald-300/30 bg-emerald-950/16', badgeClass: 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100', glowClass: 'ring-1 ring-emerald-300/24', icon: '●' }
};

const courtSurfaceThemes = {
  green: {
    surfaceClass:
      'border-emerald-300/30 bg-[linear-gradient(135deg,rgba(6,78,59,0.58),rgba(6,95,70,0.25)_52%,rgba(2,44,34,0.54))] hover:border-emerald-100/45',
    washClass: 'from-emerald-200/[0.10] via-transparent to-emerald-950/[0.16]',
    lineClass: 'border-emerald-50/42',
    lineBgClass: 'bg-emerald-50/36',
    netClass: 'bg-emerald-50/55',
    labelClass: 'text-emerald-100'
  },
  blue: {
    surfaceClass:
      'border-cyan-300/30 bg-[linear-gradient(135deg,rgba(8,47,73,0.60),rgba(14,116,144,0.28)_52%,rgba(12,74,110,0.54))] hover:border-cyan-100/45',
    washClass: 'from-cyan-200/[0.10] via-transparent to-sky-950/[0.16]',
    lineClass: 'border-cyan-50/42',
    lineBgClass: 'bg-cyan-50/36',
    netClass: 'bg-cyan-50/55',
    labelClass: 'text-cyan-100'
  }
};

function getCourtNumber(court: Court, courtIndex: number): number {
  const nameMatch = court.name.match(/\d+/);
  if (nameMatch) return Number(nameMatch[0]);

  const idMatch = court.id.match(/\d+/);
  if (idMatch) return Number(idMatch[0]);

  return courtIndex + 1;
}

export function CourtCard({
  court,
  courtIndex = 0,
  schedulingDisabled = false,
  disabledReason,
  onCommitRuntime,
  onRecordMatch
}: {
  court: Court;
  courtIndex?: number;
  schedulingDisabled?: boolean;
  disabledReason?: string | null;
  onCommitRuntime?: () => Promise<boolean>;
  onRecordMatch?: (payload: MatchHistoryPayload) => Promise<void>;
}) {
  const players = useBadmintonStore((state) => state.players);
  const swapPairs = useBadmintonStore((state) => state.swapPairs);
  const startMatch = useBadmintonStore((state) => state.startMatch);
  const endMatch = useBadmintonStore((state) => state.endMatch);
  const nextMatches = useBadmintonStore((state) => state.nextMatches);
  const applyNextMatch = useBadmintonStore((state) => state.applyNextMatch);
  const cancelReadyCourt = useBadmintonStore((state) => state.cancelReadyCourt);
  const [elapsedTime, setElapsedTime] = useState(0);

  const status = courtStatusConfig[court.status];
  const courtPlayers = court.slots
    .filter((id): id is string => Boolean(id))
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  const teamA = courtPlayers.slice(0, 2);
  const teamB = courtPlayers.slice(2, 4);
  const canAutoAssign = !schedulingDisabled && court.status === 'EMPTY' && nextMatches.length > 0;
  const canStart = !schedulingDisabled && court.status === 'READY' && court.slots.every((slot) => slot !== null);
  const courtNumber = getCourtNumber(court, courtIndex);
  const courtTheme = courtSurfaceThemes[courtNumber % 2 === 1 ? 'green' : 'blue'];

  // Track elapsed time during play
  useEffect(() => {
    if (court.status !== 'PLAYING' || !court.startedAt) {
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - court.startedAt!) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [court.status, court.startedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  function buildMatchHistoryPayload(): MatchHistoryPayload | null {
    const roster = court.slots
      .filter((id): id is string => Boolean(id))
      .map((id) => players.find((player) => player.id === id))
      .filter((player): player is NonNullable<typeof player> => Boolean(player));

    if (roster.length !== 4) return null;
    const endedAt = Date.now();
    const courtNumberMatch = court.name.match(/\d+/);

    return {
      courtNumber: courtNumberMatch ? Number(courtNumberMatch[0]) : Number(court.id.replace(/\D/g, '') || 0),
      courtName: court.name,
      startedAt: court.startedAt ? new Date(court.startedAt).toISOString() : null,
      endedAt: new Date(endedAt).toISOString(),
      durationSeconds: court.startedAt ? Math.max(0, Math.floor((endedAt - court.startedAt) / 1000)) : null,
      teamA: roster.slice(0, 2).map((player) => ({ playerId: player.id, playerName: player.name })),
      teamB: roster.slice(2, 4).map((player) => ({ playerId: player.id, playerName: player.name }))
    };
  }

  return (
    <div
      className={cn(
        'group relative isolate flex h-full min-h-[11.5rem] min-w-0 flex-col overflow-hidden rounded-xl border p-3 shadow-sm shadow-slate-950/16 backdrop-blur-sm transition-colors dark:shadow-slate-950/20',
        courtTheme.surfaceClass,
        status.bgClass,
        status.glowClass
      )}
      aria-label={`${court.name}, trạng thái ${status.label}`}
    >
      <div className={cn('pointer-events-none absolute inset-0 z-0 bg-gradient-to-br', courtTheme.washClass)} aria-hidden="true" />
      {/* HEADER: Court name + Status + Timer */}
      <div className="relative z-10 mb-2.5 flex items-start justify-between gap-2 border-b border-white/[0.10] pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className={cn('truncate text-base font-bold leading-6', courtTheme.labelClass)} title={court.name}>{court.name}</h3>
          {status.icon && <span className="text-base leading-none text-current opacity-80" aria-hidden="true">{status.icon}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {court.status === 'PLAYING' && court.startedAt && (
            <div
              className="flex h-7 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 text-[11px] font-mono font-semibold text-emerald-100"
            >
              <Clock className="h-3 w-3" />
              {formatTime(elapsedTime)}
            </div>
          )}
          <span role="status" className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]', status.badgeClass)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* PLAYERS DISPLAY */}
      {court.status === 'EMPTY' ? (
        <div className="relative z-10 flex min-h-[7rem] flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-white/25 bg-slate-950/20 px-3 text-center">
          <CourtFieldLines courtTheme={courtTheme} />
          <div className="text-sm font-bold text-slate-300">Sân trống</div>
          <div className="mt-1 text-xs font-medium text-slate-500">Chờ xếp người chơi</div>
        </div>
      ) : (
        <div className="relative z-10 mb-3 min-h-[7rem] flex-1 overflow-hidden rounded-lg border-2 border-white/25 bg-slate-950/18 p-2">
          <CourtFieldLines courtTheme={courtTheme} />
          <div className="relative z-10 grid h-full min-h-[7rem] grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]">
            {/* Đội A */}
            <div className="min-w-0 rounded-lg bg-slate-950/10 p-2">
              <PlayerTeam team={teamA} teamLabel="Đội A" />
            </div>

            {/* VS Divider */}
            <div className="flex min-w-0 flex-col items-center justify-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">VS</div>
              {court.status === 'READY' && court.slots.every((s) => s !== null) && !schedulingDisabled && (
                <motion.button
                  onClick={() => {
                    swapPairs(court.id);
                    void onCommitRuntime?.();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-500/60 bg-slate-900/80 text-slate-100 shadow-[0_8px_18px_rgba(0,0,0,0.26)] transition-colors hover:border-cyan-300/45 hover:bg-slate-800/90 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                  title="Đảo cặp"
                  aria-label={`Đảo cặp ${court.name}`}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Đội B */}
            <div className="min-w-0 rounded-lg bg-slate-950/10 p-2">
              <PlayerTeam team={teamB} teamLabel="Đội B" />
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="relative z-10 mt-auto flex gap-2">
        {court.status === 'EMPTY' && (
          <motion.button
            onClick={() => {
              if (!canAutoAssign) return;
              applyNextMatch(nextMatches[0].id, court.id);
              void onCommitRuntime?.();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!canAutoAssign}
            title={disabledReason || undefined}
            aria-label={`Xếp gợi ý tiếp theo vào ${court.name}`}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/15 px-3 py-2 text-xs font-bold text-cyan-100 transition-colors hover:border-cyan-200/35 hover:bg-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
          >
            <Users className="h-4 w-4" />
            Xếp vào
          </motion.button>
        )}

        {court.status === 'READY' && (
          <>
            <motion.button
              onClick={() => {
                cancelReadyCourt(court.id);
                void onCommitRuntime?.();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={schedulingDisabled}
              title={disabledReason || undefined}
              aria-label={`Hủy cặp đang chờ trên ${court.name}`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-600/45 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-100 transition-colors hover:border-slate-500/70 hover:bg-slate-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/35 disabled:text-slate-500"
            >
              <X className="h-4 w-4" />
              Hủy
            </motion.button>
            <motion.button
              onClick={() => {
                startMatch(court.id);
                void onCommitRuntime?.();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canStart}
              title={disabledReason || undefined}
              aria-label={`Bắt đầu trận trên ${court.name}`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-100 transition-colors hover:border-emerald-200/35 hover:bg-emerald-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/35 disabled:text-slate-500"
            >
              <Play className="h-4 w-4" />
              Bắt đầu
            </motion.button>
          </>
        )}

        {court.status === 'PLAYING' && (
          <motion.button
            onClick={() => {
              if (schedulingDisabled) return;
              const historyPayload = buildMatchHistoryPayload();
              endMatch(court.id);
              void (async () => {
                await onCommitRuntime?.();
                if (historyPayload) {
                  await onRecordMatch?.(historyPayload);
                }
              })();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={schedulingDisabled}
            title={disabledReason || undefined}
            aria-label={`Kết thúc trận trên ${court.name}`}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-300/20 bg-rose-400/15 px-3 py-2 text-xs font-bold text-rose-100 transition-colors hover:border-rose-200/35 hover:bg-rose-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/35 disabled:text-slate-500"
          >
            <Square className="h-4 w-4" />
            Kết thúc
          </motion.button>
        )}
      </div>
    </div>
  );
}

function CourtFieldLines({ courtTheme }: { courtTheme: (typeof courtSurfaceThemes)[keyof typeof courtSurfaceThemes] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-90" aria-hidden="true">
      <div className={cn('absolute inset-0 rounded-lg border-2', courtTheme.lineClass)} />

      <div className="absolute left-[calc(50%-1.5rem)] top-0 h-full w-12 bg-slate-950/10 sm:left-[calc(50%-1.75rem)] sm:w-14" />
      <div className={cn('absolute left-[calc(50%-1.5rem)] top-0 h-full w-px sm:left-[calc(50%-1.75rem)]', courtTheme.netClass)} />
      <div className={cn('absolute left-[calc(50%+1.5rem)] top-0 h-full w-px sm:left-[calc(50%+1.75rem)]', courtTheme.netClass)} />

      <div className={cn('absolute left-0 right-[calc(50%+1.5rem)] top-1/2 h-px -translate-y-1/2 sm:right-[calc(50%+1.75rem)]', courtTheme.lineBgClass)} />
      <div className={cn('absolute left-[calc(50%+1.5rem)] right-0 top-1/2 h-px -translate-y-1/2 sm:left-[calc(50%+1.75rem)]', courtTheme.lineBgClass)} />
    </div>
  );
}
