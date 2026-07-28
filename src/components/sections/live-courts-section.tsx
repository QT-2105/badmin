'use client';

import { motion } from 'framer-motion';
import { useBadmintonStore } from '@/lib/badminton-store';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import { CourtCard } from '../cards/court-card';

export function LiveCourtsSection({
  showHeader = true,
  schedulingDisabled = false,
  disabledReason,
  onCommitRuntime,
  onRecordMatch
}: {
  showHeader?: boolean;
  schedulingDisabled?: boolean;
  disabledReason?: string | null;
  onCommitRuntime?: () => Promise<boolean>;
  onRecordMatch?: (payload: MatchHistoryPayload) => Promise<void>;
}) {
  const { courts } = useBadmintonStore();

  // Filter only active courts (READY or PLAYING)
  const activeCourts = courts.filter((c) => c.status !== 'EMPTY');
  const allCourts = courts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-0 flex-col gap-2"
      aria-label="Danh sách sân trong ca"
    >
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider text-slate-100">QUẢN LÝ SÂN</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {allCourts.length} sân
            </span>
          </div>
          <div className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.08] px-2 py-0.5 text-[11px] font-medium text-emerald-100">
            {activeCourts.length}/{allCourts.length} sân
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="grid content-start items-stretch gap-2 [grid-auto-rows:1fr] [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))] md:gap-2.5 2xl:[grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]" role="list" aria-label="Các sân của ca chơi">
          {allCourts.map((court, idx) => (
            <motion.div
              key={court.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="min-w-0"
              role="listitem"
            >
              <CourtCard
                court={court}
                courtIndex={idx}
                schedulingDisabled={schedulingDisabled}
                disabledReason={disabledReason}
                onCommitRuntime={onCommitRuntime}
                onRecordMatch={onRecordMatch}
              />
            </motion.div>
          ))}
          {allCourts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-5 text-center text-xs font-medium text-slate-400">
              Chưa có sân trong ca.
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
