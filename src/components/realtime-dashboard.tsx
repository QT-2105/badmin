'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, ChevronUp, CreditCard, History, Home, Loader2, QrCode, Users, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog, Dialog } from '@/components/ui/dialog';
import { FullscreenToggle } from '@/components/ui/fullscreen-toggle';
import { useBadmintonStore, type Player, type SuggestionMode } from '@/lib/badminton-store';
import { useRuntimeHydration } from '@/hooks/use-runtime-hydration';
import { useRuntimeSync } from '@/hooks/use-runtime-sync';
import { useAppSettings } from '@/hooks/use-app-settings';
import { usePlaySession } from '@/hooks/use-play-dates';
import { useMatchHistoryMutations } from '@/hooks/use-match-history';
import { usePaymentBankAccounts } from '@/hooks/use-payment-bank-accounts';
import { getSessionStatusLabel, isRuntimeActiveStatus, isRuntimeReadonlyStatus, normalizeSessionStatus } from '@/lib/session-status';
import { getDisplayPlayerName } from '@/lib/player-display';
import { getLevelLabel, LEVEL_OPTIONS } from '@/lib/player-labels';
import { PLAYER_TAG_OPTIONS, normalizePlayerTags } from '@/lib/player-tags';
import { isPlayerEligibleForAutoSuggestion } from '@/lib/runtime-eligibility';
import { getRuntimeValidationMessage } from '@/lib/runtime-roster-validation';
import type { MatchHistoryPayload } from '@/services/match-history-service';
import type { PaymentBankAccount } from '@/types/domain';
import { LiveCourtsSection } from './sections/live-courts-section';
import { MatchHistoryPanel } from './sections/match-history-panel';
import { NextMatchQueue } from './sections/next-match-queue';
import { PlayerDatabasePanel } from './sections/player-database-panel';
import { PlayerTagBadges } from './player/player-tag-badges';

const SUGGESTION_MODES: Array<{ value: SuggestionMode; label: string }> = [
  { value: 'random', label: 'Tự động' },
  { value: 'mixed', label: 'Nam nữ' },
  { value: 'women', label: 'Đôi Nữ' },
  { value: 'men', label: 'Đôi Nam' }
];

