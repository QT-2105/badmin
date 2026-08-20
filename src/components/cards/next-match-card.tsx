'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Unlock, Zap } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerTagBadges } from '@/components/player/player-tag-badges';
import { getDisplayPlayerName } from '@/lib/player-display';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { useBadmintonStore, type NextMatch } from '@/lib/badminton-store';
import { getLevelLabel } from '@/lib/player-labels';
import { isPlayerEligibleForReplacement } from '@/lib/runtime-eligibility';
import { getRuntimeValidationMessage } from '@/lib/runtime-roster-validation';

type ExplainableNextMatch = NextMatch & {
  matchFormat?: 'AUTO' | 'MEN' | 'WOMEN' | 'MIXED';
  qualityTier?: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'REVIEW';
  reasonCodes?: string[];
  warningCodes?: string[];
  validity?: 'VALID' | 'WARNING' | 'STALE';
  manualEdited?: boolean;
};

export function NextMatchCard({
  match,
  replaceOpen = false,
  onReplaceOpenChange,
  onCommitRuntime
}: {
  match: ExplainableNextMatch;
  replaceOpen?: boolean;
  onReplaceOpenChange?: (open: boolean) => void;
  onCommitRuntime?: () => Promise<boolean>;
}) {
  const players = useBadmintonStore((state) => state.players);
  const courts = useBadmintonStore((state) => state.courts);
  const nextMatches = useBadmintonStore((state) => state.nextMatches);
  const applyNextMatch = useBadmintonStore((state) => state.applyNextMatch);
  const replaceNextMatchRoster = useBadmintonStore((state) => state.replaceNextMatchRoster);
  const toggleNextMatchLock = useBadmintonStore((state) => state.toggleNextMatchLock);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draftRoster, setDraftRoster] = useState<string[]>(match.roster);
  const [pendingReplacements, setPendingReplacements] = useState<Array<{ slotIndex: number; playerId: string; originalPlayerId: string }>>([]);
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const replacePanelId = useId();

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
  const usedOnCourts = new Set(courts.flatMap((court) => court.slots).filter((id): id is string => Boolean(id)));
  const rosterPlayers = match.roster.map((playerId) => players.find((player) => player.id === playerId));
  const hasInvalidRosterPlayer = match.roster.length !== 4
    || new Set(match.roster).size !== 4
    || rosterPlayers.some((player) => !player || !isPlayerEligibleForReplacement(player));
  const hasCourtConflict = match.roster.some((playerId) => usedOnCourts.has(playerId));
  const isStale = match.validity === 'STALE' || hasInvalidRosterPlayer || hasCourtConflict;
  const canApply = Boolean(targetCourt) && !isStale;
  const suggestedOutsideCurrentMatch = new Set(nextMatches.flatMap((item) => item.id === match.id ? [] : item.roster));
  const sourceMatchByPlayerId = new Map<string, number>();
  nextMatches.forEach((item) => {
    if (item.id === match.id) return;
    item.roster.forEach((playerId) => sourceMatchByPlayerId.set(playerId, item.index));
  });
  const replacementPlayers = players
    .filter((pp) => isPlayerEligibleForReplacement(pp) && !displayRoster.includes(pp.id) && !usedOnCourts.has(pp.id))
    .sort((left, right) => {
      const leftSuggested = suggestedOutsideCurrentMatch.has(left.id) ? 0 : 1;
      const rightSuggested = suggestedOutsideCurrentMatch.has(right.id) ? 0 : 1;
      if (leftSuggested !== rightSuggested) return leftSuggested - rightSuggested;
      if (left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
      if (left.status !== right.status) return left.status === 'WAITING' ? -1 : 1;
      return left.name.localeCompare(right.name, 'vi');
    });
  const warningLabels = getWarningLabels(match, rosterPlayers, isStale);
  return (
    <motion.div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/52 shadow-sm shadow-slate-950/16 backdrop-blur-sm transition-colors hover:border-cyan-300/25" aria-label={`Gợi ý trận ${match.index}`}>
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] font-black uppercase tracking-[0.10em] text-slate-300">Gợi ý #{match.index} · {getMatchFormatLabel(match, rosterPlayers)}</div>
              {isStale ? <span className="rounded-full border border-rose-300/25 bg-rose-400/15 px-1.5 py-0 text-[9px] font-bold text-rose-100">Cần kiểm tra</span> : null}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">{targetCourt ? `Áp dụng vào ${targetCourt.name}` : 'Hết sân trống'}</div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                toggleNextMatchLock(match.id);
                void onCommitRuntime?.();
              }}
              className={`inline-flex h-8 items-center gap-1 rounded-md border px-1.5 text-[9px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${match.locked ? 'border-amber-300/30 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/25 hover:bg-white/[0.08] hover:text-white'}`}
              title={match.locked ? 'Bỏ Lock gợi ý' : 'Lock gợi ý khi Auto gợi ý'}
              aria-pressed={match.locked}
              aria-label={match.locked ? `Bỏ giữ gợi ý ${match.index}` : `Giữ gợi ý ${match.index}`}
            >
              {match.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              <span>Lock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canApply) return;
                const result = applyNextMatch(match.id, targetCourt?.id);
                if (!result.changed) {
                  setActionError(getRuntimeValidationMessage(result));
                  return;
                }
                setActionError(null);
                void onCommitRuntime?.();
              }}
              disabled={!canApply}
              title={isStale ? 'Gợi ý không còn hợp lệ. Hãy đổi người hoặc tạo lại.' : !targetCourt ? 'Không còn sân trống.' : undefined}
              aria-label={`Áp dụng gợi ý ${match.index}${targetCourt ? ` vào ${targetCourt.name}` : ''}`}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300/20 bg-emerald-400/15 px-1.5 text-[9px] font-bold text-emerald-100 transition-colors hover:border-emerald-200/35 hover:bg-emerald-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
            >
              <Check className="h-3 w-3" />
              Áp dụng
            </button>
            <button
              type="button"
              onClick={() => onReplaceOpenChange?.(!replaceOpen)}
              aria-expanded={replaceOpen}
              aria-controls={replacePanelId}
              aria-label={replaceOpen ? `Hủy đổi người gợi ý ${match.index}` : `Mở đổi người gợi ý ${match.index}`}
              className={`inline-flex h-8 items-center gap-1 rounded-md border px-1.5 text-[9px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${replaceOpen ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/25 hover:bg-white/[0.08] hover:text-white'}`}
            >
              <Zap className="h-3 w-3" />
              {replaceOpen ? 'Huỷ đổi' : 'Đổi người'}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)] items-stretch gap-1.5 text-xs">
            <PairPreview label="Cặp A" players={teamA} onSelectPlayer={setQuickViewPlayer} />
            <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">VS</div>
            <PairPreview label="Cặp B" players={teamB} onSelectPlayer={setQuickViewPlayer} />
          </div>
          {warningLabels.length > 0 ? (
            <div role="status" className="mt-1.5 rounded-lg border border-amber-300/20 bg-amber-400/10 px-2 py-1.5 text-[10px] font-medium leading-4 text-amber-100">
              {warningLabels[0]}
            </div>
          ) : null}
          {actionError ? (
            <div role="alert" className="mt-1.5 rounded-lg border border-rose-300/20 bg-rose-400/10 px-2 py-1.5 text-[10px] font-medium leading-4 text-rose-100">
              {actionError}
            </div>
          ) : null}
        </div>

        </div>
      </div>

      {replaceOpen && (
        <div id={replacePanelId} className="space-y-2 border-t border-white/10 bg-slate-950/45 px-2 py-2">
          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.045] p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="text-[11px] font-black text-cyan-50">Gợi ý hiện tại</div>
              <button
                type="button"
                disabled={pendingReplacements.length === 0}
                aria-label={`Lưu thay đổi người cho gợi ý ${match.index}`}
                onClick={() => {
                  if (pendingReplacements.length === 0) return;
                  const result = replaceNextMatchRoster(match.id, draftRoster);
                  if (!result.changed) {
                    setActionError(getRuntimeValidationMessage(result));
                    return;
                  }
                  setActionError(null);
                  onReplaceOpenChange?.(false);
                  setSelectedSlot(null);
                  setPendingReplacements([]);
                  void onCommitRuntime?.();
                }}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-cyan-200/30 bg-cyan-400 px-2.5 text-[10px] font-black text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800 disabled:text-slate-500"
              >
                <Check className="h-3 w-3" />
                Lưu lại
              </button>
            </div>
            <div className="grid gap-1.5">
              <div className="grid min-w-0 gap-1.5 min-[760px]:grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1fr)] min-[760px]:items-center">
                <ReplacePairGroup label="Cặp A" slots={[0, 1]} roster={draftRoster} originalRoster={match.roster} players={players} selectedSlot={selectedSlot} pendingReplacements={pendingReplacements} onSelect={setSelectedSlot} onUndo={(slot) => {
                  setDraftRoster((current) => current.map((playerId, index) => index === slot ? match.roster[slot] : playerId));
                  setPendingReplacements((current) => current.filter((replacement) => replacement.slotIndex !== slot));
                  setSelectedSlot(null);
                }} />
                <div className="flex items-center gap-2 py-0.5 min-[760px]:grid min-[760px]:place-items-center" aria-hidden="true">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">VS</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <ReplacePairGroup label="Cặp B" slots={[2, 3]} roster={draftRoster} originalRoster={match.roster} players={players} selectedSlot={selectedSlot} pendingReplacements={pendingReplacements} onSelect={setSelectedSlot} onUndo={(slot) => {
                  setDraftRoster((current) => current.map((playerId, index) => index === slot ? match.roster[slot] : playerId));
                  setPendingReplacements((current) => current.filter((replacement) => replacement.slotIndex !== slot));
                  setSelectedSlot(null);
                }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="text-[11px] font-black text-slate-100">Người thay thế</div>
            </div>
            <div className="max-h-48 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
              <div className="grid gap-1 min-[760px]:grid-cols-2">
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
                        setPendingReplacements((current) => [
                          ...current.filter((replacement) => replacement.slotIndex !== selectedSlot),
                          { slotIndex: selectedSlot, playerId: wp.id, originalPlayerId: match.roster[selectedSlot] }
                        ]);
                        setSelectedSlot(null);
                      }}
                      disabled={selectedSlot === null}
                      aria-label={`Chọn ${wp.name} thay thế${sourceMatchByPlayerId.has(wp.id) ? ` từ gợi ý ${sourceMatchByPlayerId.get(wp.id)}` : ''}`}
                      className={`w-full rounded-lg border px-2 py-1.5 text-left transition-colors hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-70 ${getReplacementPlayerCardTone(wp.gender)}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-[11px] font-bold leading-4 text-slate-100" title={wp.name}>{getDisplayPlayerName(wp.name)}</div>
                        {sourceMatchByPlayerId.has(wp.id) ? <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-1.5 py-0 text-[9px] font-semibold text-cyan-100">#{sourceMatchByPlayerId.get(wp.id)}</span> : null}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">{wp.gender} • {getLevelLabel(wp.level)} • {wp.matchesPlayed} trận • {wp.status === 'JUST_FINISHED' ? 'vừa thi đấu' : wp.status === 'PRIORITY' ? 'trong gợi ý' : 'chờ'}</div>
                    </button>
                  ))}
                {replacementPlayers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs font-medium text-slate-500 min-[760px]:col-span-2">
                    Không có người phù hợp để thay thế.
                  </div>
                ) : null}
              </div>
            </div>
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
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.035] p-1.5">
      <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="grid gap-1">
        {players.map((player, index) => (
          <button
            type="button"
            key={player?.id ?? index}
            className="grid min-h-[48px] w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-1.5 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-cyan-300/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            onClick={() => player && onSelectPlayer(toQuickViewPlayer(player))}
            aria-label={player ? `Xem nhanh ${player.name}` : 'Vị trí trống'}
            aria-disabled={!player}
          >
            <PlayerAvatar name={player?.name ?? 'Người chơi'} gender={player?.gender} avatarUrl={player?.avatarUrl} size="xs" />
            <div className="min-w-0">
              <p className="overflow-hidden break-words text-[11px] font-bold leading-[1.2] text-slate-100 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]" title={player?.name}>{player ? getDisplayPlayerName(player.name) : 'Trống'}</p>
              <p className="mt-0.5 text-[10px] font-medium leading-3 text-slate-400">
                {player ? <><span className={player.gender === 'Nam' ? 'text-cyan-200' : 'text-pink-200'}>{player.gender}</span> • {getLevelLabel(player.level)} • {player.matchesPlayed} trận</> : 'Chưa có người'}
              </p>
              {player ? <PlayerTagBadges tags={player.playerTags} compact className="mt-0.5" /> : null}
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

type StorePlayer = ReturnType<typeof useBadmintonStore.getState>['players'][number];

const WARNING_LABELS: Record<string, string> = {
  RECENT_PLAYER_FALLBACK: 'Có người vừa thi đấu vì chưa có phương án phù hợp hơn.',
  QUARTET_REPEAT_FALLBACK: 'Lặp nhóm bốn người do chưa có lựa chọn phù hợp hơn.',
  MANUAL_OVERRIDE: 'Phương án đã được điều phối viên chỉnh thủ công.',
  COUPLE_SPLIT: 'Phương án đang tách Couple trong nội dung đã đăng ký.',
  LEVEL_IMBALANCE: 'Hai đội đang chênh lệch trình độ; điều phối viên vẫn có thể áp dụng.',
  FORMAT_MISMATCH: 'Đội hình thủ công đã khác nội dung ban đầu; hệ thống đã cập nhật theo roster thực tế.'
};

function getWarningLabels(match: ExplainableNextMatch, players: Array<StorePlayer | undefined>, isStale: boolean): string[] {
  if (isStale) return ['Gợi ý không còn hợp lệ. Hãy đổi người hoặc tạo lại trước khi áp dụng.'];

  const fromEngine = (match.warningCodes ?? [])
    .map((code) => WARNING_LABELS[code])
    .filter((label): label is string => Boolean(label));
  if (fromEngine.length > 0) return [...new Set(fromEngine)];
  if (match.validity === 'WARNING') return ['Phương án có cảnh báo. Hãy kiểm tra đội hình trước khi áp dụng.'];
  if (players.some((player) => player?.status === 'JUST_FINISHED')) return ['Có người vừa thi đấu; vẫn có thể áp dụng nếu phù hợp vận hành.'];
  return [];
}

function getMatchFormatLabel(match: ExplainableNextMatch, players: Array<StorePlayer | undefined>): string {
  if (match.matchFormat === 'MEN') return 'Đôi nam';
  if (match.matchFormat === 'WOMEN') return 'Đôi nữ';
  if (match.matchFormat === 'MIXED') return 'Nam nữ';

  const presentPlayers = players.filter((player): player is StorePlayer => Boolean(player));
  const maleCount = presentPlayers.filter((player) => player.gender === 'Nam').length;
  const femaleCount = presentPlayers.length - maleCount;
  const bothTeamsMixed = presentPlayers.length === 4
    && presentPlayers.slice(0, 2).some((player) => player.gender === 'Nam')
    && presentPlayers.slice(0, 2).some((player) => player.gender === 'Nữ')
    && presentPlayers.slice(2, 4).some((player) => player.gender === 'Nam')
    && presentPlayers.slice(2, 4).some((player) => player.gender === 'Nữ');

  if (maleCount === 4) return 'Đôi nam';
  if (femaleCount === 4) return 'Đôi nữ';
  if (bothTeamsMixed) return 'Nam nữ';
  return 'Tự động';
}

function getReplacementPlayerCardTone(gender: StorePlayer['gender']): string {
  if (gender === 'Nữ') {
    return 'border-pink-300/45 bg-pink-500/[0.18] hover:border-pink-200/70 hover:bg-pink-500/[0.24]';
  }
  return 'border-cyan-300/45 bg-cyan-500/[0.18] hover:border-cyan-200/70 hover:bg-cyan-500/[0.24]';
}

function ReplacePairGroup({
  label,
  slots,
  roster,
  originalRoster,
  players,
  selectedSlot,
  pendingReplacements,
  onSelect,
  onUndo
}: {
  label: string;
  slots: number[];
  roster: string[];
  originalRoster: string[];
  players: ReturnType<typeof useBadmintonStore.getState>['players'];
  selectedSlot: number | null;
  pendingReplacements: Array<{ slotIndex: number; playerId: string; originalPlayerId: string }>;
  onSelect: (slot: number) => void;
  onUndo: (slot: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100/70">{label}</div>
      <div className="grid gap-1 overflow-hidden rounded-lg border border-white/10 bg-slate-950/35 p-1">
        {slots.map((slot) => {
          const player = players.find((item) => item.id === roster[slot]);
          const originalPlayer = players.find((item) => item.id === originalRoster[slot]);
          const pending = pendingReplacements.find((replacement) => replacement.slotIndex === slot);
          return (
            <div key={slot} className={`relative overflow-hidden rounded-md border transition-colors ${selectedSlot === slot ? 'border-cyan-300/45 bg-cyan-400/12 ring-1 ring-inset ring-cyan-300/30' : pending ? 'border-emerald-300/25 bg-emerald-400/[0.08]' : 'border-white/[0.04] hover:border-cyan-300/20 hover:bg-white/[0.035]'}`}>
              <button
                type="button"
                onClick={() => onSelect(slot)}
                aria-pressed={selectedSlot === slot}
                aria-label={player ? `Chọn ${player.name} ở ${label} để đổi` : `Chọn vị trí trống ở ${label}`}
                className="grid min-h-[48px] w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70"
              >
                <PlayerAvatar name={player?.name ?? 'Người chơi'} gender={player?.gender} avatarUrl={player?.avatarUrl} size="xs" />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold leading-[1.25] text-slate-100" title={player?.name}>{player ? getDisplayPlayerName(player.name) : 'Trống'}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-slate-400">{player ? `${player.gender} • ${getLevelLabel(player.level)} • ${player.matchesPlayed} trận` : '—'}</span>
                  {pending && originalPlayer ? <span className="mt-0.5 block truncate text-[9px] font-medium leading-3 text-emerald-200" title={originalPlayer.name}>Thay: {originalPlayer.name}</span> : null}
                </span>
                <span className={`rounded-full border px-1.5 py-0 text-[8px] font-bold ${selectedSlot === slot ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100' : pending ? 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100' : 'border-white/[0.05] text-slate-500'}`}>
                  {selectedSlot === slot ? 'Đổi' : pending ? 'Mới' : 'Chọn'}
                </span>
              </button>
              {pending ? (
                <button type="button" onClick={() => onUndo(slot)} className="absolute bottom-1 right-2 text-[8px] font-semibold text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-white" aria-label={`Hoàn tác thay ${originalPlayer?.name ?? 'người chơi'}`}>
                  Hoàn tác
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
