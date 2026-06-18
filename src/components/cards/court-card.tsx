'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Clock, Play, Square, Users, X } from 'lucide-react';
import { useBadmintonStore, type Court } from '@/lib/badminton-store';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import { cn } from '@/lib/utils';
import { PlayerTeam } from './player-team';

const courtStatusConfig = {
  EMPTY: { label: 'TRỐNG', bgClass: 'bg-slate-800/40', textClass: 'text-slate-300', glowClass: '', icon: null },
  READY: { label: 'CHỜ XẾP', bgClass: 'bg-amber-500/15', textClass: 'text-amber-200', glowClass: 'ring-1 ring-amber-400/30', icon: '◆' },
  PLAYING: { label: 'ĐANG CHƠI', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-200', glowClass: 'ring-1 ring-emerald-400/30 shadow-lg shadow-emerald-500/10', icon: '●' }
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
        'rounded-xl p-2.5 backdrop-blur-sm border border-slate-700/40 transition-all hover:border-slate-600/60',
        status.bgClass,
        status.glowClass
      )}
      layout
    >
      {/* HEADER: Court name + Status + Timer */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-slate-100">{court.name}</h3>
          {status.icon && <span className={cn('text-lg', status.textClass)}>{status.icon}</span>}
        </div>
        <div className="flex items-center gap-2">
          {court.status === 'PLAYING' && court.startedAt && (
            <motion.div
              animate={{ opacity: [0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1 text-xs font-mono text-emerald-300"
            >
              <Clock className="w-3 h-3" />
              {formatTime(elapsedTime)}
            </motion.div>
          )}
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', status.bgClass, status.textClass)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* PLAYERS DISPLAY */}
      {court.status === 'EMPTY' ? (
        <div className="h-16 flex items-center justify-center text-slate-400 text-xs">Chờ xếp người chơi</div>
      ) : (
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Đội A */}
          <div className="flex-1">
            <PlayerTeam team={teamA} teamLabel="Đội A" />
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center gap-2 min-w-[44px]">
            <div className="text-[10px] font-bold text-slate-400">VS</div>
            {court.status === 'READY' && court.slots.every((s) => s !== null) && !schedulingDisabled && (
              <motion.button
                onClick={() => {
                  swapPairs(court.id);
                  void onCommitRuntime?.();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-7 w-7 rounded-full border border-slate-600/40 bg-slate-800/40 hover:bg-slate-700/60 text-slate-200 hover:text-slate-100 shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-colors flex items-center justify-center"
                title="Đảo cặp"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </motion.button>
            )}
          </div>

          {/* Đội B */}
          <div className="flex-1">
            <PlayerTeam team={teamB} teamLabel="Đội B" />
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2">
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
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-cyan-100 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4" />
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
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 hover:text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
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
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
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
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4" />
            Kết thúc
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
