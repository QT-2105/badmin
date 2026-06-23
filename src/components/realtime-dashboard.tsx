'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Route } from 'next';
import { CalendarDays, ChevronDown, ChevronUp, History, Home, Loader2, Users, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useBadmintonStore, type Player, type SuggestionMode } from '@/lib/badminton-store';
import { useRuntimeHydration } from '@/hooks/use-runtime-hydration';
import { useRuntimeSync } from '@/hooks/use-runtime-sync';
import { usePlaySession } from '@/hooks/use-play-dates';
import { useMatchHistoryMutations } from '@/hooks/use-match-history';
import { getSessionStatusLabel, isRuntimeActiveStatus, isRuntimeReadonlyStatus, normalizeSessionStatus } from '@/lib/session-status';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import { LiveCourtsSection } from './sections/live-courts-section';
import { MatchHistoryPanel } from './sections/match-history-panel';
import { NextMatchQueue } from './sections/next-match-queue';
import { PlayerDatabasePanel } from './sections/player-database-panel';

const SUGGESTION_MODES: Array<{ value: SuggestionMode; label: string }> = [
  { value: 'random', label: 'Ngẫu nhiên' },
  { value: 'mixed', label: 'Nam nữ' },
  { value: 'women', label: 'Đôi Nữ' },
  { value: 'men', label: 'Đôi Nam' }
];

