'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

export function CourtCard({
  court,
  schedulingDisabled = false,
  disabledReason,
  onCommitRuntime,
  onRecordMatch
}: {
  court: Court;
  schedulingDisabled?: boolean;
  disabledReason?: string | null;
  onCommitRuntime?: () => Promise<boolean>;
  onRecordMatch?: (payload: MatchHistoryPayload) => Promise<void>;
}) {
  const { players, swapPairs, startMatch, endMatch, nextMatches, applyNextMatch, cancelReadyCourt } = useBadmintonStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const status = courtStatusConfig[court.status];
  const courtPlayers = court.slots
    .filter((id): id is string => Boolean(id))
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  const teamA = courtPlayers.slice(0, 2);
  const teamB = courtPlayers.slice(2, 4);
  const canAutoAssign = !schedulingDisabled && court.status === 'EMPTY' && nextMatches.length > 0;
  const canStart = !schedulingDisabled && court.status === 'READY' && court.slots.every((slot) => slot !== null);

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
    <motion.div
      className={cn(
        'group flex min-h-[11.5rem] min-w-0 flex-col rounded-xl border p-3 shadow-sm shadow-slate-950/16 backdrop-blur-sm transition-colors hover:border-cyan-300/25 dark:shadow-slate-950/20',
        status.bgClass,
        status.glowClass
      )}
      layout
      aria-label={`${court.name}, trạng thái ${status.label}`}
    >
      {/* HEADER: Court name + Status + Timer */}
      <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-bold leading-6 text-slate-50" title={court.name}>{court.name}</h3>
          {status.icon && <span className="text-base leading-none text-current opacity-80" aria-hidden="true">{status.icon}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {court.status === 'PLAYING' && court.startedAt && (
            <motion.div
              animate={prefersReducedMotion ? undefined : { opacity: [0.65, 1] }}
              transition={prefersReducedMotion ? undefined : { duration: 1, repeat: Infinity }}
              className="flex h-7 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 text-[11px] font-mono font-semibold text-emerald-100"
            >
              <Clock className="h-3 w-3" />
              {formatTime(elapsedTime)}
            </motion.div>
          )}
          <span role="status" className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]', status.badgeClass)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* PLAYERS DISPLAY */}
      {court.status === 'EMPTY' ? (
        <div className="flex min-h-[6.5rem] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/60 bg-slate-950/25 px-3 text-center">
          <div className="text-sm font-bold text-slate-300">Sân trống</div>
          <div className="mt-1 text-xs font-medium text-slate-500">Chờ xếp người chơi</div>
        </div>
      ) : (
        <div className="mb-3 grid min-h-[7rem] flex-1 grid-cols-[minmax(0,1fr)_2.25rem_minmax(0,1fr)] items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)]">
          {/* Đội A */}
          <div className="min-w-0 rounded-lg border border-white/[0.06] bg-slate-950/18 p-2">
            <PlayerTeam team={teamA} teamLabel="Đội A" />
          </div>

          {/* VS Divider */}
          <div className="flex min-w-0 flex-col items-center justify-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">VS</div>
            {court.status === 'READY' && court.slots.every((s) => s !== null) && !schedulingDisabled && (
              <motion.button
                onClick={() => {
                  swapPairs(court.id);
                  void onCommitRuntime?.();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/70 text-slate-100 shadow-[0_8px_18px_rgba(0,0,0,0.26)] transition-colors hover:border-cyan-300/35 hover:bg-slate-700/80 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                title="Đảo cặp"
                aria-label={`Đảo cặp ${court.name}`}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          {/* Đội B */}
          <div className="min-w-0 rounded-lg border border-white/[0.06] bg-slate-950/18 p-2">
            <PlayerTeam team={teamB} teamLabel="Đội B" />
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="mt-auto flex gap-2">
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
    </motion.div>
  );
}
