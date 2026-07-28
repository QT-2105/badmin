'use client';

import Link from 'next/link';
import { AlertCircle, Check, ChevronDown, ImageUp, Loader2, Pencil, Play, Plus, Save, Square, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PlayerFeeInput } from '@/components/player/player-fee-input';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
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
import { formatCurrency } from '@/lib/date-format';
import { getLevelLabel, LEVEL_OPTIONS } from '@/lib/player-labels';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';
import type { SessionPlayerPayload } from '@/services/session-players-service';

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
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);
  const [courtCost, setCourtCost] = useState('');
  const [shuttlecockProductId, setShuttlecockProductId] = useState('');
  const [shuttlecockPiecesUsed, setShuttlecockPiecesUsed] = useState('');
  const [extraExpenseTitle, setExtraExpenseTitle] = useState('');
  const [extraExpenseAmount, setExtraExpenseAmount] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [completionExpanded, setCompletionExpanded] = useState(true);
  const [completionDetailsExpanded, setCompletionDetailsExpanded] = useState(false);
  const [previewProfit, setPreviewProfit] = useState<number | null>(null);
  const [completionDraftSaved, setCompletionDraftSaved] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [playerActionError, setPlayerActionError] = useState<string | null>(null);
  const [playerSort, setPlayerSort] = useState<PlayerSortValue>('DEFAULT');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
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
      const created = await createPlayer.mutateAsync(payload);
      if (formAvatarFile) {
        await uploadAvatar.mutateAsync({ id: created.id, file: formAvatarFile });
      }
      setForm(emptyPlayerForm);
      setFormAvatarFile(null);
    } catch (caught) {
      setPlayerActionError(caught instanceof Error ? caught.message : 'Không thể thêm người chơi');
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
      await updatePlayer.mutateAsync({ id: editingId, payload });
      if (editAvatarFile) {
        await uploadAvatar.mutateAsync({ id: editingId, file: editAvatarFile });
      }
      cancelEdit();
    } catch (caught) {
      setPlayerActionError(caught instanceof Error ? caught.message : 'Không thể cập nhật người chơi');
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
          autoCreateShuttlecockUsageTransaction: settings.autoCreateShuttlecockUsageTransaction
        }
      });
      setShowCompleteConfirm(false);
    } catch (caught) {
      setCompletionError(caught instanceof Error ? caught.message : 'Không thể hoàn tất ca');
      setShowCompleteConfirm(false);
    }
  }

  return (
    <PageShell maxWidth="max-w-6xl">
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

      <Surface padding="md" className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
        <div className="grid min-w-0 gap-3 sm:grid-cols-[172px_minmax(280px,1fr)] lg:grid-cols-[172px_minmax(360px,520px)_128px_148px] lg:items-end lg:justify-start">
          <Surface variant="subtle" padding="sm" className="min-w-0 border-info/20 bg-info-soft/40 md:p-3">
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
          <Surface variant="subtle" padding="sm" className="min-w-0 border-warning/20 bg-warning-soft/30 md:p-3">
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
          <Surface variant="subtle" padding="sm" className="min-w-0 border-warning/20 bg-warning-soft/30 md:p-3">
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
          <Button type="button" variant="secondary" onClick={() => void updateCompletionDraft()} disabled={runtimeLocked || !canCompleteSession || updatePlaySession.isPending} className="h-11 w-full justify-center hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50 sm:w-[148px] sm:justify-self-start lg:w-full">
            {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Cập nhật
          </Button>
          <Surface variant="subtle" padding="sm" className="min-w-0 sm:col-span-2 lg:col-span-4">
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
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px]">
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
                <label className="block lg:col-span-2">
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
          <form onSubmit={submitPlayer} className="grid min-w-0 gap-2.5 md:grid-cols-[minmax(180px,1fr)_92px_84px_120px_40px_104px] md:items-end xl:grid-cols-[minmax(320px,1fr)_96px_88px_132px_40px_112px]">
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
                title="Chọn hoặc chụp ảnh người chơi"
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
            <div className="flex min-w-0 md:w-full">
              <Button type="submit" disabled={runtimeLocked || createPlayer.isPending || uploadAvatar.isPending} className="h-10 w-full rounded-lg hover:bg-primary-hover hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50">
                {createPlayer.isPending || uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Thêm
              </Button>
            </div>
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

        <div aria-label="Danh sách người chơi trong ca" className="space-y-1.5">
          {players.length > 0 ? (
            <>
              <Surface variant="subtle" padding="sm" className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:hidden">
                <span>Danh sách</span>
                <label className="flex items-center gap-2">
                  <span className="sr-only">Sắp xếp danh sách người chơi</span>
                  <select
                    value={playerSort}
                    onChange={(event) => setPlayerSort(event.target.value as PlayerSortValue)}
                    className="h-8 w-[148px] rounded-lg border border-input bg-background px-2 text-xs font-semibold normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/30"
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
              <Surface variant="subtle" padding="sm" className="hidden gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid lg:grid-cols-[minmax(260px,360px)_92px_96px_140px_minmax(16px,1fr)_132px] lg:items-center">
                <div>Tên người chơi</div>
                <div>Tổng set</div>
                <div>Phí</div>
                <div>Thanh toán</div>
                <div aria-hidden="true" />
                <label className="flex items-center justify-end">
                  <span className="sr-only">Sắp xếp danh sách người chơi</span>
                  <select
                    value={playerSort}
                    onChange={(event) => setPlayerSort(event.target.value as PlayerSortValue)}
                    className="h-8 w-[148px] rounded-lg border border-input bg-background px-2 text-xs font-semibold normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary/40 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/30"
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
                      <label className="inline-flex cursor-pointer items-center rounded-full ring-2 ring-border transition hover:ring-info/40 focus-within:ring-2 focus-within:ring-focus/25" title="Đổi ảnh người chơi">
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
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                      {player.avatarUrl ? (
                        <Button type="button" variant="ghost" disabled={deleteAvatar.isPending} onClick={() => void deleteAvatar.mutateAsync(player.id)} className="h-10 px-3 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50">
                          Xóa ảnh
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" disabled={updatePlayer.isPending} onClick={() => void saveInlineEdit()} className="h-10 px-3 hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:ring-focus/50" aria-label={`Lưu chỉnh sửa ${editForm.fullName || player.fullName}`}>
                        {updatePlayer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                className="grid gap-2 px-3 py-1.5 text-sm lg:grid-cols-[minmax(260px,360px)_92px_96px_140px_minmax(16px,1fr)_132px] lg:items-center"
              >
                <button
                  type="button"
                  aria-label={`Xem nhanh người chơi ${player.fullName}`}
                  onClick={() => setQuickViewPlayer(toQuickViewPlayer(player))}
                  title={player.fullName}
                  className="flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <PlayerAvatar name={player.fullName} gender={player.gender} avatarUrl={player.avatarUrl} size="sm" />
                  <div className="min-w-0 max-w-[30ch]">
                    <div className="truncate font-medium text-foreground" title={player.fullName}>{displayName}</div>
                    <div className="text-xs text-muted-foreground">{player.gender || 'Không rõ'} · {getLevelLabel(player.level)}</div>
                  </div>
                </button>
                <div className="text-text-secondary lg:text-left">{player.totalMatches} trận</div>
                <div className="font-mono tabular-nums text-foreground lg:text-left">{formatCurrency(payable)}đ</div>
                <PaymentBadge status={player.paymentStatus} method={player.paymentMethod} />
                <div aria-hidden="true" className="hidden lg:block" />
                <div className="flex flex-wrap gap-2 lg:justify-end">
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
        description="Hệ thống sẽ tự tạo phiếu thu tiền slot, chi tiền sân, chi tiền cầu, chi phí phát sinh nếu có và trừ kho cầu theo số lượng đã nhập."
        closeLabel="Đóng xác nhận hoàn tất ca"
        closeDisabled={completePlaySession.isPending}
        closeOnEscape={!completePlaySession.isPending}
        closeOnOutsideClick={!completePlaySession.isPending}
        tone="warning"
        size="sm"
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
        <dl className="mt-3 space-y-1 rounded-lg border border-border bg-surface-subtle p-3 text-sm text-text-secondary">
          <div className="flex items-center justify-between gap-3">
            <dt>Thu slot</dt>
            <dd className="font-mono text-foreground">{formatCurrency(paymentTotals.paid)}đ</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Chi sân</dt>
            <dd className="text-right font-mono text-foreground">{formatCurrency(Number(courtCost || 0))}đ{settings.autoCreateCourtFeeTransaction ? '' : ' · không tạo phiếu'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Chi cầu</dt>
            <dd className="text-right font-mono text-foreground">{shuttlecockPiecesUsed || 0} quả · {formatCurrency(shuttlecockExpense)}đ{settings.autoCreateShuttlecockUsageTransaction ? '' : ' · không tạo phiếu chi'}</dd>
          </div>
          {extraExpenseValue > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt>Chi phí phát sinh</dt>
              <dd className="text-right font-mono text-foreground">{formatCurrency(extraExpenseValue)}đ</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <dt>Lợi nhuận</dt>
            <dd className="font-mono font-semibold text-foreground">{formatCurrency(paymentTotals.paid - Number(courtCost || 0) - shuttlecockExpense - extraExpenseValue)}đ</dd>
          </div>
        </dl>
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
