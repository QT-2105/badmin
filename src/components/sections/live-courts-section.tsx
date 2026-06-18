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
      className="min-h-0 flex flex-col gap-1.5"
    >
      {showHeader ? (
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm font-bold text-slate-100 tracking-wider">QUẢN LÝ SÂN</h2>
          <div className="text-xs text-slate-400">
            {activeCourts.length}/{allCourts.length} sân
          </div>
        </div>
      ) : null}

      {/* COURTS GRID - Responsive: 3 cols on tablet, 1 col on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-0">
        {allCourts.map((court, idx) => (
          <motion.div
            key={court.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <CourtCard
              court={court}
              schedulingDisabled={schedulingDisabled}
              disabledReason={disabledReason}
              onCommitRuntime={onCommitRuntime}
              onRecordMatch={onRecordMatch}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
