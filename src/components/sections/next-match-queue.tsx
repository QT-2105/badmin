'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useBadmintonStore } from '@/lib/badminton-store';
import { NextMatchCard } from '../cards/next-match-card';

export function NextMatchQueue({
  showHeader = true,
  schedulingDisabled = false,
  disabledReason,
  onCommitRuntime
}: {
  showHeader?: boolean;
  schedulingDisabled?: boolean;
  disabledReason?: string | null;
  onCommitRuntime?: () => Promise<boolean>;
}) {
  const { nextMatches, courts, refreshNextMatches, applyNextMatch } = useBadmintonStore();
  const emptyCourts = courts.filter((c) => c.status === 'EMPTY');
  const canAutoAssign = !schedulingDisabled && emptyCourts.length > 0 && nextMatches.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col gap-2"
    >
      {/* SECTION HEADER */}
      {showHeader ? (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-100 tracking-wider">TRẬN TIẾP THEO</h2>
          <motion.button
            onClick={() => {
              if (schedulingDisabled) return;
              refreshNextMatches();
              void onCommitRuntime?.();
            }}
            disabled={schedulingDisabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Làm mới danh sách"
            className="p-1 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      ) : null}

      {/* MATCHES LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {schedulingDisabled && disabledReason ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            {disabledReason}
          </div>
        ) : null}
        {!schedulingDisabled && nextMatches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <NextMatchCard match={match} onCommitRuntime={onCommitRuntime} />
          </motion.div>
        ))}
      </div>

      {/* AUTO MATCHMAKING BUTTON */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!canAutoAssign) return;
          applyNextMatch(nextMatches[0].id);
          void onCommitRuntime?.();
        }}
        disabled={!canAutoAssign}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 border border-violet-400/30 text-slate-100 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className="w-3.5 h-3.5" />
        Tự động xếp
      </motion.button>
    </motion.div>
  );
}
