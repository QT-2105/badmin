'use client';

import Link from 'next/link';
import { AlertCircle, Check, ChevronDown, ImageUp, Loader2, Pencil, Play, Plus, Save, Square, Trash2, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import { PlayerFeeInput } from '@/components/player/player-fee-input';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { Switch } from '@/components/ui/form';
import { NoticeCard, PageFeedbackStack, PageHeader, PageShell, PageSummaryGrid, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Surface } from '@/components/ui/surface';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useCurrentUser } from '@/hooks/use-auth';
import { useShuttlecockProductOptions } from '@/hooks/use-inventory';
import { usePlaySession, useScheduleMutations } from '@/hooks/use-play-dates';
import { useSessionPlayerMutations, useSessionPlayers } from '@/hooks/use-session-players';
import { hasPermission } from '@/lib/auth/permissions';
import { preparePlayerAvatarForUpload } from '@/lib/client-image-upload';
import { formatCurrency } from '@/lib/date-format';
import { getLevelLabel, LEVEL_OPTIONS } from '@/lib/player-labels';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';
import type { SessionPlayerPayload } from '@/services/session-players-service';

import styles from './session-detail-client.module.css';

export function SessionDetailClient({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = usePlaySession(sessionId);
  const { data: currentUser } = useCurrentUser();
  const { data: players = [], isLoading: playersLoading, error: playersError } = useSessionPlayers(sessionId);
  const { data: shuttlecockProducts = [] } = useShuttlecockProductOptions();
  const { settings } = useAppSettings();
  const { createPlayer, updatePlayer, deletePlayer, uploadAvatar, deleteAvatar } = useSessionPlayerMutations(sessionId);
  const { updatePlaySession, completePlaySession } = useScheduleMutations(session?.playDateId);
  const [form, setForm] = useState<PlayerFormState>(emptyPlayerForm);
  const [editForm, setEditForm] = useState<PlayerFormState>(emptyPlayerForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);
  const [courtCost, setCourtCost] = useState('');
  const [shuttlecockProductId, setShuttlecockProductId] = useState('');
  const [shuttlecockPiecesUsed, setShuttlecockPiecesUsed] = useState('');
  const [extraExpenseTitle, setExtraExpenseTitle] = useState('');
  const [extraExpenseAmount, setExtraExpenseAmount] = useState('');
  const [autoCreateExtraExpenseTransaction, setAutoCreateExtraExpenseTransaction] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [completionExpanded, setCompletionExpanded] = useState(true);
  const [completionDetailsExpanded, setCompletionDetailsExpanded] = useState(false);
  const [previewProfit, setPreviewProfit] = useState<number | null>(null);
  const [completionDraftSaved, setCompletionDraftSaved] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [playerActionError, setPlayerActionError] = useState<string | null>(null);
  const [playerSort, setPlayerSort] = useState<PlayerSortValue>('DEFAULT');
  const [addPlayerDetailsExpanded, setAddPlayerDetailsExpanded] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const extraExpenseTransactionSwitchId = useId();
  const extraExpenseTransactionHintId = useId();
  const normalizedStatus = normalizeSessionStatus(session?.status);
  const runtimeLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';
  const requiredPlayers = (session?.courtCount ?? 1) * 6;
  const canStartSession = players.length >= requiredPlayers;
  const canOperateSession = hasPermission(currentUser ?? null, 'session.operate');
  const canCompleteSession = hasPermission(currentUser ?? null, 'session.complete');
  const selectedShuttlecock = shuttlecockProducts.find((product) => product.id === shuttlecockProductId);
  const selectedShuttlecockLabel = selectedShuttlecock
    ? selectedShuttlecock.brand
      ? `${selectedShuttlecock.name} · ${selectedShuttlecock.brand}`
      : selectedShuttlecock.name
    : session?.shuttlecockProductName || 'Chưa lưu';
  const shuttlecockExpense = selectedShuttlecock
    ? Number(shuttlecockPiecesUsed || 0) * selectedShuttlecock.avgUsagePricePerBall
    : 0;
  const extraExpenseValue = Number(extraExpenseAmount || 0);

  useEffect(() => {
    if (!session) return;
    setCourtCost(String(session.courtCost || ''));
    setShuttlecockPiecesUsed(String(session.shuttlecockPiecesUsed || ''));
    setExtraExpenseTitle(session.extraExpenseTitle || '');
    setExtraExpenseAmount(session.extraExpenseAmount ? String(session.extraExpenseAmount) : '');
    setSessionNote(session.note || '');
    setCompletionDetailsExpanded(Boolean(session.extraExpenseAmount || session.extraExpenseTitle || session.note));
    setCompletionDraftSaved(Boolean(session.courtCost || session.shuttlecockPiecesUsed || session.extraExpenseAmount || session.note));
  }, [session]);

  useEffect(() => {
    if (!session || shuttlecockProductId || shuttlecockProducts.length === 0) return;
    const savedProduct = session.shuttlecockProductId
      ? shuttlecockProducts.find((product) => product.id === session.shuttlecockProductId)
      : session.shuttlecockProductName
        ? shuttlecockProducts.find((product) => product.name === session.shuttlecockProductName)
        : null;
    if (savedProduct) {
      setShuttlecockProductId(savedProduct.id);
    }
  }, [session, shuttlecockProductId, shuttlecockProducts]);

  useEffect(() => {
    if (!editAvatarFile) {
      setEditAvatarPreview(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(editAvatarFile);
    setEditAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [editAvatarFile]);

  const paymentTotals = useMemo(() => {
    return players.reduce(
      (acc, player) => {
        const payable = Math.max(0, player.paymentAmount - player.discount);
        acc.expected += payable;
        if (player.paymentStatus === 'PAID') acc.paid += payable;
        return acc;
      },
      { expected: 0, paid: 0 }
    );
  }, [players]);
  const draftCompletionExpense = Number(courtCost || 0) + shuttlecockExpense + extraExpenseValue;
  const draftCompletionProfit = paymentTotals.expected - draftCompletionExpense;
  const actualCompletionProfit = paymentTotals.paid - draftCompletionExpense;
  const visibleCompletionProfit = normalizedStatus === 'COMPLETED'
    ? session?.totalProfit ?? actualCompletionProfit
    : previewProfit ?? draftCompletionProfit;
  const completionProfitLabel = normalizedStatus === 'COMPLETED' ? 'Lợi nhuận' : 'Lợi nhuận tạm tính';
  const paidSlotCount = players.filter((player) => player.paymentStatus === 'PAID').length;
  const completionCourtCount = Math.max(session?.courtCount ?? 0, 1);
  const completionCourtCost = Number(courtCost || 0);
  const completionProfit = paymentTotals.paid - completionCourtCost - shuttlecockExpense - extraExpenseValue;

  const unpaidPlayers = useMemo(() => players.filter((player) => player.paymentStatus !== 'PAID' && player.paymentStatus !== 'WAIVED'), [players]);
  const genderCounts = useMemo(() => players.reduce(
    (acc, player) => {
      if (player.gender === 'Nữ') acc.female += 1;
      else if (player.gender === 'Nam') acc.male += 1;
      return acc;
    },
    { male: 0, female: 0 }
  ), [players]);
  const displayedPlayers = useMemo(() => {
    const list = [...players];
    if (playerSort === 'NAME_ASC') {
      return list.sort((first, second) => first.fullName.localeCompare(second.fullName, 'vi'));
    }
    if (playerSort === 'NAME_DESC') {
      return list.sort((first, second) => second.fullName.localeCompare(first.fullName, 'vi'));
    }
    if (playerSort === 'UNPAID_FIRST') {
      return list.sort((first, second) => {
        const firstUnpaid = first.paymentStatus !== 'PAID' && first.paymentStatus !== 'WAIVED';
        const secondUnpaid = second.paymentStatus !== 'PAID' && second.paymentStatus !== 'WAIVED';
        return Number(secondUnpaid) - Number(firstUnpaid);
      });
    }
    if (playerSort === 'GENDER_FEMALE_MALE') {
      return list.sort((first, second) => genderSortRank(first.gender) - genderSortRank(second.gender));
    }
    if (playerSort === 'FEE_ASC') {
      return list.sort((first, second) => payableAmount(first) - payableAmount(second));
    }
    if (playerSort === 'FEE_DESC') {
      return list.sort((first, second) => payableAmount(second) - payableAmount(first));
    }
    return list;
  }, [playerSort, players]);
  const playerFinance = useMemo(() => players.reduce(
    (acc, player) => {
      const payable = Math.max(0, player.paymentAmount - player.discount);
      if (player.paymentStatus !== 'PAID') acc.unpaid += payable;
      if (player.paymentStatus === 'PAID' && player.paymentMethod === 'BANK') acc.bank += payable;
      if (player.paymentStatus === 'PAID' && player.paymentMethod !== 'BANK') acc.cash += payable;
      return acc;
    },
    { cash: 0, bank: 0, unpaid: 0 }
  ), [players]);

  async function submitPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlayerActionError(null);
    const payload = normalizePlayerForm(form);
    if (!payload.fullName) return;

    try {
      setIsPreparingAvatar(Boolean(formAvatarFile));
      const avatarFile = formAvatarFile ? await preparePlayerAvatarForUpload(formAvatarFile) : null;
      const created = await createPlayer.mutateAsync(payload);
      if (avatarFile) {
        await uploadAvatar.mutateAsync({ id: created.id, file: avatarFile });
      }
      setForm(emptyPlayerForm);
      setFormAvatarFile(null);
      setAddPlayerDetailsExpanded(false);
    } catch (caught) {
      setPlayerActionError(caught instanceof Error ? caught.message : 'Không thể thêm người chơi');
    } finally {
      setIsPreparingAvatar(false);
    }
  }

  function beginEdit(playerId: string) {
    const player = players.find((item) => item.id === playerId);
    if (!player) return;

    setEditingId(player.id);
    setEditForm({
      fullName: player.fullName,
      gender: player.gender || 'Nam',
      level: String(player.level),
      paymentAmount: String(player.paymentAmount),
      discount: String(player.discount),
      paymentMethod: player.paymentMethod || '',
      paymentStatus: player.paymentStatus,
      note: player.note || ''
    });
    setEditAvatarFile(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyPlayerForm);
  }

  async function saveInlineEdit() {
    if (!editingId) return;
    const payload = normalizePlayerForm(editForm);
    if (!payload.fullName) return;
    setPlayerActionError(null);
    try {
      setIsPreparingAvatar(Boolean(editAvatarFile));
      const avatarFile = editAvatarFile ? await preparePlayerAvatarForUpload(editAvatarFile) : null;
      await updatePlayer.mutateAsync({ id: editingId, payload });
      if (avatarFile) {
        await uploadAvatar.mutateAsync({ id: editingId, file: avatarFile });
      }
      cancelEdit();
    } catch (caught) {
      setPlayerActionError(caught instanceof Error ? caught.message : 'Không thể cập nhật người chơi');
    } finally {
      setIsPreparingAvatar(false);
    }
  }

  async function setStatus(status: 'ACTIVE') {
    await updatePlaySession.mutateAsync({ id: sessionId, payload: { status } });
  }

  function resetCompletionPreview() {
    setCompletionDraftSaved(false);
    setPreviewProfit(null);
  }

  function setNumericDraft(value: string, maxLength: number, maxValue: number, setter: (next: string) => void) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, maxLength);
    const nextValue = digitsOnly ? String(Math.min(Number(digitsOnly), maxValue)) : '';
    setter(nextValue);
    resetCompletionPreview();
  }

  function validateCompletion() {
    if (Number(courtCost) <= 0) return 'Vui lòng nhập chi phí sân trước khi hoàn tất ca.';
    if (Number(courtCost) > 99999999) return 'Chi phí sân tối đa 99.999.999đ.';
    if (!shuttlecockProductId) return 'Vui lòng chọn loại cầu hao trong ca.';
    if (selectedShuttlecock && selectedShuttlecock.avgUsagePricePerBall <= 0) return 'Loại cầu chưa có giá cầu hao bình quân. Vui lòng nhập kho cầu.';
    if (Number(shuttlecockPiecesUsed) < 1 || Number(shuttlecockPiecesUsed) > 100) return 'Số lượng cầu hao phải từ 1 đến 100 quả.';
    if (extraExpenseValue > 0 && !extraExpenseTitle.trim()) return 'Vui lòng nhập nội dung chi phí phát sinh.';
    if (extraExpenseValue > 99999999) return 'Chi phí phát sinh tối đa 99.999.999đ.';
    return null;
  }

  function buildCompletionPayload() {
    return {
      courtCost: Number(courtCost),
      shuttlecockPiecesUsed: Number(shuttlecockPiecesUsed),
      shuttlecockProductId: selectedShuttlecock?.id ?? session?.shuttlecockProductId ?? null,
      shuttlecockProductName: selectedShuttlecock?.name ?? session?.shuttlecockProductName ?? null,
      extraExpenseTitle: extraExpenseTitle.trim() || null,
      extraExpenseAmount: extraExpenseValue,
      note: sessionNote.trim() || null,
      totalIncome: paymentTotals.expected,
      totalExpense: draftCompletionExpense,
      totalProfit: draftCompletionProfit
    };
  }

  function requestCompleteSession() {
    const message = validateCompletion();
    setCompletionError(message);
    if (message) return;
    setShowCompleteConfirm(true);
  }

  async function updateCompletionDraft() {
    const message = validateCompletion();
    setCompletionError(message);
    if (message) return;
    await updatePlaySession.mutateAsync({
      id: sessionId,
      payload: buildCompletionPayload()
    });
    setPreviewProfit(draftCompletionProfit);
    setCompletionDraftSaved(true);
  }

  async function confirmCompleteSession() {
    const message = validateCompletion();
    setCompletionError(message);
    if (message) return;

    try {
      if (!completionDraftSaved) {
        await updatePlaySession.mutateAsync({
          id: sessionId,
          payload: buildCompletionPayload()
        });
      }
      await completePlaySession.mutateAsync({
        id: sessionId,
        payload: {
          courtCost: Number(courtCost),
          shuttlecockProductId,
          shuttlecockPiecesUsed: Number(shuttlecockPiecesUsed),
          extraExpenseTitle: extraExpenseTitle.trim() || null,
          extraExpenseAmount: extraExpenseValue,
          note: sessionNote.trim() || null,
          autoCreateCourtFeeTransaction: settings.autoCreateCourtFeeTransaction,
          autoCreateShuttlecockUsageTransaction: settings.autoCreateShuttlecockUsageTransaction,
          autoCreateExtraExpenseTransaction
        }
      });
      setShowCompleteConfirm(false);
    } catch (caught) {
      setCompletionError(caught instanceof Error ? caught.message : 'Không thể hoàn tất ca');
      setShowCompleteConfirm(false);
    }
  }

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        backAction={
          <Link
            href={session ? `/schedule/${session.playDateId}` : '/schedule'}
            className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground shadow-subtle outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Quay lại chi tiết ngày chơi"
          >
            ← Quay lại lịch
          </Link>
        }
        title={session?.name || 'Ca chơi'}
        description={session ? `${session.startTime}-${session.endTime} · ${session.courtCount} sân` : 'Đang tải'}
        actions={
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
            {session ? (
              <StatusBadge
                tone={normalizedStatus === 'COMPLETED' ? 'success' : normalizedStatus === 'ACTIVE' ? 'info' : normalizedStatus === 'CANCELLED' ? 'danger' : 'warning'}
              >
                {getSessionStatusLabel(session.status)}
              </StatusBadge>
            ) : null}
          {normalizedStatus === 'PENDING' && canOperateSession ? (
            <Button size="sm" onClick={() => setStatus('ACTIVE')} disabled={updatePlaySession.isPending || !canStartSession} className="h-10 shrink-0 hover:bg-primary-hover hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50">
              {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Bắt đầu ca
            </Button>
          ) : null}
          {normalizedStatus === 'ACTIVE' && canCompleteSession ? (
            <Button size="sm" variant="secondary" onClick={requestCompleteSession} disabled={completePlaySession.isPending} className="h-10 shrink-0 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50">
              {completePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Hoàn tất ca
            </Button>
          ) : null}
          <Link href={`/sessions/${sessionId}/runtime`} className="shrink-0">
            <Button size="sm" variant={normalizedStatus === 'ACTIVE' ? 'primary' : 'secondary'} className="h-10 hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50">Điều phối</Button>
          </Link>
          </div>
        }
      />

      {(isLoading || error || (!canStartSession && normalizedStatus === 'PENDING' && session)) ? (
        <PageFeedbackStack>
          {isLoading ? <NoticeCard>Đang tải ca chơi...</NoticeCard> : null}
          {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
          {!canStartSession && normalizedStatus === 'PENDING' && session ? (
            <NoticeCard tone="warning" className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Cần ít nhất {requiredPlayers} người chơi cho {session.courtCount} sân trước khi bắt đầu ca. Hiện có {players.length} người.</span>
            </NoticeCard>
          ) : null}
        </PageFeedbackStack>
      ) : null}

      {session ? (
        <PageSummaryGrid className="md:grid-cols-3">
          <StatCard
            density="compact"
            label="Thời gian"
            value={`${session.startTime}-${session.endTime}`}
            tone="info"
          />
          <StatCard
            density="compact"
            label="Người chơi"
            value={(
              <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span>{players.length}</span>
                <span className="text-xs font-semibold text-muted-foreground md:text-sm">
                  (Nữ: {genderCounts.female} | Nam: {genderCounts.male})
                </span>
              </span>
            )}
            tone="neutral"
          />
          <StatCard
            density="compact"
            label="Thu dự kiến"
            value={`${formatCurrency(paymentTotals.expected)}đ`}
            tone="income"
          />
        </PageSummaryGrid>
      ) : null}

      <Surface padding="md" className={`${styles.completionSection} space-y-3`}>
        <div className={`${styles.completionHeader} flex flex-col gap-2`}>
          <div>
            <h2 className="text-section-title">Thông tin hoàn tất ca</h2>
            <p className="text-sm text-muted-foreground">Lưu chi phí sân, cầu hao, phát sinh và ghi chú trước khi hoàn tất ca.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums ${
              visibleCompletionProfit < 0
                ? 'border-danger/25 bg-danger-soft text-danger'
                : 'border-info/25 bg-info-soft text-info'
            }`}>{completionProfitLabel}: {formatCurrency(visibleCompletionProfit)}đ</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCompletionExpanded((open) => !open)} className="hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50">
              <ChevronDown className={`h-4 w-4 transition-transform ${completionExpanded ? 'rotate-180' : ''}`} />
              {completionExpanded ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        </div>
        {completionError ? (
          <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
            {completionError}
          </div>
        ) : null}

        {completionExpanded ? (
        <div className={`${styles.completionGrid} grid min-w-0 gap-3`}>
          <Surface variant="subtle" padding="sm" className={`${styles.completionCourtCost} min-w-0 border-info/20 bg-info-soft/40 md:p-3`}>
            <label className="block">
              <span className={formLabelClass}>Chi phí sân</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={courtCost}
                onChange={(event) => setNumericDraft(event.target.value, 8, 99999999, setCourtCost)}
                disabled={runtimeLocked || !canCompleteSession}
                className={`${formInputClass} h-11 text-right tabular-nums`}
              />
            </label>
          </Surface>
          <Surface variant="subtle" padding="sm" className={`${styles.completionProduct} min-w-0 border-warning/20 bg-warning-soft/30 md:p-3`}>
            <label className="block">
              <span className={formLabelClass}>Loại cầu hao</span>
              <select value={shuttlecockProductId} onChange={(event) => { setShuttlecockProductId(event.target.value); setCompletionDraftSaved(false); setPreviewProfit(null); }} disabled={runtimeLocked || !canCompleteSession} className={`${formInputClass} h-11`}>
                <option value="">Chọn cầu</option>
                {shuttlecockProducts.map((product) => (
                  <option key={product.id} value={product.id}>{truncateLabel(product.brand ? `${product.name} · ${product.brand}` : product.name, 100)}</option>
                ))}
              </select>
            </label>
          </Surface>
          <Surface variant="subtle" padding="sm" className={`${styles.completionUsage} min-w-0 border-warning/20 bg-warning-soft/30 md:p-3`}>
            <label className="block">
              <span className={formLabelClass}>Cầu hao</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={shuttlecockPiecesUsed}
                onChange={(event) => setNumericDraft(event.target.value, 3, 100, setShuttlecockPiecesUsed)}
                disabled={runtimeLocked || !canCompleteSession}
                className={`${formInputClass} h-11 text-right tabular-nums`}
              />
            </label>
          </Surface>
          <Button type="button" variant="secondary" onClick={() => void updateCompletionDraft()} disabled={runtimeLocked || !canCompleteSession || updatePlaySession.isPending} className={`${styles.completionUpdate} h-11 w-full justify-center hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50`}>
            {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Cập nhật
          </Button>
          <Surface variant="subtle" padding="sm" className={`${styles.completionDetails} min-w-0`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phát sinh và ghi chú</div>
                <p className="mt-1 text-xs text-muted-foreground">Loại cầu hao đã lưu: {selectedShuttlecockLabel}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => setCompletionDetailsExpanded((open) => !open)}
                aria-label={completionDetailsExpanded ? 'Thu gọn phát sinh và ghi chú' : 'Mở rộng phát sinh và ghi chú'}
                className="h-9 w-9 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${completionDetailsExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            {completionDetailsExpanded ? (
              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px] lg:grid-cols-[minmax(240px,1fr)_180px_172px]">
                <label className="block">
                  <span className={formLabelClass}>Nội dung chi phí phát sinh</span>
                  <input
                    value={extraExpenseTitle}
                    maxLength={100}
                    onChange={(event) => { setExtraExpenseTitle(event.target.value.slice(0, 100)); resetCompletionPreview(); }}
                    disabled={runtimeLocked || !canCompleteSession}
                    className={`${formInputClass} h-11`}
                    placeholder="VD: Nước uống, băng sân..."
                  />
                </label>
                <label className="block">
                  <span className={formLabelClass}>Phí phát sinh</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={extraExpenseAmount}
                    onChange={(event) => setNumericDraft(event.target.value, 8, 99999999, setExtraExpenseAmount)}
                    disabled={runtimeLocked || !canCompleteSession}
                    className={`${formInputClass} h-11 text-right tabular-nums`}
                  />
                </label>
                <div className="block md:col-span-2 lg:col-span-1">
                  <label htmlFor={extraExpenseTransactionSwitchId} className={formLabelClass}>Tạo phiếu chi</label>
                  <div className="mt-1 flex min-h-11 flex-wrap items-center gap-2">
                    <label
                      htmlFor={extraExpenseTransactionSwitchId}
                      className={`inline-flex h-9 w-fit items-center gap-2 rounded-full border px-2.5 transition-colors focus-within:ring-2 focus-within:ring-focus/15 motion-reduce:transition-none ${
                        runtimeLocked || !canCompleteSession
                          ? 'cursor-not-allowed border-border bg-surface-subtle opacity-60'
                          : autoCreateExtraExpenseTransaction
                            ? 'cursor-pointer border-success/30 bg-success-soft/45 hover:bg-success-soft/65'
                            : 'cursor-pointer border-border bg-background hover:border-inputHover'
                      }`}
                    >
                      <Switch
                        id={extraExpenseTransactionSwitchId}
                        checked={autoCreateExtraExpenseTransaction}
                        onChange={(event) => setAutoCreateExtraExpenseTransaction(event.target.checked)}
                        disabled={runtimeLocked || !canCompleteSession}
                        aria-describedby={extraExpenseTransactionHintId}
                        aria-label="Tự động tạo phiếu chi cho phí phát sinh"
                        className="h-5 w-9 shrink-0 before:h-4 before:w-4 checked:before:translate-x-4"
                      />
                      <span className={`min-w-5 text-xs font-semibold ${autoCreateExtraExpenseTransaction ? 'text-success' : 'text-muted-foreground'}`}>
                        {autoCreateExtraExpenseTransaction ? 'Bật' : 'Tắt'}
                      </span>
                    </label>
                    <span id={extraExpenseTransactionHintId} className="text-xs leading-4 text-muted-foreground">
                      Phân loại Khác
                    </span>
                  </div>
                </div>
                <label className="block md:col-span-2 lg:col-span-3">
                  <span className={formLabelClass}>Ghi chú ca</span>
                  <textarea
                    value={sessionNote}
                    onChange={(event) => { setSessionNote(event.target.value); resetCompletionPreview(); }}
                    disabled={runtimeLocked || !canCompleteSession}
                    className={`${formInputClass} min-h-[92px] resize-y py-3`}
                    placeholder="Ghi chú vận hành, thanh toán hoặc phát sinh trong ca."
                  />
                </label>
              </div>
            ) : null}
          </Surface>
        </div>
        ) : null}
      </Surface>

      <Surface padding="md" className="space-y-2">
        <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-section-title">Danh sách người chơi</h2>
            <p className="text-sm text-muted-foreground">Theo dõi thanh toán của người chơi trong ca.</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Surface variant="subtle" padding="sm" className="min-h-[46px] border-success/20 bg-success-soft/50 px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tiền mặt</span>
                <span className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums">{formatCurrency(playerFinance.cash)}đ</span>
              </div>
              <StatusBadge tone="success">TM</StatusBadge>
            </div>
          </Surface>
          <Surface variant="subtle" padding="sm" className="min-h-[46px] border-info/20 bg-info-soft/50 px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Chuyển khoản</span>
                <span className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums">{formatCurrency(playerFinance.bank)}đ</span>
              </div>
              <StatusBadge tone="info">CK</StatusBadge>
            </div>
          </Surface>
          <Surface variant="subtle" padding="sm" className="min-h-[46px] border-warning/25 bg-warning-soft/50 px-3 py-2">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Chưa thu</span>
                <span className="shrink-0 font-mono text-sm font-semibold text-foreground tabular-nums">{formatCurrency(playerFinance.unpaid)}đ</span>
              </div>
              <StatusBadge tone="warning">Chưa TT</StatusBadge>
            </div>
          </Surface>
        </div>

        {canOperateSession ? (
        <Surface variant="subtle" padding="sm" className="p-2.5">
          <form onSubmit={submitPlayer} className="space-y-2.5">
            <div className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(180px,1fr)_92px_84px_120px_40px_90px] md:items-end xl:grid-cols-[minmax(320px,1fr)_96px_88px_132px_40px_96px]">
              <label className="block min-w-0">
                <span className={formLabelClass}>Tên người chơi</span>
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  className={`${formInputClass} h-10`}
                  required
                />
              </label>
              <label className="block min-w-0">
                <span className={formLabelClass}>Giới tính</span>
                <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className={`${formInputClass} h-10`}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
              <label className="block min-w-0">
                <span className={formLabelClass}>Trình độ</span>
                <select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} className={`${formInputClass} h-10`}>
                  {LEVEL_OPTIONS.slice(0, 6).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className={formLabelClass}>Phí</span>
                <PlayerFeeInput
                  value={form.paymentAmount}
                  onChange={(value) => setForm((current) => ({ ...current, paymentAmount: value }))}
                />
              </label>
              <label className="block w-10">
                <span className={formLabelClass}>Ảnh</span>
                <span
                  className="mt-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-input bg-background text-info outline-none transition hover:border-inputHover hover:bg-surface-hover focus-within:ring-2 focus-within:ring-focus/15"
                  title="JPG, PNG hoặc WEBP tối đa 25MB · tự động tối ưu trước khi tải lên"
                >
                  <ImageUp className={`h-5 w-5 ${formAvatarFile ? 'text-info' : ''}`} />
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Chọn hoặc chụp ảnh người chơi mới"
                  className="sr-only"
                  onChange={(event) => setFormAvatarFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <div className="flex min-w-0 flex-col gap-1.5 md:items-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  iconOnly
                  onClick={() => setAddPlayerDetailsExpanded((open) => !open)}
                  aria-label={addPlayerDetailsExpanded ? 'Thu gọn ghi chú thêm người chơi' : 'Mở rộng ghi chú thêm người chơi'}
                  className="h-8 w-8 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${addPlayerDetailsExpanded ? 'rotate-180' : ''}`} />
                </Button>
                <Button type="submit" size="sm" disabled={runtimeLocked || isPreparingAvatar || createPlayer.isPending || uploadAvatar.isPending} className="h-9 w-full min-w-[84px] rounded-lg px-2.5 hover:bg-primary-hover hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50">
                  {isPreparingAvatar || createPlayer.isPending || uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Thêm
                </Button>
              </div>
            </div>
            {addPlayerDetailsExpanded ? (
              <label className="block min-w-0">
                <span className={formLabelClass}>Ghi chú</span>
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  className={`${formInputClass} min-h-[76px] resize-y py-2.5`}
                  placeholder="Ghi chú người chơi (tuỳ chọn)"
                />
              </label>
            ) : null}
          </form>
        </Surface>
        ) : null}

        {(playersLoading || playersError || playerActionError) ? (
          <PageFeedbackStack>
            {playersLoading ? <NoticeCard>Đang tải người chơi...</NoticeCard> : null}
            {playersError ? <NoticeCard tone="danger">{playersError.message}</NoticeCard> : null}
            {playerActionError ? <NoticeCard tone="warning">{playerActionError}</NoticeCard> : null}
          </PageFeedbackStack>
        ) : null}

        <div aria-label="Danh sách người chơi trong ca" className={`${styles.playerList} space-y-1.5`}>
          {players.length > 0 ? (
            <>
              <Surface variant="subtle" padding="sm" className={`${styles.mobileListHeader} items-center justify-between gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground`}>
                <span>Danh sách</span>
                <label className="flex min-w-0 items-center">
                  <span className="sr-only">Sắp xếp danh sách người chơi</span>
                  <select
                    value={playerSort}
                    onChange={(event) => setPlayerSort(event.target.value as PlayerSortValue)}
                    className="h-8 w-auto max-w-[min(64vw,11rem)] rounded-lg border border-input bg-background px-2 text-xs font-semibold normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/30"
                    aria-label="Sắp xếp danh sách người chơi"
                  >
                    <option value="DEFAULT">Mặc định</option>
                    <option value="GENDER_FEMALE_MALE">Nữ - Nam</option>
                    <option value="UNPAID_FIRST">Chưa thanh toán</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                    <option value="NAME_DESC">Tên Z-A</option>
                    <option value="FEE_ASC">Phí Thấp - Cao</option>
                    <option value="FEE_DESC">Phí Cao - Thấp</option>
                  </select>
                </label>
              </Surface>
              <Surface variant="subtle" padding="sm" className={`${styles.desktopListHeader} gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground`}>
                <div>Tên người chơi</div>
                <div>Tổng set</div>
                <div>Phí</div>
                <div>Thanh toán</div>
                <div>Ghi chú</div>
                <label className="flex items-center justify-end">
                  <span className="sr-only">Sắp xếp danh sách người chơi</span>
                  <select
                    value={playerSort}
                    onChange={(event) => setPlayerSort(event.target.value as PlayerSortValue)}
                    className="h-8 w-auto max-w-full rounded-lg border border-input bg-background px-2 text-xs font-semibold normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/30"
                    aria-label="Sắp xếp danh sách người chơi"
                  >
                    <option value="DEFAULT">Mặc định</option>
                    <option value="GENDER_FEMALE_MALE">Nữ - Nam</option>
                    <option value="UNPAID_FIRST">Chưa thanh toán</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                    <option value="NAME_DESC">Tên Z-A</option>
                    <option value="FEE_ASC">Phí Thấp - Cao</option>
                    <option value="FEE_DESC">Phí Cao - Thấp</option>
                  </select>
                </label>
              </Surface>
            </>
          ) : null}
          {displayedPlayers.map((player) => {
            const payable = Math.max(0, player.paymentAmount - player.discount);
            const isEditing = editingId === player.id;
            const displayName = truncatePlayerName(player.fullName, 30);
            if (isEditing) {
              return (
                <Surface key={player.id} variant="subtle" padding="sm" className="border-info/25 bg-info-soft/60 text-sm">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[auto_2fr_repeat(5,minmax(0,1fr))] xl:items-end">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-full ring-2 ring-border transition hover:ring-info/40 focus-within:ring-2 focus-within:ring-focus/25" title="JPG, PNG hoặc WEBP tối đa 25MB · tự động tối ưu trước khi tải lên">
                        <PlayerAvatar name={editForm.fullName || player.fullName} gender={editForm.gender} avatarUrl={editAvatarPreview ?? player.avatarUrl} size="lg" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-label={`Đổi ảnh người chơi ${editForm.fullName || player.fullName}`}
                          className="sr-only"
                          onChange={(event) => setEditAvatarFile(event.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    <label className="block min-w-0 sm:col-span-2 xl:col-span-2">
                      <span className={formLabelClass}>Tên người chơi</span>
                      <input
                        value={editForm.fullName}
                        onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))}
                        className={formInputClass}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className={formLabelClass}>Giới tính</span>
                      <select value={editForm.gender} onChange={(event) => setEditForm((current) => ({ ...current, gender: event.target.value }))} className={formInputClass}>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className={formLabelClass}>Trình độ</span>
                      <select value={editForm.level} onChange={(event) => setEditForm((current) => ({ ...current, level: event.target.value }))} className={formInputClass}>
                        {LEVEL_OPTIONS.slice(0, 6).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className={formLabelClass}>Phí</span>
                      <PlayerFeeInput
                        value={editForm.paymentAmount}
                        onChange={(value) => setEditForm((current) => ({ ...current, paymentAmount: value }))}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className={formLabelClass}>Thanh toán</span>
                      <select value={getPaymentEditValue(editForm)} onChange={(event) => setEditForm((current) => withPaymentEditValue(current, event.target.value as PaymentEditValue))} className={formInputClass}>
                        <option value="UNPAID">Chưa thu</option>
                        <option value="CASH">Tiền mặt</option>
                        <option value="BANK">Chuyển khoản</option>
                        <option value="WAIVED">Free</option>
                      </select>
                    </label>
                    <label className="block min-w-0 sm:col-span-2 xl:col-span-full">
                      <span className={formLabelClass}>Ghi chú</span>
                      <textarea
                        value={editForm.note}
                        onChange={(event) => setEditForm((current) => ({ ...current, note: event.target.value }))}
                        className={`${formInputClass} min-h-[76px] resize-y py-2.5`}
                        placeholder="Ghi chú người chơi (tuỳ chọn)"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                      {player.avatarUrl ? (
                        <Button type="button" variant="ghost" disabled={deleteAvatar.isPending} onClick={() => void deleteAvatar.mutateAsync(player.id)} className="h-10 px-3 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50">
                          Xóa ảnh
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" disabled={isPreparingAvatar || updatePlayer.isPending || uploadAvatar.isPending} onClick={() => void saveInlineEdit()} className="h-10 px-3 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50" aria-label={`Lưu chỉnh sửa ${editForm.fullName || player.fullName}`}>
                        {isPreparingAvatar || updatePlayer.isPending || uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="ghost" onClick={cancelEdit} className="h-10 px-3 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50" aria-label={`Hủy chỉnh sửa ${editForm.fullName || player.fullName}`}>
                        <X className="h-4 w-4" />
                      </Button>
                  </div>
                </Surface>
              );
            }

            return (
              <Surface
                key={player.id}
                padding="sm"
                className={`${styles.playerRow} gap-x-3 gap-y-1.5 px-3 py-2 text-sm`}
              >
                <button
                  type="button"
                  aria-label={`Xem nhanh người chơi ${player.fullName}`}
                  onClick={() => setQuickViewPlayer(toQuickViewPlayer(player))}
                  title={player.fullName}
                  className={`${styles.playerIdentity} flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface`}
                >
                  <PlayerAvatar name={player.fullName} gender={player.gender} avatarUrl={player.avatarUrl} size="sm" />
                  <div className="min-w-0 max-w-[30ch]">
                    <div className="truncate font-medium text-foreground" title={player.fullName}>{displayName}</div>
                    <div className="text-xs text-muted-foreground">{player.gender || 'Không rõ'} · {getLevelLabel(player.level)}</div>
                  </div>
                </button>
                <div className="text-text-secondary">{player.totalMatches} trận</div>
                <div className={`${styles.playerFee} text-right font-mono tabular-nums text-foreground`}>{formatCurrency(payable)}đ</div>
                <PaymentBadge status={player.paymentStatus} method={player.paymentMethod} />
                {player.note ? (
                  <button
                    type="button"
                    onClick={() => setQuickViewPlayer(toQuickViewPlayer(player))}
                    className={`${styles.playerNote} block w-full min-w-0 max-w-56 truncate rounded-md text-right text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus/25`}
                    aria-label={`Xem đầy đủ ghi chú của ${player.fullName}`}
                  >
                    <span className={styles.mobileNoteLabel}>Ghi chú: </span>
                    {player.note}
                  </button>
                ) : (
                  <span className={`${styles.playerNote} text-right text-xs text-muted-foreground`}>—</span>
                )}
                <div className={`${styles.playerActions} flex flex-wrap justify-end gap-2`}>
                  {canOperateSession ? (
                  <Button type="button" variant="secondary" iconOnly disabled={runtimeLocked} onClick={() => beginEdit(player.id)} className="h-9 w-9 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50" aria-label={`Chỉnh sửa ${player.fullName}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  ) : null}
                  {canOperateSession ? (
                  <Button type="button" variant="danger" iconOnly disabled={runtimeLocked || deletePlayer.isPending} onClick={() => deletePlayer.mutate(player.id)} className="h-9 w-9 hover:ring-2 hover:ring-danger/25 focus-visible:ring-danger/50" aria-label={`Xóa ${player.fullName}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  ) : null}
                </div>
              </Surface>
            );
          })}
          {!playersLoading && players.length === 0 ? (
            <PageFeedbackStack>
              <EmptyState title="Chưa có người chơi" description="Thêm người chơi trước khi vào Điều phối để runtime hydrate từ database." />
            </PageFeedbackStack>
          ) : null}
        </div>
      </Surface>

      <Dialog
        open={showCompleteConfirm}
        onOpenChange={(open) => {
          if (!open && !completePlaySession.isPending) {
            setShowCompleteConfirm(false);
          }
        }}
        title="Hoàn tất ca chơi?"
        description="Kiểm tra lại các khoản thu, chi và lợi nhuận trước khi chốt ca."
        closeLabel="Đóng xác nhận hoàn tất ca"
        closeDisabled={completePlaySession.isPending}
        closeOnEscape={!completePlaySession.isPending}
        closeOnOutsideClick={!completePlaySession.isPending}
        tone="warning"
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowCompleteConfirm(false)} disabled={completePlaySession.isPending} className="hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50">Hủy</Button>
            <Button onClick={confirmCompleteSession} disabled={completePlaySession.isPending} className="hover:bg-primary-hover hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50">
              {completePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Xác nhận hoàn tất
            </Button>
          </>
        )}
      >
        {unpaidPlayers.length > 0 ? (
          <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm font-medium text-warning" role="status">
            Còn {unpaidPlayers.length} người chưa thanh toán. Sau khi hoàn tất ca, thông tin ca sẽ bị khóa và doanh số được chốt theo người đã thu.
          </div>
        ) : null}
        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-subtle">
          <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[20%]" />
              <col className="w-[24%]" />
              <col className="w-[28%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2.5 sm:px-3">Hạng Mục</th>
                <th className="px-2 py-2.5 text-right sm:px-3">Số Lượng</th>
                <th className="px-2 py-2.5 text-right sm:px-3">Đơn Giá</th>
                <th className="px-2 py-2.5 text-right sm:px-3">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <th scope="row" className="px-2 py-2.5 text-left font-medium text-foreground sm:px-3">Thu Slot</th>
                <td className="px-2 py-2.5 text-right tabular-nums text-text-secondary sm:px-3">{paidSlotCount} slot</td>
                <td className="px-2 py-2.5 text-right text-muted-foreground sm:px-3">—</td>
                <td className="px-2 py-2.5 text-right font-mono font-medium text-foreground sm:px-3">{formatCurrency(paymentTotals.paid)}đ</td>
              </tr>
              <tr>
                <th scope="row" className="px-2 py-2.5 text-left font-medium text-foreground sm:px-3">Chi Sân</th>
                <td className="px-2 py-2.5 text-right tabular-nums text-text-secondary sm:px-3">{completionCourtCount} sân</td>
                <td className="px-2 py-2.5 text-right font-mono text-text-secondary sm:px-3">{formatCurrency(completionCourtCost / completionCourtCount)}đ</td>
                <td className="px-2 py-2.5 text-right font-mono font-medium text-foreground sm:px-3">{formatCurrency(completionCourtCost)}đ</td>
              </tr>
              <tr>
                <th scope="row" className="px-2 py-2.5 text-left font-medium text-foreground sm:px-3">Chi Cầu</th>
                <td className="px-2 py-2.5 text-right tabular-nums text-text-secondary sm:px-3">{shuttlecockPiecesUsed || 0} quả</td>
                <td className="px-2 py-2.5 text-right font-mono text-text-secondary sm:px-3">{formatCurrency(selectedShuttlecock?.avgUsagePricePerBall ?? 0)}đ</td>
                <td className="px-2 py-2.5 text-right font-mono font-medium text-foreground sm:px-3">{formatCurrency(shuttlecockExpense)}đ</td>
              </tr>
              {extraExpenseValue > 0 ? (
                <tr>
                  <th scope="row" className="px-2 py-2.5 text-left font-medium text-foreground sm:px-3">Chi Khác</th>
                  <td className="px-2 py-2.5 text-right text-muted-foreground sm:px-3">—</td>
                  <td className="px-2 py-2.5 text-right text-muted-foreground sm:px-3">—</td>
                  <td className="px-2 py-2.5 text-right font-mono font-medium text-foreground sm:px-3">{formatCurrency(extraExpenseValue)}đ</td>
                </tr>
              ) : null}
              <tr className="border-t-2 border-border bg-surface">
                <th scope="row" className="px-2 py-3 text-left font-semibold text-foreground sm:px-3">Lợi Nhuận</th>
                <td className="px-2 py-3 text-right text-muted-foreground sm:px-3">—</td>
                <td className="px-2 py-3 text-right text-muted-foreground sm:px-3">—</td>
                <td className={`px-2 py-3 text-right font-mono font-semibold sm:px-3 ${completionProfit < 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(completionProfit)}đ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {!settings.autoCreateCourtFeeTransaction
        || !settings.autoCreateShuttlecockUsageTransaction
        || (extraExpenseValue > 0 && !autoCreateExtraExpenseTransaction) ? (
          <div className="mt-3 rounded-lg border border-border bg-surface-subtle px-3 py-2.5 text-xs leading-5 text-muted-foreground sm:text-sm">
            <p className="font-semibold text-foreground">Lưu ý:</p>
            <ul className="mt-1 list-disc pl-5">
              <li>
                Các khoản chi vẫn được tính vào lợi nhuận.
                {!settings.autoCreateCourtFeeTransaction ? ' Không tạo phiếu chi sân.' : ''}
                {!settings.autoCreateShuttlecockUsageTransaction ? ' Không tạo phiếu chi cầu.' : ''}
                {extraExpenseValue > 0 && !autoCreateExtraExpenseTransaction ? ' Không tạo phiếu chi phát sinh.' : ''}
              </li>
            </ul>
          </div>
        ) : null}
      </Dialog>
      <PlayerQuickView player={quickViewPlayer} onClose={() => setQuickViewPlayer(null)} />
    </PageShell>
  );
}

type PlayerFormState = {
  fullName: string;
  gender: string;
  level: string;
  paymentAmount: string;
  discount: string;
  paymentMethod: string;
  paymentStatus: string;
  note: string;
};

const emptyPlayerForm: PlayerFormState = {
  fullName: '',
  gender: 'Nam',
  level: '1',
  paymentAmount: '0',
  discount: '0',
  paymentMethod: '',
  paymentStatus: 'UNPAID',
  note: ''
};

function normalizePlayerForm(form: PlayerFormState): SessionPlayerPayload {
  return {
    fullName: form.fullName.trim(),
    gender: form.gender || null,
    level: Number(form.level || 1),
    paymentAmount: Number(form.paymentAmount || 0),
    discount: Number(form.discount || 0),
    paymentMethod: form.paymentStatus === 'PAID' ? form.paymentMethod || 'CASH' : null,
    paymentStatus: form.paymentStatus,
    note: form.note.trim() || null
  };
}

type PaymentEditValue = 'UNPAID' | 'CASH' | 'BANK' | 'WAIVED';
type PlayerSortValue = 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'UNPAID_FIRST' | 'GENDER_FEMALE_MALE' | 'FEE_ASC' | 'FEE_DESC';
type SortablePlayer = {
  paymentAmount: number;
  discount: number;
  gender?: string | null;
};

function payableAmount(player: SortablePlayer): number {
  return Math.max(0, player.paymentAmount - player.discount);
}

function genderSortRank(gender?: string | null): number {
  const normalized = String(gender ?? '').toLowerCase();
  if (normalized.includes('nữ') || normalized.includes('nu')) return 0;
  if (normalized.includes('nam')) return 1;
  return 2;
}

function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function truncatePlayerName(value: string, maxLength = 20): string {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function getPaymentEditValue(form: PlayerFormState): PaymentEditValue {
  if (form.paymentStatus === 'WAIVED') return 'WAIVED';
  if (form.paymentStatus !== 'PAID') return 'UNPAID';
  return form.paymentMethod === 'BANK' ? 'BANK' : 'CASH';
}

function withPaymentEditValue(form: PlayerFormState, value: PaymentEditValue): PlayerFormState {
  if (value === 'UNPAID') {
    return { ...form, paymentStatus: 'UNPAID', paymentMethod: '' };
  }
  if (value === 'WAIVED') {
    return { ...form, paymentStatus: 'WAIVED', paymentMethod: '' };
  }
  return { ...form, paymentStatus: 'PAID', paymentMethod: value };
}

function toQuickViewPlayer(player: {
  id: string;
  fullName: string;
  gender: string | null;
  level: number;
  totalMatches: number;
  paymentAmount: number;
  discount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  runtimeStatus: string | null;
  note: string | null;
  avatarUrl: string | null;
}): QuickViewPlayer {
  return {
    id: player.id,
    name: player.fullName,
    gender: player.gender,
    level: player.level,
    matchesPlayed: player.totalMatches,
    status: player.runtimeStatus,
    paymentAmount: player.paymentAmount,
    discount: player.discount,
    paymentStatus: player.paymentStatus,
    paymentMethod: player.paymentMethod,
    note: player.note,
    avatarUrl: player.avatarUrl
  };
}

function PaymentBadge({ status, method }: { status: string; method: string | null }) {
  const label = status === 'PAID' ? getPaymentMethodLabel(method) : status === 'WAIVED' ? 'Free' : 'Chưa thu';
  const tone = status === 'PAID'
    ? method === 'BANK'
      ? 'info'
      : 'success'
    : status === 'WAIVED'
      ? 'neutral'
      : 'warning';

  return <StatusBadge tone={tone} className="w-fit">{label}</StatusBadge>;
}

function getPaymentMethodLabel(value: string | null): string {
  if (value === 'BANK') return 'Chuyển khoản';
  if (value === 'CASH') return 'Tiền mặt';
  return '-';
}