export function RealtimeDashboard() {
  const { updateCooldowns, players, session, suggestionMode, refreshNextMatches, setRuntimeSessionId, runtimeSessionId } = useBadmintonStore();
  const [isPlayerFullscreenOpen, setIsPlayerFullscreenOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [historyPlayerId, setHistoryPlayerId] = useState('');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedSuggestionMode, setSelectedSuggestionMode] = useState<SuggestionMode>(suggestionMode);

  const { data: sessionRecord } = usePlaySession(runtimeSessionId || '');
  const { createHistory } = useMatchHistoryMutations(runtimeSessionId || '');

  // Hydrate from DB on mount and whenever runtimeSessionId changes
  const hydration = useRuntimeHydration({ sessionId: runtimeSessionId || undefined, enabled: !!runtimeSessionId });

  // Runtime writes are explicit commits from operator actions, not polling or render effects.
  const { syncState, commitRuntimeSnapshot } = useRuntimeSync({ enabled: !!runtimeSessionId && isRuntimeActiveStatus(sessionRecord?.status ?? session.status) });

  // Initialize runtimeSessionId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('badmin_active_session_id');
    if (stored) {
      setRuntimeSessionId(stored);
    }
  }, [setRuntimeSessionId]);

  const stats = useMemo(() => {
    const waiting = players.filter((player) => player.status === 'WAITING').length;
    const finished = players.filter((player) => player.status === 'JUST_FINISHED').length;
    const playing = players.filter((player) => player.status === 'PLAYING').length;

    return {
      total: players.length,
      waiting,
      finished,
      playing
    };
  }, [players]);

  const sessionStatus = sessionRecord?.status ?? session.status;
  const normalizedStatus = normalizeSessionStatus(sessionStatus);
  const isActive = isRuntimeActiveStatus(sessionStatus);
  const isReadonly = isRuntimeReadonlyStatus(sessionStatus);
  const minimumPlayers = Math.max(1, session.courtCount) * 6;
  const hasEnoughPlayers = players.length >= minimumPlayers;
  const schedulingDisabled = !isActive || isReadonly || !hasEnoughPlayers;
  const schedulingDisabledReason = isReadonly
    ? normalizedStatus === 'CANCELLED'
      ? 'Ca đã hủy. Điều phối bị khóa.'
      : 'Ca đã hoàn tất. Điều phối đang ở chế độ xem.'
    : !isActive
      ? 'Bắt đầu ca để mở điều phối.'
      : !hasEnoughPlayers
        ? 'Chưa đủ người chơi để bắt đầu xếp sân.'
        : null;

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>) {
    if (syncState === 'pending' || syncState === 'syncing' || syncState === 'error') {
      const ok = window.confirm('Runtime chưa đồng bộ xong. Bạn vẫn muốn rời màn hình điều phối?');
      if (!ok) {
        event.preventDefault();
      }
    }
  }

  function refreshSuggestions() {
    if (schedulingDisabled) return;
    refreshNextMatches(selectedSuggestionMode);
    void commitRuntimeSnapshot();
  }

  async function recordMatchHistory(payload: MatchHistoryPayload) {
    if (!runtimeSessionId) return;
    try {
      await createHistory.mutateAsync(payload);
      setHistoryError(null);
    } catch {
      setHistoryError('Không thể lưu lịch sử trận đấu. Vui lòng kiểm tra kết nối hoặc migration database.');
    }
  }

  // Update cooldowns every second
  useEffect(() => {
    const timer = setInterval(() => {
      updateCooldowns(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [updateCooldowns]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (syncState !== 'pending' && syncState !== 'syncing' && syncState !== 'error') return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [syncState]);


  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      <RuntimeTopBar
        sessionId={runtimeSessionId}
        title={sessionRecord?.name ?? session.title}
        timeRange={session.timeRange}
        status={sessionStatus}
        syncState={syncState}
        onLeave={confirmLeave}
      />

      {hydration.isLoading && runtimeSessionId ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-200" />
            <p className="mt-3 text-sm font-semibold text-white">Đang khôi phục điều phối...</p>
            <p className="mt-1 text-sm text-slate-400">Runtime đang tải trạng thái hiện tại từ database.</p>
          </div>
        </div>
      ) : (
        <>
      {/* DESKTOP/TABLET HEADER */}
      <header className="hidden md:flex flex-col gap-1.5 px-4 py-1.5">
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-4 gap-1.5">
            <StatPill label="Tổng" value={stats.total} tone="text-white" compact />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Vừa xong" value={stats.finished} tone="text-violet-200" compact />
            <StatPill label="Đang chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setIsMatchHistoryOpen(true)} className="h-9 shrink-0 px-3 text-xs">
            <History className="h-4 w-4" />
            Lịch sử
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(true)} className="h-9 shrink-0 px-3 text-xs">
            <Users className="h-4 w-4" />
            Người chơi
          </Button>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} /> : null}
        {historyError ? <RuntimeNotice message={historyError} /> : null}
      </header>

      {/* DESKTOP/TABLET LAYOUT */}
      <div className="hidden md:flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 px-4 pb-2 overflow-hidden">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-xs font-bold tracking-wider text-slate-100">QUẢN LÝ SÂN</h2>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-400">{session.courtCount} sân</span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-200">Trận tiếp theo</span>
                <SuggestionModePicker value={selectedSuggestionMode} onChange={setSelectedSuggestionMode} disabled={schedulingDisabled} />
                <button
                  onClick={refreshSuggestions}
                  disabled={schedulingDisabled}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-3 w-3" />
                  Auto xếp cặp
                </button>
              </div>
            </div>

            <div className="grid flex-1 min-h-0 grid-cols-2 gap-2 p-2">
              <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <LiveCourtsSection
                  showHeader={false}
                  schedulingDisabled={schedulingDisabled}
                  disabledReason={schedulingDisabledReason}
                  onCommitRuntime={commitRuntimeSnapshot}
                  onRecordMatch={recordMatchHistory}
                />
                </div>
                <PlayerStatusOverview players={players} />
              </div>
              <div className="min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <NextMatchQueue showHeader={false} schedulingDisabled={schedulingDisabled} disabledReason={schedulingDisabledReason} onCommitRuntime={commitRuntimeSnapshot} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-1.5">
          <div className="mb-1.5 flex justify-end gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setIsMatchHistoryOpen(true)} className="h-8 px-2.5 text-[11px]">
              <History className="h-3.5 w-3.5" />
              Lịch sử
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(true)} className="h-8 px-2.5 text-[11px]">
              <Users className="h-3.5 w-3.5" />
              Người chơi
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <StatPill label="Tổng" value={stats.total} tone="text-white" compact />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Xong" value={stats.finished} tone="text-violet-200" compact />
            <StatPill label="Chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} compact /> : null}
        {historyError ? <RuntimeNotice message={historyError} compact /> : null}

        <div className="flex-1 overflow-y-auto px-3">
          <LiveCourtsSection
            schedulingDisabled={schedulingDisabled}
            disabledReason={schedulingDisabledReason}
            onCommitRuntime={commitRuntimeSnapshot}
            onRecordMatch={recordMatchHistory}
          />
          <div className="mt-2">
            <PlayerStatusOverview players={players} />
          </div>
        </div>

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-3 py-3"
        >
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 px-3 py-2">
              <div className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-200">
                Trận tiếp theo
              </div>
              <button
                onClick={refreshSuggestions}
                disabled={schedulingDisabled}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-3 w-3" />
                Auto xếp cặp
              </button>
            </div>
            <div className="border-b border-slate-800/60 px-3 py-2">
              <SuggestionModePicker value={selectedSuggestionMode} onChange={setSelectedSuggestionMode} disabled={schedulingDisabled} />
            </div>
            <div className="max-h-[46vh] min-h-[220px] overflow-hidden p-3">
              <NextMatchQueue showHeader={false} schedulingDisabled={schedulingDisabled} disabledReason={schedulingDisabledReason} onCommitRuntime={commitRuntimeSnapshot} />
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isMatchHistoryOpen && runtimeSessionId ? (
          <MatchHistoryPanel
            sessionId={runtimeSessionId}
            players={players}
            selectedPlayerId={historyPlayerId}
            onSelectedPlayerChange={setHistoryPlayerId}
            onClose={() => setIsMatchHistoryOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isPlayerFullscreenOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 p-3 text-slate-100 backdrop-blur"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white">Danh sách người chơi</div>
                <div className="text-xs text-slate-400">Kiểm tra thanh toán cuối ca</div>
              </div>
              <Button type="button" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(false)} className="h-10">
                <X className="h-4 w-4" />
                Đóng
              </Button>
            </div>
            <PlayerDatabasePanel
              showClose={false}
              viewMode="expanded"
              className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/80"
              readonly={isReadonly}
              fullHeight
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}

function RuntimeTopBar({
  sessionId,
  title,
  timeRange,
  status,
  syncState,
  onLeave
}: {
  sessionId: string | null;
  title: string;
  timeRange: string;
  status: string;
  syncState: string;
  onLeave: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const syncLabel = syncState === 'pending' ? 'Chờ đồng bộ' : syncState === 'syncing' ? 'Đang đồng bộ' : syncState === 'error' ? 'Lỗi đồng bộ' : 'Đã đồng bộ';
  const sessionHref = (sessionId ? `/sessions/${sessionId}` : '/schedule') as Route;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-3 py-2 backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-1">
          <Link href="/dashboard" onClick={onLeave} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          <div className="truncate text-xs text-slate-400">{timeRange} · {getSessionStatusLabel(status)} · {syncLabel}</div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link href={sessionHref} onClick={onLeave} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-3 text-xs font-bold text-slate-950" aria-label="Về chi tiết ca">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Chi tiết ca</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function RuntimeNotice({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div className={`${compact ? 'mx-3 mb-2' : ''} rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100`}>
      {message}
    </div>
  );
}

function StatPill({ label, value, tone, compact = false }: { label: string; value: number; tone: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'min-w-[78px] rounded-lg border border-white/10 bg-white/5 px-2 py-1'
          : 'rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5'
      }
    >
      <p className={`${compact ? 'text-sm' : 'text-base'} font-semibold ${tone}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}

function SuggestionModePicker({
  value,
  onChange,
  disabled
}: {
  value: SuggestionMode;
  onChange: (value: SuggestionMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/50 p-1">
      {SUGGESTION_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode.value)}
          className={`h-6 shrink-0 rounded-md px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === mode.value
              ? 'bg-cyan-400 text-slate-950'
              : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function PlayerStatusOverview({ players }: { players: Player[] }) {
  const [expanded, setExpanded] = useState(true);
  const sortedPlayers = useMemo(() => {
    const statusRank: Record<string, number> = {
      WAITING: 0,
      JUST_FINISHED: 1,
      PRIORITY: 2,
      PLAYING: 3,
      RESTING: 4,
      FINISHED: 5
    };

    return [...players]
      .filter((player) => player.status === 'WAITING' || player.status === 'JUST_FINISHED' || player.status === 'PLAYING' || player.status === 'PRIORITY')
      .sort((left, right) => {
        const statusDiff = (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        if (left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
        return left.name.localeCompare(right.name, 'vi');
      })
      .slice(0, 24);
  }, [players]);
  const visiblePlayers = expanded ? sortedPlayers.slice(0, 5) : [];

  return (
    <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Hàng chờ</div>
          <div className="text-[11px] text-slate-500">Ưu tiên chờ, vừa xong</div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          aria-label={expanded ? 'Thu gọn hàng chờ' : 'Mở rộng hàng chờ'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded ? <div className="max-h-40 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
          {visiblePlayers.map((player) => (
            <div key={player.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg bg-slate-950/45 px-2 py-1.5 text-[11px]">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-100">{player.name}</div>
                <div className={player.gender === 'Nữ' ? 'text-pink-300' : 'text-cyan-300'}>{player.gender}</div>
              </div>
              <div className="font-mono text-slate-300">{player.matchesPlayed} trận</div>
              <span className={`rounded-full px-2 py-0.5 font-medium ${getPlayerStatusTone(player.status)}`}>
                {getPlayerStatusLabel(player.status)}
              </span>
            </div>
          ))}
          {visiblePlayers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
              Chưa có người chơi đang chờ.
            </div>
          ) : null}
        </div>
      </div> : null}
    </div>
  );
}

function getPlayerStatusLabel(status: Player['status']): string {
  if (status === 'PLAYING') return 'Đang chơi';
  if (status === 'JUST_FINISHED') return 'Vừa xong';
  if (status === 'PRIORITY') return 'Đã xếp';
  return 'Chờ';
}

function getPlayerStatusTone(status: Player['status']): string {
  if (status === 'PLAYING') return 'bg-emerald-400/15 text-emerald-200';
  if (status === 'JUST_FINISHED') return 'bg-violet-400/15 text-violet-200';
  if (status === 'PRIORITY') return 'bg-amber-400/15 text-amber-200';
  return 'bg-cyan-400/15 text-cyan-200';
}
