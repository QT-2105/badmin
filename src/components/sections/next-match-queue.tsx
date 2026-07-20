'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useState } from 'react';
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
  const [activeReplaceMatchId, setActiveReplaceMatchId] = useState<string | null>(null);
  const emptyCourts = courts.filter((c) => c.status === 'EMPTY');
  const canAutoAssign = !schedulingDisabled && emptyCourts.length > 0 && nextMatches.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-0 flex-col gap-2"
      aria-label="Khu vực trận tiếp theo"
    >
      {/* SECTION HEADER */}
      {showHeader ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider text-slate-100">TRẬN TIẾP THEO</h2>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {nextMatches.length} gợi ý
            </span>
          </div>
          <motion.button
            onClick={() => {
              if (schedulingDisabled) return;
              refreshNextMatches();
              void onCommitRuntime?.();
            }}
            disabled={schedulingDisabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Auto xếp cặp"
            aria-label="Auto xếp cặp trận tiếp theo"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 transition-colors hover:border-cyan-200/35 hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
          >
            <Zap className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      ) : null}

      {/* MATCHES LIST */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1" role="list" aria-label="Danh sách gợi ý trận tiếp theo">
        {schedulingDisabled && disabledReason ? (
          <div className="rounded-xl border border-amber-300/25 bg-amber-400/[0.12] p-3 text-sm font-medium text-amber-100">
            {disabledReason}
          </div>
        ) : null}
        {!schedulingDisabled && nextMatches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            role="listitem"
          >
            <NextMatchCard
              match={match}
              replaceOpen={activeReplaceMatchId === match.id}
              onReplaceOpenChange={(open) => setActiveReplaceMatchId(open ? match.id : null)}
              onCommitRuntime={onCommitRuntime}
            />
          </motion.div>
        ))}
        {!schedulingDisabled && nextMatches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-3 py-6 text-center text-sm font-medium text-slate-500">
            Chưa có gợi ý trận tiếp theo.
          </div>
        ) : null}
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
        aria-label="Xếp gợi ý đầu tiên vào sân trống"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-300/25 bg-gradient-to-r from-violet-400/15 to-cyan-400/15 px-3 py-2 text-sm font-bold text-slate-100 transition-colors hover:from-violet-400/25 hover:to-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:from-slate-800/45 disabled:to-slate-800/45 disabled:text-slate-500"
      >
        <Zap className="h-3.5 w-3.5" />
        Xếp vào sân trống
      </motion.button>
    </motion.div>
  );
}
