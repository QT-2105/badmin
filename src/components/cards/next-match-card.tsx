'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Unlock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerTagBadges } from '@/components/player/player-tag-badges';
import { getDisplayPlayerName } from '@/lib/player-display';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { useBadmintonStore, type NextMatch } from '@/lib/badminton-store';
import { getLevelLabel } from '@/lib/player-labels';

export function NextMatchCard({
  match,
  replaceOpen = false,
  onReplaceOpenChange,
  onCommitRuntime
}: {
  match: NextMatch;
  replaceOpen?: boolean;
  onReplaceOpenChange?: (open: boolean) => void;
  onCommitRuntime?: () => Promise<boolean>;
}) {
  const { players, courts, nextMatches, applyNextMatch, replaceNextMatchPlayer, toggleNextMatchLock } = useBadmintonStore();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draftRoster, setDraftRoster] = useState<string[]>(match.roster);
  const [pendingReplacements, setPendingReplacements] = useState<Array<{ slotIndex: number; playerId: string }>>([]);
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);

  useEffect(() => {
    if (!replaceOpen) {
      setSelectedSlot(null);
      setDraftRoster(match.roster);
      setPendingReplacements([]);
      return;
    }

    setDraftRoster(match.roster);
    setPendingReplacements([]);
  }, [match.roster, replaceOpen]);

  const displayRoster = replaceOpen ? draftRoster : match.roster;
  const teamAIds = displayRoster.slice(0, 2);
  const teamBIds = displayRoster.slice(2, 4);
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
  const replacementPlayers = players
    .filter((pp) => (pp.status === 'WAITING' || pp.status === 'JUST_FINISHED' || pp.status === 'PRIORITY') && !displayRoster.includes(pp.id) && !usedOnCourts.has(pp.id))
    .sort((left, right) => {
      const leftSuggested = suggestedOutsideCurrentMatch.has(left.id) ? 0 : 1;
      const rightSuggested = suggestedOutsideCurrentMatch.has(right.id) ? 0 : 1;
      if (leftSuggested !== rightSuggested) return leftSuggested - rightSuggested;
      if (left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
      if (left.status !== right.status) return left.status === 'WAITING' ? -1 : 1;
      return left.name.localeCompare(right.name, 'vi');
    });
  const selectedSlotPlayer = selectedSlot !== null ? players.find((player) => player.id === draftRoster[selectedSlot]) : null;
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
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-slate-400">GỢI Ý #{match.index}</div>
              {match.locked ? <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">Đã lock</span> : null}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{targetCourt ? `Áp dụng vào ${targetCourt.name}` : 'Hết sân trống'}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                toggleNextMatchLock(match.id);
                void onCommitRuntime?.();
              }}
              className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${match.locked ? 'bg-amber-400/15 text-amber-200 hover:bg-amber-400/25' : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'}`}
              title={match.locked ? 'Bỏ lock gợi ý' : 'Lock gợi ý'}
            >
              {match.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              <span className="hidden xl:inline">{match.locked ? 'Locked' : 'Lock'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canApply) return;
                applyNextMatch(match.id, targetCourt?.id);
                void onCommitRuntime?.();
              }}
              disabled={!canApply}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500/20 px-2 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Áp dụng
            </button>
            <button
              type="button"
              onClick={() => onReplaceOpenChange?.(!replaceOpen)}
              className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-colors ${replaceOpen ? 'bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/30' : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50'}`}
            >
              <Zap className="h-3.5 w-3.5" />
              {replaceOpen ? 'Huỷ đổi' : 'Đổi người'}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-xs">
            <PairPreview label="Cặp A" players={teamA} onSelectPlayer={setQuickViewPlayer} />
            <div className="flex items-center justify-center text-[11px] font-bold text-slate-500">VS</div>
            <PairPreview label="Cặp B" players={teamB} onSelectPlayer={setQuickViewPlayer} />
          </div>
          <div className="mt-2 text-xs text-slate-400">{match.score}% • {scoreLabel}</div>
        </div>

        </div>
      </div>

      {replaceOpen && (
        <div className="border-t border-slate-700/30 bg-slate-900/50 px-3 py-3 space-y-3">
          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-white/10 bg-slate-800/30 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-300">Chọn người trong cặp cần đổi</div>
                <div className="text-[11px] text-slate-500">Bấm vào 1 người</div>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                <ReplacePairColumn label="Cặp A" slots={[0, 1]} roster={draftRoster} players={players} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
                <div className="flex items-center justify-center text-[11px] font-bold text-slate-500">VS</div>
                <ReplacePairColumn label="Cặp B" slots={[2, 3]} roster={draftRoster} players={players} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-800/30 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-300">Chọn người thay thế</div>
                <div className="text-[11px] text-slate-500">Chọn rồi lưu</div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {replacementPlayers.map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        if (selectedSlot === null) return;
                        setDraftRoster((current) => {
                          const nextRoster = [...current];
                          nextRoster[selectedSlot] = wp.id;
                          return nextRoster;
                        });
                        setPendingReplacements((current) => [...current, { slotIndex: selectedSlot, playerId: wp.id }]);
                        setSelectedSlot(null);
                      }}
                      disabled={selectedSlot === null}
                      className="w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-700/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 break-words text-xs font-medium leading-4 text-slate-100" title={wp.name}>{getDisplayPlayerName(wp.name)}</div>
                        {sourceMatchByPlayerId.has(wp.id) ? <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-200">Gợi ý #{sourceMatchByPlayerId.get(wp.id)}</span> : null}
                      </div>
                      <div className="text-xxs text-slate-400 text-[11px]">{wp.gender} • {getLevelLabel(wp.level)} • {wp.matchesPlayed} trận • {wp.status === 'JUST_FINISHED' ? 'vừa xong' : wp.status === 'PRIORITY' ? 'trong gợi ý' : 'chờ'}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
            <div className="min-w-0 text-[11px] text-slate-400">
              {selectedSlotPlayer ? `Đang chọn: ${selectedSlotPlayer.name}` : pendingReplacements.length > 0 ? `Đã đổi nháp ${pendingReplacements.length} vị trí. Bấm lưu để ghi nhận.` : 'Chọn người cần đổi, sau đó chọn người thay thế.'}
            </div>
            <button
              type="button"
              disabled={pendingReplacements.length === 0}
              onClick={() => {
                if (pendingReplacements.length === 0) return;
                pendingReplacements.forEach((replacement) => {
                  replaceNextMatchPlayer(match.id, replacement.slotIndex, replacement.playerId);
                });
                onReplaceOpenChange?.(false);
                setSelectedSlot(null);
                setPendingReplacements([]);
                void onCommitRuntime?.();
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Lưu lại
            </button>
          </div>
        </div>
      )}
      <PlayerQuickView player={quickViewPlayer} onClose={() => setQuickViewPlayer(null)} />
    </motion.div>
  );
}

function PairPreview({
  label,
  players,
  onSelectPlayer
}: {
  label: string;
  players: Array<ReturnType<typeof useBadmintonStore.getState>['players'][number] | undefined>;
  onSelectPlayer: (player: QuickViewPlayer) => void;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="grid gap-1">
        {players.map((player, index) => (
          <button
            type="button"
            key={player?.id ?? index}
            className="grid min-h-[48px] w-full min-w-0 grid-cols-[auto_1fr] items-start gap-2 rounded-md p-1 text-left transition-colors hover:bg-white/[0.04]"
            onClick={() => player && onSelectPlayer(toQuickViewPlayer(player))}
          >
            <PlayerAvatar name={player?.name ?? 'Người chơi'} gender={player?.gender} avatarUrl={player?.avatarUrl} size="xs" />
            <div className="min-w-0 flex-1">
            <p className="break-words text-xs font-medium leading-4 text-slate-200" title={player?.name}>{player ? getDisplayPlayerName(player.name) : '—'}</p>
            <p className="text-[11px] leading-4 text-slate-400">
              {player ? <><span className={player.gender === 'Nam' ? 'text-cyan-300' : 'text-pink-300'}>{player.gender}</span> • {getLevelLabel(player.level)} • {player.matchesPlayed} trận</> : '—'}
            </p>
            {player ? <PlayerTagBadges tags={player.playerTags} compact className="mt-1" /> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function toQuickViewPlayer(player: ReturnType<typeof useBadmintonStore.getState>['players'][number]): QuickViewPlayer {
  return {
    id: player.id,
    name: player.name,
    gender: player.gender,
    level: player.level,
    matchesPlayed: player.matchesPlayed,
    status: player.status,
    paymentAmount: player.money,
    discount: player.discount,
    paymentStatus: player.paymentStatus,
    paymentMethod: player.paymentType,
    note: player.note,
    avatarUrl: player.avatarUrl,
    lastCourt: player.lastCourt
  };
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
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-2">
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
              <div className="break-words text-xs font-medium leading-4 text-slate-100" title={player?.name}>{player ? getDisplayPlayerName(player.name) : 'Trống'}</div>
              <div className="text-[11px] text-slate-400">{player ? `${player.gender} • ${getLevelLabel(player.level)} • ${player.matchesPlayed} trận` : '—'}</div>
              <div className="mt-1 break-words text-[10px] leading-4 text-slate-500" title={partner?.name}>Cặp với: {partner ? getDisplayPlayerName(partner.name) : '—'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