export function RealtimeDashboard() {
  const players = useBadmintonStore((state) => state.players);
  const session = useBadmintonStore((state) => state.session);
  const suggestionDiagnostics = useBadmintonStore((state) => state.suggestionDiagnostics);
  const suggestionMode = useBadmintonStore((state) => state.suggestionMode);
  const refreshNextMatches = useBadmintonStore((state) => state.refreshNextMatches);
  const setRuntimeSessionId = useBadmintonStore((state) => state.setRuntimeSessionId);
  const hydrateRuntimeSnapshot = useBadmintonStore((state) => state.hydrateRuntimeSnapshot);
  const runtimeSessionId = useBadmintonStore((state) => state.runtimeSessionId);
  const router = useRouter();
  const [isPlayerFullscreenOpen, setIsPlayerFullscreenOpen] = useState(false);
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);
  const [isPaymentQrOpen, setIsPaymentQrOpen] = useState(false);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string | null>(null);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<Route | null>(null);
  const [historyPlayerId, setHistoryPlayerId] = useState('');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [syncErrorNotice, setSyncErrorNotice] = useState<string | null>(null);
  const [autoMatchNotice, setAutoMatchNotice] = useState<string | null>(null);
  const [selectedSuggestionMode, setSelectedSuggestionMode] = useState<SuggestionMode>(suggestionMode);
  const prefersReducedMotion = useReducedMotion();

  const { data: sessionRecord } = usePlaySession(runtimeSessionId || '');
  const { createHistory } = useMatchHistoryMutations(runtimeSessionId || '');
  const { data: paymentBankAccounts = [], isLoading: paymentAccountsLoading } = usePaymentBankAccounts();
  const { settings: appSettings } = useAppSettings();

  // Hydrate from DB on mount and whenever runtimeSessionId changes
  const hydration = useRuntimeHydration({ sessionId: runtimeSessionId || undefined, enabled: !!runtimeSessionId });

  // Runtime writes are explicit commits from operator actions, not polling or render effects.
  const { syncState, commitRuntimeSnapshot, resetSyncState } = useRuntimeSync({ enabled: !!runtimeSessionId && isRuntimeActiveStatus(sessionRecord?.status ?? session.status) });

  // Initialize runtimeSessionId from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('badmin_active_session_id');
    if (stored) {
      setRuntimeSessionId(stored);
    }
  }, [setRuntimeSessionId]);

  const stats = useMemo(() => {
    const waiting = players.filter((player) => player.status === 'WAITING').length;
    const nextRequested = players.filter((player) => normalizePlayerTags(player.playerTags).includes('PRIORITY')).length;
    const playing = players.filter((player) => player.status === 'PLAYING').length;
    const male = players.filter((player) => player.gender === 'Nam').length;
    const female = players.filter((player) => player.gender === 'Nữ').length;
    const levels = LEVEL_OPTIONS.map((level) => ({
      ...level,
      male: players.filter((player) => player.gender === 'Nam' && player.level === level.value).length,
      female: players.filter((player) => player.gender === 'Nữ' && player.level === level.value).length
    }));

    return {
      total: players.length,
      waiting,
      nextRequested,
      playing,
      male,
      female,
      levels
    };
  }, [players]);

  const sessionStatus = sessionRecord?.status ?? session.status;
  const normalizedStatus = normalizeSessionStatus(sessionStatus);
  const isActive = isRuntimeActiveStatus(sessionStatus);
  const isReadonly = isRuntimeReadonlyStatus(sessionStatus);
  const hasRuntimeConflict = syncState === 'conflict';
  const schedulingDisabled = !isActive || isReadonly || hasRuntimeConflict;
  const schedulingDisabledReason = hasRuntimeConflict
    ? 'Dữ liệu đã thay đổi trên thiết bị khác. Tải trạng thái mới trước khi điều phối tiếp.'
    : isReadonly
    ? normalizedStatus === 'CANCELLED'
      ? 'Ca đã hủy. Điều phối bị khóa.'
      : 'Ca đã hoàn tất. Điều phối đang ở chế độ xem.'
    : !isActive
      ? 'Bắt đầu ca để mở điều phối.'
      : null;
  const autoMatchBlockReason = useMemo(
    () => getAutoMatchBlockReason(players, selectedSuggestionMode, schedulingDisabledReason),
    [players, selectedSuggestionMode, schedulingDisabledReason]
  );
  const selectedPaymentAccount = useMemo(
    () => (
      paymentBankAccounts.find((account) => account.id === selectedPaymentAccountId)
      ?? paymentBankAccounts.find((account) => account.id === appSettings.defaultPaymentBankAccountId)
      ?? paymentBankAccounts[0]
      ?? null
    ),
    [appSettings.defaultPaymentBankAccountId, paymentBankAccounts, selectedPaymentAccountId]
  );

  const commitRuntimeWithNotice = useCallback(async (): Promise<boolean> => {
    const committed = await commitRuntimeSnapshot();
    if (!committed) {
      setSyncErrorNotice('Không thể đồng bộ runtime. Hãy kiểm tra kết nối; nếu đang thao tác trên nhiều thiết bị, hãy tải lại dữ liệu trước khi tiếp tục.');
      return false;
    }
    setSyncErrorNotice(null);
    return true;
  }, [commitRuntimeSnapshot]);

  const reloadRuntimeSnapshot = useCallback(async () => {
    const refreshed = await hydration.refetch();
    if (!refreshed.data) {
      setSyncErrorNotice('Chưa thể tải trạng thái mới. Vui lòng kiểm tra kết nối và thử lại.');
      return;
    }
    hydrateRuntimeSnapshot(refreshed.data);
    resetSyncState();
    setSyncErrorNotice(null);
    setAutoMatchNotice(null);
  }, [hydrateRuntimeSnapshot, hydration, resetSyncState]);

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>, href: Route) {
    if (syncState === 'pending' || syncState === 'syncing' || syncState === 'error' || syncState === 'conflict') {
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
    const result = refreshNextMatches(selectedSuggestionMode);
    if (!result.changed) {
      const diagnostics = result.diagnostics?.length ? ` ${result.diagnostics.join(' ')}` : '';
      setAutoMatchNotice(`${getRuntimeValidationMessage(result) ?? 'Chưa tạo được gợi ý phù hợp.'}${diagnostics}`);
      return;
    }
    const diagnostics = result.diagnostics ?? suggestionDiagnostics;
    const shouldShowDiagnostics = diagnostics.some((line) => (
      line.includes('Không đủ')
      || line.includes('giới hạn')
      || line.includes('không có')
      || line.includes('không hợp lệ')
    ));
    setAutoMatchNotice(shouldShowDiagnostics ? diagnostics.join(' ') : null);
    void commitRuntimeWithNotice();
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

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (syncState !== 'pending' && syncState !== 'syncing' && syncState !== 'error' && syncState !== 'conflict') return;
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
        onOpenPaymentQr={() => setIsPaymentQrOpen(true)}
        onOpenMatchHistory={() => setIsMatchHistoryOpen(true)}
        onOpenPlayers={() => setIsPlayerFullscreenOpen(true)}
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
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(104px,0.7fr)_minmax(250px,1.6fr)_repeat(3,minmax(70px,0.55fr))] gap-1.5" aria-label="Thống kê nhanh điều phối">
            <StatPill label="Tổng" value={stats.total} tone="text-white" subText={`Nam: ${stats.male} | Nữ: ${stats.female}`} compact />
            <LevelDistributionStat levels={stats.levels} />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Trận kế" value={stats.nextRequested} tone="text-amber-200" compact />
            <StatPill label="Đang chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} /> : null}
        {historyError ? <RuntimeNotice message={historyError} /> : null}
        {syncErrorNotice ? <RuntimeNotice message={syncErrorNotice} actionLabel={hasRuntimeConflict ? 'Tải trạng thái mới' : undefined} onAction={hasRuntimeConflict ? reloadRuntimeSnapshot : undefined} /> : null}
        {autoMatchNotice ? <RuntimeNotice message={autoMatchNotice} /> : null}
      </header>

      {/* DESKTOP/TABLET LAYOUT */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 lg:px-4">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 shadow-[0_18px_48px_rgba(2,6,23,0.28)] backdrop-blur-xl" aria-label="Quản lý sân và trận tiếp theo">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-white/10 bg-white/[0.025] px-2.5 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-xs font-bold tracking-wider text-slate-100">QUẢN LÝ SÂN</h2>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-400">{session.courtCount} sân</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5">
                <span className="rounded-md border border-cyan-300/15 bg-cyan-400/15 px-2 py-1 text-[11px] font-semibold text-cyan-100">Trận tiếp theo</span>
                <SuggestionModePicker value={selectedSuggestionMode} onChange={setSelectedSuggestionMode} disabled={schedulingDisabled} />
                <button
                  onClick={refreshSuggestions}
                  disabled={schedulingDisabled}
                  title={autoMatchBlockReason ?? undefined}
                  aria-label="Auto gợi ý trận tiếp theo"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-cyan-300/30 bg-cyan-400/[0.12] px-2.5 text-[11px] font-semibold text-cyan-100 transition-colors hover:border-cyan-200/45 hover:bg-cyan-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
                >
                  <Zap className="h-3 w-3" />
                  Auto gợi ý
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto overscroll-contain p-2.5 min-[1100px]:grid-cols-[minmax(520px,1.15fr)_minmax(400px,0.85fr)] min-[1100px]:overflow-hidden xl:grid-cols-[minmax(620px,1.2fr)_minmax(430px,0.8fr)]">
              <div className="flex min-h-[min(52vh,560px)] flex-col gap-2 overflow-hidden min-[1100px]:min-h-0">
                <div className="min-h-0 flex-1 overflow-hidden pr-1">
                <LiveCourtsSection
                  showHeader={false}
                  schedulingDisabled={schedulingDisabled}
                  disabledReason={schedulingDisabledReason}
                  onCommitRuntime={commitRuntimeWithNotice}
                  onRecordMatch={recordMatchHistory}
                />
                </div>
                <PlayerStatusOverview players={players} />
              </div>
              <div className="min-h-[min(42vh,520px)] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-2 shadow-inner shadow-slate-950/30 min-[1100px]:min-h-0">
                <NextMatchQueue showHeader={false} schedulingDisabled={schedulingDisabled} disabledReason={schedulingDisabledReason} onCommitRuntime={commitRuntimeWithNotice} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="px-3 py-1.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Thống kê nhanh điều phối">
            <StatPill label="Tổng" value={stats.total} tone="text-white" subText={`Nam: ${stats.male} | Nữ: ${stats.female}`} compact />
            <LevelDistributionStat levels={stats.levels} compact />
            <StatPill label="Chờ" value={stats.waiting} tone="text-cyan-200" compact />
            <StatPill label="Trận kế" value={stats.nextRequested} tone="text-amber-200" compact />
            <StatPill label="Chơi" value={stats.playing} tone="text-emerald-200" compact />
          </div>
        </div>
        {schedulingDisabledReason ? <RuntimeNotice message={schedulingDisabledReason} compact /> : null}
        {historyError ? <RuntimeNotice message={historyError} compact /> : null}
        {syncErrorNotice ? <RuntimeNotice message={syncErrorNotice} compact actionLabel={hasRuntimeConflict ? 'Tải trạng thái mới' : undefined} onAction={hasRuntimeConflict ? reloadRuntimeSnapshot : undefined} /> : null}
        {autoMatchNotice ? <RuntimeNotice message={autoMatchNotice} compact /> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
          <LiveCourtsSection
            schedulingDisabled={schedulingDisabled}
            disabledReason={schedulingDisabledReason}
            onCommitRuntime={commitRuntimeWithNotice}
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
                aria-label="Auto gợi ý trận tiếp theo"
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-cyan-300/30 bg-cyan-400/[0.12] px-2.5 text-[11px] font-semibold text-cyan-100 transition hover:border-cyan-200/45 hover:bg-cyan-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/45 disabled:text-slate-500"
              >
                <Zap className="h-3 w-3" />
                Auto gợi ý
              </button>
            </div>
            <div className="border-b border-slate-800/60 px-3 py-2">
              <SuggestionModePicker value={selectedSuggestionMode} onChange={setSelectedSuggestionMode} disabled={schedulingDisabled} />
            </div>
            <div className="max-h-[46vh] min-h-[220px] overflow-hidden p-3">
              <NextMatchQueue showHeader={false} schedulingDisabled={schedulingDisabled} disabledReason={schedulingDisabledReason} onCommitRuntime={commitRuntimeWithNotice} />
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
              onCommitRuntime={commitRuntimeWithNotice}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <PaymentQrDialog
        open={isPaymentQrOpen}
        accounts={paymentBankAccounts}
        selectedAccount={selectedPaymentAccount}
        loading={paymentAccountsLoading}
        onSelectedAccountChange={setSelectedPaymentAccountId}
        onOpenChange={setIsPaymentQrOpen}
      />
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
  onLeave,
  onOpenPaymentQr,
  onOpenMatchHistory,
  onOpenPlayers
}: {
  sessionId: string | null;
  title: string;
  timeRange: string;
  status: string;
  syncState: string;
  onLeave: (event: MouseEvent<HTMLAnchorElement>, href: Route) => void;
  onOpenPaymentQr: () => void;
  onOpenMatchHistory: () => void;
  onOpenPlayers: () => void;
}) {
  const syncLabel = syncState === 'pending' ? 'Chờ đồng bộ' : syncState === 'syncing' ? 'Đang đồng bộ' : syncState === 'conflict' ? 'Xung đột dữ liệu' : syncState === 'error' ? 'Lỗi đồng bộ' : 'Đã đồng bộ';
  const sessionHref = (sessionId ? `/sessions/${sessionId}` : '/schedule') as Route;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-3 py-2 shadow-[0_8px_28px_rgba(2,6,23,0.24)] backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link href="/dashboard" onClick={(event) => onLeave(event, '/dashboard')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.045] px-2.5 text-[11px] font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href={sessionHref} onClick={(event) => onLeave(event, sessionHref)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/[0.12] px-2.5 text-[11px] font-bold text-cyan-50 transition hover:border-cyan-200/40 hover:bg-cyan-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70" aria-label="Về chi tiết ca">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Chi tiết ca</span>
          </Link>
          <FullscreenToggle compact className="h-9 w-9 shrink-0 rounded-lg" />
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

        <div className="flex min-w-0 items-center justify-end gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] p-1">
          <Button size="sm" variant="secondary" onClick={onOpenPaymentQr} className="h-8 shrink-0 rounded-lg px-2 text-[10px] focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:px-2.5 sm:text-[11px]" aria-label="Mở QR thanh toán">
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">QR thanh toán</span>
            <span className="sm:hidden">QR</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenMatchHistory} className="h-8 shrink-0 rounded-lg px-2 text-[10px] focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:px-2.5 sm:text-[11px]" aria-label="Mở lịch sử trận đấu">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lịch sử</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenPlayers} className="h-8 shrink-0 rounded-lg px-2 text-[10px] focus-visible:ring-2 focus-visible:ring-cyan-300/70 sm:px-2.5 sm:text-[11px]" aria-label="Mở danh sách người chơi toàn màn hình">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Người chơi</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function RuntimeNotice({ message, compact = false, actionLabel, onAction }: { message: string; compact?: boolean; actionLabel?: string; onAction?: () => void }) {
  return (
    <div role="status" className={`${compact ? 'mx-3 mb-1.5' : ''} flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-amber-300/25 bg-amber-400/[0.10] px-2.5 py-1.5 text-[11px] font-medium leading-4 text-amber-100 shadow-inner shadow-amber-950/20 sm:text-xs`}>
      <span className="min-w-0 flex-1">{message}</span>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="h-7 rounded-md border border-amber-200/30 bg-amber-200/15 px-2.5 text-[10px] font-bold text-amber-50 transition hover:bg-amber-200/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function PaymentQrDialog({
  open,
  accounts,
  selectedAccount,
  loading,
  onSelectedAccountChange,
  onOpenChange
}: {
  open: boolean;
  accounts: PaymentBankAccount[];
  selectedAccount: PaymentBankAccount | null;
  loading: boolean;
  onSelectedAccountChange: (accountId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="grid w-full min-w-0 gap-2 pr-12 sm:grid-cols-[auto_minmax(12rem,20rem)] sm:items-center sm:gap-4">
          <span className="truncate text-base font-black tracking-tight text-white sm:text-lg">QR thanh toán</span>
          {accounts.length > 0 ? (
            <select
              value={selectedAccount?.id ?? ''}
              onChange={(event) => onSelectedAccountChange(event.target.value)}
              aria-label="Chọn tài khoản nhận tiền"
              className="h-9 min-w-0 rounded-lg border border-cyan-300/25 bg-slate-950 px-2.5 text-xs font-bold text-slate-100 outline-none transition focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} · {account.bankName}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      }
      size="xl"
      className="max-w-3xl border-cyan-300/20 bg-slate-950 text-slate-100 shadow-[0_24px_80px_rgba(8,145,178,0.22)]"
      contentClassName="bg-slate-950 px-3 py-2.5 sm:px-4 sm:py-3"
    >
      {loading ? (
        <div className="grid min-h-56 place-items-center rounded-xl border border-white/10 bg-white/[0.035]">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-200 motion-reduce:animate-none" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.035] px-4 py-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm font-semibold text-slate-200">Chưa có tài khoản thanh toán</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Vào Cài đặt để thêm tên tài khoản, ngân hàng và ảnh QR.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 text-center sm:p-3">
            {selectedAccount ? (
              <>
                <div className="mx-auto w-full max-w-[min(48vh,21rem)] rounded-xl bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.32)]">
                  <Image
                    src={selectedAccount.qrUrl}
                    alt={`QR thanh toán ${selectedAccount.bankName}`}
                    width={640}
                    height={640}
                    unoptimized
                    className="mx-auto aspect-square w-full object-contain"
                  />
                </div>
                <div className="mx-auto mt-2 max-w-sm rounded-lg border border-cyan-300/15 bg-cyan-400/[0.08] px-3 py-1.5">
                  <p className="truncate text-sm font-black text-white" title={selectedAccount.accountName}>{selectedAccount.accountName}</p>
                  <p className="truncate text-xs font-semibold text-cyan-100" title={selectedAccount.bankName}>{selectedAccount.bankName}</p>
                </div>
              </>
            ) : null}
        </div>
      )}
    </Dialog>
  );
}

function StatPill({ label, value, tone, subText, compact = false }: { label: string; value: number; tone: string; subText?: string; compact?: boolean }) {
  return (
    <div
      aria-label={subText ? `${label}: ${value}, ${subText}` : `${label}: ${value}`}
      className={
        compact
          ? `${subText ? 'min-w-[104px]' : 'min-w-[70px]'} rounded-lg border px-2 py-1.5 shadow-inner shadow-slate-950/20 ${getStatPillSurfaceTone(label)}`
          : `rounded-xl border px-3 py-2 shadow-inner shadow-slate-950/20 ${getStatPillSurfaceTone(label)}`
      }
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <p className={`${compact ? 'text-[13px]' : 'text-base'} font-bold leading-5 ${tone}`}>{value}</p>
        {subText ? <p className="truncate text-[9px] font-semibold normal-case tracking-normal text-slate-300/80">({subText})</p> : null}
      </div>
      <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-slate-400/90">{label}</p>
    </div>
  );
}

function LevelDistributionStat({
  levels,
  compact = false
}: {
  levels: Array<{ value: number; label: string; male: number; female: number }>;
  compact?: boolean;
}) {
  const ariaLabel = levels.map((level) => `${level.label}: Nam ${level.male}, Nữ ${level.female}`).join('; ');
  return (
    <div aria-label={`Trình độ người chơi. ${ariaLabel}`} className={`${compact ? 'min-w-[300px]' : 'min-w-0'} rounded-lg border border-violet-300/15 bg-violet-400/[0.04] px-1.5 py-1.5 shadow-inner shadow-slate-950/20`}>
      <div className="grid grid-cols-6 gap-0.5">
        {levels.map((level) => (
          <div
            key={level.value}
            className={`min-w-0 rounded border px-1 py-0.5 text-center ${level.male + level.female > 0 ? 'border-white/[0.08] bg-slate-950/45' : 'border-white/[0.04] bg-slate-950/20 opacity-55'}`}
          >
            <div className="truncate text-[9px] font-black leading-3 text-slate-100">{level.label}</div>
            <div className="mt-0.5 grid grid-cols-2 overflow-hidden rounded border border-white/[0.06] text-[8px] font-black leading-3.5">
              <span className="bg-cyan-400/30 text-cyan-50">{level.male}</span>
              <span className="bg-pink-400/30 text-pink-50">{level.female}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatPillSurfaceTone(label: string): string {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('tổng')) return 'border-slate-300/15 bg-slate-300/[0.07]';
  if (normalizedLabel.includes('chờ')) return 'border-cyan-300/20 bg-cyan-400/[0.08]';
  if (normalizedLabel.includes('trận kế')) return 'border-amber-300/20 bg-amber-400/[0.08]';
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
    <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-md border border-white/10 bg-slate-950/60 p-0.5 shadow-inner shadow-slate-950/30" role="group" aria-label="Chế độ gợi ý xếp cặp">
      {SUGGESTION_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode.value)}
          aria-pressed={value === mode.value}
          className={`h-7 shrink-0 rounded px-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed ${
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
      })).filter((tag) => tag.count > 0),
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
        const leftWaitingSince = Number.isFinite(left.waitingSince) ? Number(left.waitingSince) : Number.POSITIVE_INFINITY;
        const rightWaitingSince = Number.isFinite(right.waitingSince) ? Number(right.waitingSince) : Number.POSITIVE_INFINITY;
        if (leftWaitingSince !== rightWaitingSince) return leftWaitingSince - rightWaitingSince;
        return left.name.localeCompare(right.name, 'vi');
      });
  }, [players]);
  const visiblePlayers = expanded ? sortedPlayers : [];

  return (
    <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5 shadow-inner shadow-slate-950/20">
      <div className={`flex items-center justify-between gap-2 ${expanded ? 'mb-1.5' : ''}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Theo dõi người chơi</div>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {sortedPlayers.length} người
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {tagStats.map((tag) => (
              <span
                key={tag.value}
                className={`rounded-full border px-1.5 py-0 text-[9px] font-semibold leading-4 ${tag.count > 0 ? tag.activeClassName : tag.className}`}
              >
                {tag.label} {tag.count}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-300 transition hover:border-cyan-300/30 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          aria-label={expanded ? 'Thu gọn hàng chờ' : 'Mở rộng hàng chờ'}
          aria-expanded={expanded}
          aria-controls={listId}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded ? <div id={listId} className="max-h-48 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Danh sách theo dõi người chơi">
          {visiblePlayers.map((player) => (
            <div key={player.id} role="listitem" className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5 rounded-lg border border-white/[0.06] bg-slate-950/50 px-2 py-1.5 transition-colors hover:border-cyan-300/20 hover:bg-slate-900/70">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold leading-4 text-slate-100" title={player.name}>{getDisplayPlayerName(player.name)}</div>
                <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium leading-4">
                  <span className={player.gender === 'Nữ' ? 'text-pink-200' : 'text-cyan-200'}>{player.gender}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-semibold text-cyan-200">{getLevelLabel(player.level)}</span>
                </div>
                <PlayerTagBadges tags={player.playerTags} compact className="mt-0.5" />
              </div>
              <div className="shrink-0">
                <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${getPlayerStatusTone(player.status)}`}>
                  {getPlayerStatusSummary(player)}
                </span>
              </div>
            </div>
          ))}
          {visiblePlayers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-3 py-5 text-center text-xs font-medium text-slate-500 sm:col-span-2">
              Chưa có người chơi trong ca.
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

function getPlayerStatusSummary(player: Player): string {
  const timeLabel = getPlayerWaitingTimeLabel(player) ?? getPlayerStatusAge(player);
  return [
    `${player.matchesPlayed} trận`,
    getPlayerStatusLabel(player.status),
    timeLabel
  ].filter((value): value is string => Boolean(value)).join(' · ');
}

function getPlayerWaitingTimeLabel(player: Player): string | null {
  if (player.status !== 'WAITING' && player.status !== 'JUST_FINISHED') return null;
  if (!Number.isFinite(player.waitingSince)) return null;

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - Number(player.waitingSince)) / 60_000));
  if (elapsedMinutes <= 0) return '<1p';
  if (elapsedMinutes < 60) return `${elapsedMinutes}p`;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return minutes > 0 ? `${hours}h${minutes}p` : `${hours}h`;
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

  const eligiblePlayers = players.filter((player) => isPlayerEligibleForAutoSuggestion(player));
  const arrivedLikeCount = players.filter((player) => {
    const tags = normalizePlayerTags(player.playerTags);
    return tags.includes('ARRIVED') && !tags.includes('NOT_ARRIVED');
  }).length;

  if (arrivedLikeCount === 0) {
    return 'Chưa có người chơi đã tới. Host và Trận kế không thay thế trạng thái điểm danh Đã tới.';
  }

  if (eligiblePlayers.length < 4) {
    return `Chỉ có ${eligiblePlayers.length} người đủ điều kiện. Cần tối thiểu 4 người đã tới, không End-Game và chưa được xếp ở sân khác.`;
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
