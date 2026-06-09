'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { useState } from 'react';
import { useBadmintonStore, NextMatch } from '@/lib/badminton-store';
import { getLevelLabel } from '@/lib/player-labels';

export function NextMatchCard({ match, onCommitRuntime }: { match: NextMatch; onCommitRuntime?: () => Promise<boolean> }) {
  const { players, courts, nextMatches, applyNextMatch, replaceNextMatchPlayer } = useBadmintonStore();
  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const teamAIds = match.roster.slice(0, 2);
  const teamBIds = match.roster.slice(2, 4);
  const teamA = teamAIds.map((id) => players.find((p) => p.id === id));
  const teamB = teamBIds.map((id) => players.find((p) => p.id === id));

  const emptyCourts = courts.filter((c) => c.status === 'EMPTY');
  const targetCourt = emptyCourts[0] ?? null;
  const canApply = Boolean(targetCourt);
  const usedOnCourts = new Set(courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
  const suggestedOutsideCurrentMatch = new Set(nextMatches.flatMap((item) => item.id === match.id ? [] : item.roster));
  const sourceMatchByPlayerId = new Map<string, number>();
  nextMatches.forEach((item) => {
    if (item.id === match.id) return;
    item.roster.forEach((playerId) => sourceMatchByPlayerId.set(playerId, item.index));
  });
  const scoreLabel =
    match.score >= 90
      ? '🟢 Xuất sắc'
      : match.score >= 75
        ? '🟡 Tốt'
        : match.score >= 60
          ? '🟠 Bình thường'
          : '🔴 Kém';

  return (
    <motion.div className="rounded-xl border border-slate-700/30 bg-slate-800/40 backdrop-blur-sm overflow-hidden hover:border-slate-600/50 transition-colors">
      <div className="p-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-400">GỢI Ý #{match.index}</div>
            <div className="text-[11px] text-slate-400">{targetCourt ? `Áp dụng vào ${targetCourt.name}` : 'Hết sân trống'}</div>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-xs">
            <PairPreview label="Cặp A" players={teamA} />
            <div className="flex items-center justify-center text-[11px] font-bold text-slate-500">VS</div>
            <PairPreview label="Cặp B" players={teamB} />
          </div>
          <div className="mt-2 text-xs text-slate-400">{match.score}% • {scoreLabel}</div>
        </div>

        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => {
              if (!canApply) return;
              applyNextMatch(match.id, targetCourt?.id);
              void onCommitRuntime?.();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!canApply}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" />
            Áp dụng
          </motion.button>
          <motion.button
            onClick={() => {
              setReplaceMode((s) => !s);
              setSelectedSlot(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1 ${replaceMode ? 'ring-1 ring-cyan-400/30' : ''}`}
          >
            <Zap className="w-3 h-3" />
            {replaceMode ? 'Huỷ đổi' : 'Đổi người'}
          </motion.button>
        </div>
      </div>

      {replaceMode && (
        <div className="border-t border-slate-700/30 bg-slate-900/50 px-3 py-3 space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
            <div className="rounded-xl border border-white/10 bg-slate-800/30 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-300">Chọn người trong cặp cần đổi</div>
                <div className="text-[11px] text-slate-500">Bấm vào 1 người</div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                <ReplacePairColumn label="Cặp A" slots={[0, 1]} roster={match.roster} players={players} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                <div className="flex items-center justify-center text-[11px] font-bold text-slate-500">VS</div>
                <ReplacePairColumn label="Cặp B" slots={[2, 3]} roster={match.roster} players={players} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-800/30 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-300">Chọn người thay thế</div>
                <div className="text-[11px] text-slate-500">Chờ, vừa xong, gợi ý khác</div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {players
                  .filter((pp) => (pp.status === 'WAITING' || pp.status === 'JUST_FINISHED' || pp.status === 'PRIORITY') && !match.roster.includes(pp.id) && !usedOnCourts.has(pp.id))
                  .sort((left, right) => {
                    const leftSuggested = suggestedOutsideCurrentMatch.has(left.id) ? 0 : 1;
                    const rightSuggested = suggestedOutsideCurrentMatch.has(right.id) ? 0 : 1;
                    if (leftSuggested !== rightSuggested) return leftSuggested - rightSuggested;
                    if (left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
                    if (left.status !== right.status) return left.status === 'WAITING' ? -1 : 1;
                    return left.name.localeCompare(right.name, 'vi');
                  })
                  .map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        if (selectedSlot === null) return;
                        replaceNextMatchPlayer(match.id, selectedSlot, wp.id);
                        setReplaceMode(false);
                        setSelectedSlot(null);
                        void onCommitRuntime?.();
                      }}
                      disabled={selectedSlot === null}
                      className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-700/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-xs font-medium text-slate-100">{wp.name}</div>
                        {sourceMatchByPlayerId.has(wp.id) ? <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-200">Gợi ý #{sourceMatchByPlayerId.get(wp.id)}</span> : null}
                      </div>
                      <div className="text-xxs text-slate-400 text-[11px]">{wp.gender} • {getLevelLabel(wp.level)} • {wp.matchesPlayed} trận • {wp.status === 'JUST_FINISHED' ? 'vừa xong' : wp.status === 'PRIORITY' ? 'trong gợi ý' : 'chờ'}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PairPreview({ label, players }: { label: string; players: Array<ReturnType<typeof useBadmintonStore.getState>['players'][number] | undefined> }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="space-y-1">
        {players.map((player, index) => (
          <div key={player?.id ?? index} className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">{player?.name ?? '—'}</p>
            <p className="text-[11px] text-slate-400">
              {player ? <><span className={player.gender === 'Nam' ? 'text-cyan-300' : 'text-pink-300'}>{player.gender}</span> • {getLevelLabel(player.level)} • {player.matchesPlayed} trận</> : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplacePairColumn({
  label,
  slots,
  roster,
  players,
  selectedSlot,
  onSelect
}: {
  label: string;
  slots: number[];
  roster: string[];
  players: ReturnType<typeof useBadmintonStore.getState>['players'];
  selectedSlot: number | null;
  onSelect: (slot: number) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="space-y-1.5">
        {slots.map((slot) => {
          const player = players.find((item) => item.id === roster[slot]);
          const partnerSlot = slots.find((item) => item !== slot);
          const partner = players.find((item) => item.id === roster[partnerSlot ?? -1]);
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className={`w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-700/40 ${selectedSlot === slot ? 'bg-cyan-400/10 ring-1 ring-cyan-400/40' : 'bg-slate-900/30'}`}
            >
              <div className="truncate text-xs font-medium text-slate-100">{player?.name ?? 'Trống'}</div>
              <div className="text-[11px] text-slate-400">{player ? `${player.gender} • ${getLevelLabel(player.level)} • ${player.matchesPlayed} trận` : '—'}</div>
              <div className="mt-1 truncate text-[10px] text-slate-500">Cặp với: {partner?.name ?? '—'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
