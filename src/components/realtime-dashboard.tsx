'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, ChevronUp, History, Home, Loader2, Users, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/dialog';
import { FullscreenToggle } from '@/components/ui/fullscreen-toggle';
import { useBadmintonStore, type Player, type SuggestionMode } from '@/lib/badminton-store';
import { useRuntimeHydration } from '@/hooks/use-runtime-hydration';
import { useRuntimeSync } from '@/hooks/use-runtime-sync';
import { usePlaySession } from '@/hooks/use-play-dates';
import { useMatchHistoryMutations } from '@/hooks/use-match-history';
import { getSessionStatusLabel, isRuntimeActiveStatus, isRuntimeReadonlyStatus, normalizeSessionStatus } from '@/lib/session-status';
import { getDisplayPlayerName } from '@/lib/player-display';
import { getLevelLabel } from '@/lib/player-labels';
import { PLAYER_TAG_OPTIONS, normalizePlayerTags } from '@/lib/player-tags';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import { LiveCourtsSection } from './sections/live-courts-section';
import { MatchHistoryPanel } from './sections/match-history-panel';
import { NextMatchQueue } from './sections/next-match-queue';
import { PlayerDatabasePanel } from './sections/player-database-panel';
import { PlayerTagBadges } from './player/player-tag-badges';

const SUGGESTION_MODES: Array<{ value: SuggestionMode; label: string }> = [
  { value: 'random', label: 'Ngẫu nhiên' },
  { value: 'mixed', label: 'Nam nữ' },
  { value: 'women', label: 'Đôi Nữ' },
  { value: 'men', label: 'Đôi Nam' }
];

export function RealtimeDashboard() {
  const { updateCooldowns, players, session, suggestionMode, refreshNextMatches, setRuntimeSessionId, runtimeSessionId } = useBadmintonStore();
  const router = useRouter();
  const [isPlayerFullscreenOpen, setIsPlayerFullscreenOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<Route | null>(null);
  const [historyPlayerId, setHistoryPlayerId] = useState('');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [autoMatchNotice, setAutoMatchNotice] = useState<string | null>(null);
  const [selectedSuggestionMode, setSelectedSuggestionMode] = useState<SuggestionMode>(suggestionMode);
  const prefersReducedMotion = useReducedMotion();

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
  const autoMatchBlockReason = useMemo(
    () => getAutoMatchBlockReason(players, selectedSuggestionMode, schedulingDisabledReason),
    [players, selectedSuggestionMode, schedulingDisabledReason]
  );

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>, href: Route) {
    if (syncState === 'pending' || syncState === 'syncing' || syncState === 'error') {
      event.preventDefault();
      setPendingLeaveHref(href);
    }
  }

  function cancelLeave() {
    setPendingLeaveHref(null);
  }

  function confirmPendingLeave() {
    if (!pendingLeaveHref) return;
    const href = pendingLeaveHref;
    setPendingLeaveHref(null);
    router.push(href);
  }

  function refreshSuggestions() {
    if (autoMatchBlockReason) {
      setAutoMatchNotice(autoMatchBlockReason);
      return;
    }
    refreshNextMatches(selectedSuggestionMode);
    const generatedMatches = useBadmintonStore.getState().nextMatches;
    if (generatedMatches.length === 0) {
      setAutoMatchNotice('Chưa tạo được gợi ý phù hợp. Hãy kiểm tra tag điểm danh, số lượng nam/nữ và trạng thái người chơi.');
      return;
    }
    setAutoMatchNotice(null);
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
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
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
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-200 motion-reduce:animate-none" />
            <p className="mt-3 text-sm font-semibold text-white">Đang khôi phục điều phối...</p>
            <p className="mt-1 text-sm text-slate-400">Runtime đang tải trạng thái hiện tại từ database.</p>
          </div>
        </div>
      ) : (
        <>
      {/* DESKTOP/TABLET HEADER */}
      <header className="hidden shrink-0 flex-col gap-2 border-b border-white/[0.06] bg-slate-950/60 px-3 py-2 md:flex lg:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1.5" aria-label="Thống kê nhanh điều phối">
            <StatPill label="Tổng" value={stats.total} tone="text-white" compact />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Vừa xong" value={stats.finished} tone="text-violet-200" compact />
            <StatPill label="Đang chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] p-1">
            <Button size="sm" variant="secondary" onClick={() => setIsMatchHistoryOpen(true)} className="h-10 shrink-0 px-3 text-xs focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Mở lịch sử trận đấu">
              <History className="h-4 w-4" />
              Lịch sử
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(true)} className="h-10 shrink-0 px-3 text-xs focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Mở danh sách người chơi toàn màn hình">
              <Users className="h-4 w-4" />
              Người chơi
            </Button>
          </div>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} /> : null}
        {historyError ? <RuntimeNotice message={historyError} /> : null}
        {autoMatchNotice ? <RuntimeNotice message={autoMatchNotice} /> : null}
      </header>

      {/* DESKTOP/TABLET LAYOUT */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 lg:px-4">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 shadow-[0_18px_48px_rgba(2,6,23,0.28)] backdrop-blur-xl" aria-label="Quản lý sân và trận tiếp theo">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.025] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-xs font-bold tracking-wider text-slate-100">QUẢN LÝ SÂN</h2>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-400">{session.courtCount} sân</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
                <span className="rounded-lg border border-cyan-300/15 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-100">Trận tiếp theo</span>
                <SuggestionModePicker value={selectedSuggestionMode} onChange={setSelectedSuggestionMode} disabled={schedulingDisabled} />
                <button
                  onClick={refreshSuggestions}
                  disabled={schedulingDisabled}
                  title={autoMatchBlockReason ?? undefined}
                  aria-label="Auto xếp cặp trận tiếp theo"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-400/[0.12] px-3 text-xs font-semibold text-cyan-100 transition-colors hover:border-cyan-200/45 hover:bg-cyan-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
                >
                  <Zap className="h-3 w-3" />
                  Auto xếp cặp
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto overscroll-contain p-2.5 min-[1100px]:grid-cols-[minmax(380px,1fr)_minmax(420px,1fr)] min-[1100px]:overflow-hidden xl:grid-cols-[minmax(420px,1fr)_minmax(460px,1fr)]">
              <div className="flex min-h-[min(52vh,560px)] flex-col gap-2 overflow-hidden min-[1100px]:min-h-0">
                <div className="min-h-0 flex-1 overflow-hidden pr-1">
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
              <div className="min-h-[min(42vh,520px)] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-2 shadow-inner shadow-slate-950/30 min-[1100px]:min-h-0">
                <NextMatchQueue showHeader={false} schedulingDisabled={schedulingDisabled} disabledReason={schedulingDisabledReason} onCommitRuntime={commitRuntimeSnapshot} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="px-3 py-1.5">
          <div className="mb-1.5 flex justify-end gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setIsMatchHistoryOpen(true)} className="h-10 px-3 text-[11px] focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Mở lịch sử trận đấu">
              <History className="h-3.5 w-3.5" />
              Lịch sử
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(true)} className="h-10 px-3 text-[11px] focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Mở danh sách người chơi toàn màn hình">
              <Users className="h-3.5 w-3.5" />
              Người chơi
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Thống kê nhanh điều phối">
            <StatPill label="Tổng" value={stats.total} tone="text-white" compact />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Xong" value={stats.finished} tone="text-violet-200" compact />
            <StatPill label="Chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} compact /> : null}
        {historyError ? <RuntimeNotice message={historyError} compact /> : null}
        {autoMatchNotice ? <RuntimeNotice message={autoMatchNotice} compact /> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
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
          initial={prefersReducedMotion ? false : { y: '100%' }}
          animate={prefersReducedMotion ? undefined : { y: 0 }}
          className="shrink-0 border-t border-slate-800/50 bg-slate-900/50 px-3 py-3 backdrop-blur-sm"
        >
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 px-3 py-2">
              <div className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-200">
                Trận tiếp theo
              </div>
              <button
                onClick={refreshSuggestions}
                disabled={schedulingDisabled}
                title={autoMatchBlockReason ?? undefined}
                aria-label="Auto xếp cặp trận tiếp theo"
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-cyan-300/30 bg-cyan-400/[0.12] px-2.5 text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-200/45 hover:bg-cyan-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
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
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 p-3 text-slate-100 backdrop-blur"
            role="dialog"
            aria-modal="true"
            aria-labelledby="runtime-player-list-title"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div id="runtime-player-list-title" className="text-base font-semibold text-white">Danh sách người chơi</div>
                <div className="text-xs text-slate-400">Kiểm tra thanh toán cuối ca</div>
              </div>
              <Button type="button" variant="secondary" onClick={() => setIsPlayerFullscreenOpen(false)} className="h-10" aria-label="Đóng danh sách người chơi">
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
      <ConfirmationDialog
        open={Boolean(pendingLeaveHref)}
        title="Rời màn điều phối?"
        description="Runtime chưa đồng bộ xong. Bạn vẫn muốn rời màn hình điều phối?"
        confirmLabel="Rời màn"
        cancelLabel="Ở lại"
        tone="warning"
        onCancel={cancelLeave}
        onConfirm={confirmPendingLeave}
      />
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
  onLeave: (event: MouseEvent<HTMLAnchorElement>, href: Route) => void;
}) {
  const syncLabel = syncState === 'pending' ? 'Chờ đồng bộ' : syncState === 'syncing' ? 'Đang đồng bộ' : syncState === 'error' ? 'Lỗi đồng bộ' : 'Đã đồng bộ';
  const sessionHref = (sessionId ? `/sessions/${sessionId}` : '/schedule') as Route;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-3 py-2 shadow-[0_8px_28px_rgba(2,6,23,0.24)] backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link href="/dashboard" onClick={(event) => onLeave(event, '/dashboard')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <FullscreenToggle compact className="shrink-0" />
        </div>

        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-bold leading-5 text-white md:text-base">{title}</div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400 md:text-xs">
            <span className="truncate">{timeRange}</span>
            <span className="hidden text-slate-600 sm:inline">·</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 font-semibold text-cyan-100">{getSessionStatusLabel(status)}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-300">{syncLabel}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link href={sessionHref} onClick={(event) => onLeave(event, sessionHref)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-3 text-xs font-bold text-slate-950 shadow-[0_10px_24px_rgba(34,211,238,0.18)] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100" aria-label="Về chi tiết ca">
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
    <div role="status" className={`${compact ? 'mx-3 mb-2' : ''} rounded-xl border border-amber-300/25 bg-amber-400/[0.12] px-3 py-2 text-sm font-medium text-amber-100 shadow-inner shadow-amber-950/20`}>
      {message}
    </div>
  );
}

function StatPill({ label, value, tone, compact = false }: { label: string; value: number; tone: string; compact?: boolean }) {
  return (
    <div
      aria-label={`${label}: ${value}`}
      className={
        compact
          ? `min-w-[78px] rounded-lg border px-2.5 py-1.5 shadow-inner shadow-slate-950/20 ${getStatPillSurfaceTone(label)}`
          : `rounded-xl border px-3 py-2 shadow-inner shadow-slate-950/20 ${getStatPillSurfaceTone(label)}`
      }
    >
      <p className={`${compact ? 'text-sm' : 'text-base'} font-bold leading-5 ${tone}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400/90">{label}</p>
    </div>
  );
}

function getStatPillSurfaceTone(label: string): string {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('tổng')) return 'border-slate-300/15 bg-slate-300/[0.07]';
  if (normalizedLabel.includes('chờ')) return 'border-cyan-300/20 bg-cyan-400/[0.08]';
  if (normalizedLabel.includes('xong')) return 'border-violet-300/20 bg-violet-400/[0.08]';
  if (normalizedLabel.includes('chơi')) return 'border-emerald-300/20 bg-emerald-400/[0.08]';
  return 'border-white/10 bg-white/5';
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
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 p-1 shadow-inner shadow-slate-950/30" role="group" aria-label="Chế độ gợi ý xếp cặp">
      {SUGGESTION_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode.value)}
          aria-pressed={value === mode.value}
          className={`h-10 shrink-0 rounded-md px-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed ${
            value === mode.value
              ? 'bg-cyan-400 text-slate-950'
              : 'text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:bg-transparent disabled:text-slate-600'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function PlayerStatusOverview({ players }: { players: Player[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const tagStats = useMemo(
    () =>
      PLAYER_TAG_OPTIONS.map((tag) => ({
        ...tag,
        count: players.filter((player) => normalizePlayerTags(player.playerTags).includes(tag.value)).length
      })),
    [players]
  );
  const sortedPlayers = useMemo(() => {
    const statusRank: Record<string, number> = {
      WAITING: 0,
      JUST_FINISHED: 1,
      PLAYING: 2,
      PRIORITY: 3,
      RESTING: 4,
      FINISHED: 5
    };

    return [...players]
      .sort((left, right) => {
        const statusDiff = (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        if (left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
        return left.name.localeCompare(right.name, 'vi');
      });
  }, [players]);
  const visiblePlayers = expanded ? sortedPlayers : [];

  return (
    <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.035] p-2.5 shadow-inner shadow-slate-950/20">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">Hàng chờ</div>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {sortedPlayers.length} người
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tagStats.map((tag) => (
              <span
                key={tag.value}
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold leading-4 ${tag.count > 0 ? tag.activeClassName : tag.className}`}
              >
                {tag.label} {tag.count}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          aria-label={expanded ? 'Thu gọn hàng chờ' : 'Mở rộng hàng chờ'}
          aria-expanded={expanded}
          aria-controls={listId}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded ? <div id={listId} className="max-h-56 overflow-y-auto overscroll-contain pr-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="list" aria-label="Danh sách hàng chờ">
          {visiblePlayers.map((player) => (
            <div key={player.id} role="listitem" className="grid min-h-[82px] grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-white/[0.06] bg-slate-950/50 px-2.5 py-2 text-[11px] transition-colors hover:border-cyan-300/20 hover:bg-slate-900/70">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold leading-5 text-slate-100" title={player.name}>{getDisplayPlayerName(player.name)}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-semibold">
                  <span className={player.gender === 'Nữ' ? 'text-pink-200' : 'text-cyan-200'}>{player.gender}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-semibold text-cyan-200">{getLevelLabel(player.level)}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{getPlayerStatusAge(player)}</span>
                </div>
                <PlayerTagBadges tags={player.playerTags} compact className="mt-1" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono font-semibold text-slate-200">{player.matchesPlayed} trận</div>
                <span className={`rounded-full border px-2 py-0.5 font-bold ${getPlayerStatusTone(player.status)}`}>
                  {getPlayerStatusLabel(player.status)}
                </span>
              </div>
            </div>
          ))}
          {visiblePlayers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-3 py-5 text-center text-xs font-medium text-slate-500 sm:col-span-2">
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
  if (status === 'PLAYING') return 'border-emerald-300/20 bg-emerald-400/15 text-emerald-100';
  if (status === 'JUST_FINISHED') return 'border-violet-300/20 bg-violet-400/15 text-violet-100';
  if (status === 'PRIORITY') return 'border-amber-300/20 bg-amber-400/15 text-amber-100';
  if (status === 'RESTING') return 'border-slate-500/30 bg-slate-500/15 text-slate-200';
  return 'border-cyan-300/20 bg-cyan-400/15 text-cyan-100';
}

function getPlayerStatusAge(player: Player): string {
  const elapsedMs = Math.max(0, Date.now() - player.statusUpdatedAt);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  if (elapsedMinutes < 1) return 'vừa cập nhật';
  if (elapsedMinutes < 60) return `${elapsedMinutes}p`;
  return `${Math.floor(elapsedMinutes / 60)}h`;
}

function getAutoMatchBlockReason(players: Player[], mode: SuggestionMode, schedulingDisabledReason: string | null): string | null {
  if (schedulingDisabledReason) return schedulingDisabledReason;
  if (players.length === 0) return 'Chưa có người chơi trong ca.';

  const eligiblePlayers = players.filter(isEligibleForAutoMatchNotice);
  const arrivedLikeCount = players.filter((player) => {
    const tags = normalizePlayerTags(player.playerTags);
    return tags.includes('ARRIVED') || tags.includes('PRIORITY') || tags.includes('HOST');
  }).length;

  if (arrivedLikeCount === 0) {
    return 'Chưa có người chơi đã tới. Vui lòng điểm danh tag Đã tới hoặc Ưu tiên trước khi auto xếp cặp.';
  }

  if (eligiblePlayers.length < 4) {
    return `Chỉ có ${eligiblePlayers.length} người đủ điều kiện xếp cặp. Cần tối thiểu 4 người đã tới và không bị khóa bởi tag Chấn thương/Về sớm.`;
  }

  const femaleCount = eligiblePlayers.filter((player) => player.gender === 'Nữ').length;
  const maleCount = eligiblePlayers.filter((player) => player.gender === 'Nam').length;

  if (mode === 'women' && femaleCount < 4) {
    return `Đôi Nữ cần tối thiểu 4 nữ đủ điều kiện. Hiện có ${femaleCount}.`;
  }
  if (mode === 'men' && maleCount < 4) {
    return `Đôi Nam cần tối thiểu 4 nam đủ điều kiện. Hiện có ${maleCount}.`;
  }
  if (mode === 'mixed' && (maleCount < 2 || femaleCount < 2)) {
    return `Nam nữ cần tối thiểu 2 nam và 2 nữ đủ điều kiện. Hiện có ${maleCount} nam, ${femaleCount} nữ.`;
  }

  return null;
}

function isEligibleForAutoMatchNotice(player: Player): boolean {
  if (player.status !== 'WAITING' && player.status !== 'JUST_FINISHED') return false;
  const tags = normalizePlayerTags(player.playerTags);
  if (tags.includes('INJURED') || tags.includes('LEFT_EARLY')) return false;
  if (tags.includes('NOT_ARRIVED') && !tags.includes('PRIORITY') && !tags.includes('HOST')) return false;
  return tags.includes('ARRIVED') || tags.includes('PRIORITY') || tags.includes('HOST');
}
