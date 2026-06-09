'use client';

import Link from 'next/link';
import { AlertCircle, Check, ChevronDown, Loader2, Pencil, Play, Plus, Save, Square, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useShuttlecockProductOptions } from '@/hooks/use-inventory';
import { usePlaySession, useScheduleMutations } from '@/hooks/use-play-dates';
import { useSessionPlayerMutations, useSessionPlayers } from '@/hooks/use-session-players';
import { formatCurrency } from '@/lib/date-format';
import { getLevelLabel, LEVEL_OPTIONS } from '@/lib/player-labels';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';
import type { SessionPlayerPayload } from '@/services/session-players-service';

export function SessionDetailClient({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, error } = usePlaySession(sessionId);
  const { data: players = [], isLoading: playersLoading, error: playersError } = useSessionPlayers(sessionId);
  const { data: shuttlecockProducts = [] } = useShuttlecockProductOptions();
  const { settings } = useAppSettings();
  const { createPlayer, updatePlayer, deletePlayer } = useSessionPlayerMutations(sessionId);
  const { updatePlaySession, completePlaySession } = useScheduleMutations(session?.playDateId);
  const [form, setForm] = useState<PlayerFormState>(emptyPlayerForm);
  const [editForm, setEditForm] = useState<PlayerFormState>(emptyPlayerForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courtCost, setCourtCost] = useState('');
  const [shuttlecockProductId, setShuttlecockProductId] = useState('');
  const [shuttlecockPiecesUsed, setShuttlecockPiecesUsed] = useState('');
  const [completionExpanded, setCompletionExpanded] = useState(true);
  const [previewProfit, setPreviewProfit] = useState<number | null>(null);
  const [completionDraftSaved, setCompletionDraftSaved] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [playerActionError, setPlayerActionError] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const normalizedStatus = normalizeSessionStatus(session?.status);
  const runtimeLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';
  const requiredPlayers = (session?.courtCount ?? 1) * 6;
  const canStartSession = players.length >= requiredPlayers;
  const selectedShuttlecock = shuttlecockProducts.find((product) => product.id === shuttlecockProductId);
  const selectedShuttlecockLabel = selectedShuttlecock
    ? selectedShuttlecock.brand
      ? `${selectedShuttlecock.name} · ${selectedShuttlecock.brand}`
      : selectedShuttlecock.name
    : session?.shuttlecockProductName || 'Chưa lưu';
  const shuttlecockExpense = selectedShuttlecock
    ? Number(shuttlecockPiecesUsed || 0) * selectedShuttlecock.avgUsagePricePerBall
    : 0;

  useEffect(() => {
    if (!session) return;
    setCourtCost(String(session.courtCost || ''));
    setShuttlecockPiecesUsed(String(session.shuttlecockPiecesUsed || ''));
    setCompletionDraftSaved(Boolean(session.courtCost || session.shuttlecockPiecesUsed));
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
  const draftCompletionExpense = Number(courtCost || 0) + shuttlecockExpense;
  const draftCompletionProfit = paymentTotals.paid - draftCompletionExpense;
  const visibleCompletionProfit = previewProfit ?? session?.totalProfit ?? 0;
  const completionProfitLabel = normalizedStatus === 'COMPLETED' ? 'Lợi nhuận' : 'Lợi nhuận tạm tính';

  const unpaidPlayers = useMemo(() => players.filter((player) => player.paymentStatus !== 'PAID' && player.paymentStatus !== 'WAIVED'), [players]);
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
      await createPlayer.mutateAsync(payload);
      setForm(emptyPlayerForm);
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
      paymentMethod: player.paymentMethod || 'CASH',
      paymentStatus: player.paymentStatus,
      note: player.note || ''
    });
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
      cancelEdit();
    } catch (caught) {
      setPlayerActionError(caught instanceof Error ? caught.message : 'Không thể cập nhật người chơi');
    }
  }

  async function setStatus(status: 'ACTIVE') {
    await updatePlaySession.mutateAsync({ id: sessionId, payload: { status } });
  }

  function validateCompletion() {
    if (Number(courtCost) <= 0) return 'Vui lòng nhập chi phí sân trước khi hoàn tất ca.';
    if (!shuttlecockProductId) return 'Vui lòng chọn loại cầu hao trong ca.';
    if (selectedShuttlecock && selectedShuttlecock.avgUsagePricePerBall <= 0) return 'Loại cầu chưa có giá cầu hao bình quân. Vui lòng nhập kho cầu.';
    if (Number(shuttlecockPiecesUsed) <= 0) return 'Vui lòng nhập số lượng cầu hao trong ca.';
    return null;
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
      payload: {
        courtCost: Number(courtCost),
        shuttlecockPiecesUsed: Number(shuttlecockPiecesUsed),
        shuttlecockProductId: selectedShuttlecock?.id ?? session?.shuttlecockProductId ?? null,
        shuttlecockProductName: selectedShuttlecock?.name ?? session?.shuttlecockProductName ?? null,
        totalIncome: paymentTotals.paid,
        totalExpense: draftCompletionExpense,
        totalProfit: draftCompletionProfit
      }
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
          payload: {
            courtCost: Number(courtCost),
            shuttlecockPiecesUsed: Number(shuttlecockPiecesUsed),
            shuttlecockProductId: selectedShuttlecock?.id ?? session?.shuttlecockProductId ?? null,
            shuttlecockProductName: selectedShuttlecock?.name ?? session?.shuttlecockProductName ?? null,
            totalIncome: paymentTotals.paid,
            totalExpense: draftCompletionExpense,
            totalProfit: draftCompletionProfit
          }
        });
      }
      await completePlaySession.mutateAsync({
        id: sessionId,
        payload: {
          courtCost: Number(courtCost),
          shuttlecockProductId,
          shuttlecockPiecesUsed: Number(shuttlecockPiecesUsed),
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 md:px-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href={session ? `/schedule/${session.playDateId}` : '/schedule'} className="text-xs text-cyan-200 hover:text-cyan-100">← Quay lại lịch</Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{session?.name || 'Ca chơi'}</h1>
          <p className="mt-1 text-sm text-slate-400">{session ? `${session.startTime}-${session.endTime} · ${session.courtCount} sân · ${getSessionStatusLabel(session.status)}` : 'Đang tải'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {normalizedStatus === 'PENDING' ? (
            <Button onClick={() => setStatus('ACTIVE')} disabled={updatePlaySession.isPending || !canStartSession}>
              {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Bắt đầu ca
            </Button>
          ) : null}
          {normalizedStatus === 'ACTIVE' ? (
            <Button variant="secondary" onClick={requestCompleteSession} disabled={completePlaySession.isPending}>
              {completePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Hoàn tất ca
            </Button>
          ) : null}
          <Link href={`/sessions/${sessionId}/runtime`}>
            <Button variant={normalizedStatus === 'ACTIVE' ? 'primary' : 'secondary'}>Điều phối</Button>
          </Link>
        </div>
      </header>

      {isLoading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải ca chơi...</div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div> : null}
      {!canStartSession && normalizedStatus === 'PENDING' && session ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Cần ít nhất {requiredPlayers} người chơi cho {session.courtCount} sân trước khi bắt đầu ca. Hiện có {players.length} người.</span>
        </div>
      ) : null}

      {session ? (
        <section className="grid gap-3 md:grid-cols-3">
          <InfoCard label="Thời gian" value={`${session.startTime}-${session.endTime}`} />
          <InfoCard label="Người chơi" value={`${players.length}`} />
          <InfoCard label="Thu dự kiến" value={`${formatCurrency(paymentTotals.expected)}đ`} />
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Thông tin hoàn tất ca</h2>
            <p className="text-sm text-slate-400">Lưu chi phí sân, cầu hao và xem lợi nhuận tạm tính trước khi hoàn tất.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200">{completionProfitLabel}: {formatCurrency(visibleCompletionProfit)}đ</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCompletionExpanded((open) => !open)}>
              <ChevronDown className={`h-4 w-4 transition-transform ${completionExpanded ? 'rotate-180' : ''}`} />
              {completionExpanded ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        </div>
        {completionError ? (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {completionError}
          </div>
        ) : null}

        {completionExpanded ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[150px_1fr_130px_auto] md:items-end">
          <label className="block">
            <span className="text-xs text-slate-400">Chi phí sân</span>
            <input type="number" min={0} step={10000} value={courtCost} onChange={(event) => { setCourtCost(event.target.value); setCompletionDraftSaved(false); setPreviewProfit(null); }} disabled={runtimeLocked} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none disabled:text-slate-500" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Loại cầu hao</span>
            <select value={shuttlecockProductId} onChange={(event) => { setShuttlecockProductId(event.target.value); setCompletionDraftSaved(false); setPreviewProfit(null); }} disabled={runtimeLocked} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none disabled:text-slate-500">
              <option value="">Chọn cầu</option>
              {shuttlecockProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.brand ? `${product.name} · ${product.brand}` : product.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Cầu hao</span>
            <input type="number" min={0} value={shuttlecockPiecesUsed} onChange={(event) => { setShuttlecockPiecesUsed(event.target.value); setCompletionDraftSaved(false); setPreviewProfit(null); }} disabled={runtimeLocked} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none disabled:text-slate-500" />
          </label>
          <Button type="button" variant="secondary" onClick={() => void updateCompletionDraft()} disabled={runtimeLocked || updatePlaySession.isPending} className="h-11">
            {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Cập nhật
          </Button>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 md:col-span-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ghi chú ca</div>
            <p className="mt-1 text-sm text-slate-300">{session?.note || 'Chưa có ghi chú.'}</p>
            <p className="mt-2 text-xs text-slate-500">Loại cầu hao đã lưu: {selectedShuttlecockLabel}</p>
          </div>
        </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Người chơi trong ca</h2>
            <p className="text-sm text-slate-400">
              Thu tiền mặt: {formatCurrency(playerFinance.cash)}đ · Thu chuyển khoản: {formatCurrency(playerFinance.bank)}đ · Chưa thu: {formatCurrency(playerFinance.unpaid)}đ
            </p>
          </div>
        </div>

        <form onSubmit={submitPlayer} className="mt-3 grid gap-3 rounded-lg bg-white/[0.03] p-3 md:grid-cols-[minmax(260px,2fr)_90px_110px_130px_auto] md:items-end">
          <label className="block">
            <span className="text-xs text-slate-400">Tên người chơi</span>
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Giới tính</span>
            <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Trình độ</span>
            <select value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              {LEVEL_OPTIONS.slice(0, 5).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Phí</span>
            <input type="number" min={0} step={1000} value={form.paymentAmount} onChange={(event) => setForm((current) => ({ ...current, paymentAmount: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={runtimeLocked || createPlayer.isPending} className="h-11 flex-1 md:flex-none">
              {createPlayer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Thêm
            </Button>
          </div>
        </form>

        {playersLoading ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">Đang tải người chơi...</div> : null}
        {playersError ? <div className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{playersError.message}</div> : null}
        {playerActionError ? <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">{playerActionError}</div> : null}

        <div className="mt-4 space-y-2">
          {players.map((player) => {
            const payable = Math.max(0, player.paymentAmount - player.discount);
            const isEditing = editingId === player.id;
            if (isEditing) {
              return (
                <article key={player.id} className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3 text-sm">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:items-end">
                    <label className="block min-w-0 sm:col-span-2 lg:col-span-2">
                      <span className="text-xs text-slate-400">Tên người chơi</span>
                      <input
                        value={editForm.fullName}
                        onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs text-slate-400">Giới tính</span>
                      <select value={editForm.gender} onChange={(event) => setEditForm((current) => ({ ...current, gender: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white outline-none">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs text-slate-400">Trình độ</span>
                      <select value={editForm.level} onChange={(event) => setEditForm((current) => ({ ...current, level: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white outline-none">
                        {LEVEL_OPTIONS.slice(0, 5).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs text-slate-400">Phí</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={editForm.paymentAmount}
                        onChange={(event) => setEditForm((current) => ({ ...current, paymentAmount: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs text-slate-400">Thanh toán</span>
                      <select value={editForm.paymentStatus} onChange={(event) => setEditForm((current) => ({ ...current, paymentStatus: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white outline-none">
                        <option value="UNPAID">Chưa thu</option>
                        <option value="PAID">Đã thu</option>
                        <option value="WAIVED">Miễn</option>
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs text-slate-400">Hình thức</span>
                      <select value={editForm.paymentMethod} onChange={(event) => setEditForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-sm text-white outline-none">
                        <option value="CASH">Tiền mặt</option>
                        <option value="BANK">Chuyển khoản</option>
                        <option value="">Khác</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                      <Button type="button" variant="secondary" disabled={updatePlayer.isPending} onClick={() => void saveInlineEdit()} className="h-10 px-3">
                        {updatePlayer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="ghost" onClick={cancelEdit} className="h-10 px-3">
                        <X className="h-4 w-4" />
                      </Button>
                  </div>
                </article>
              );
            }

            return (
              <article key={player.id} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm md:grid-cols-[1.5fr_90px_120px_120px_120px_auto] md:items-center">
                <div>
                  <div className="font-medium text-white">{player.fullName}</div>
                  <div className="text-xs text-slate-400">{player.gender || 'Không rõ'} · {getLevelLabel(player.level)}</div>
                </div>
                <div className="text-slate-300">{player.totalMatches} trận</div>
                <div className="font-mono text-slate-200">{formatCurrency(payable)}đ</div>
                <PaymentBadge status={player.paymentStatus} />
                <div className="text-slate-400">{getPaymentMethodLabel(player.paymentMethod)}</div>
                <div className="flex gap-2 md:justify-end">
                  <Button type="button" variant="secondary" disabled={runtimeLocked} onClick={() => beginEdit(player.id)} className="h-10 px-3">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="danger" disabled={runtimeLocked || deletePlayer.isPending} onClick={() => deletePlayer.mutate(player.id)} className="h-10 px-3">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            );
          })}
          {!playersLoading && players.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">Chưa có người chơi. Thêm người chơi trước khi vào Điều phối để runtime hydrate từ database.</div>
          ) : null}
        </div>
      </section>

      {showCompleteConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Hoàn tất ca chơi?</h2>
            <p className="mt-2 text-sm text-slate-300">
              Hệ thống sẽ tự tạo phiếu thu tiền slot, chi tiền sân, chi tiền cầu và trừ kho cầu theo số lượng đã nhập.
            </p>
            {unpaidPlayers.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                Còn {unpaidPlayers.length} người chưa thanh toán. Sau khi hoàn tất ca, thông tin ca sẽ bị khóa và doanh số được chốt theo người đã thu.
              </div>
            ) : null}
            <div className="mt-4 space-y-1 rounded-lg bg-white/[0.04] p-3 text-sm text-slate-300">
              <div>Thu slot: {formatCurrency(paymentTotals.paid)}đ</div>
              <div>Chi sân: {formatCurrency(Number(courtCost || 0))}đ{settings.autoCreateCourtFeeTransaction ? '' : ' · không tạo phiếu'}</div>
              <div>Chi cầu: {shuttlecockPiecesUsed || 0} quả · {formatCurrency(shuttlecockExpense)}đ{settings.autoCreateShuttlecockUsageTransaction ? '' : ' · không tạo phiếu chi'}</div>
              <div>Lợi nhuận: {formatCurrency(paymentTotals.paid - Number(courtCost || 0) - shuttlecockExpense)}đ</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCompleteConfirm(false)}>Hủy</Button>
              <Button onClick={confirmCompleteSession} disabled={completePlaySession.isPending}>
                {completePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Xác nhận hoàn tất
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
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
  paymentMethod: 'CASH',
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
    paymentMethod: form.paymentMethod || null,
    paymentStatus: form.paymentStatus,
    note: form.note.trim() || null
  };
}

function PaymentBadge({ status }: { status: string }) {
  const label = status === 'PAID' ? 'Đã thu' : status === 'WAIVED' ? 'Miễn' : 'Chưa thu';
  const tone = status === 'PAID' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : status === 'WAIVED' ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200' : 'border-amber-400/20 bg-amber-500/10 text-amber-200';

  return <div className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>{label}</div>;
}

function getPaymentMethodLabel(value: string | null): string {
  if (value === 'BANK') return 'Chuyển khoản';
  if (value === 'CASH') return 'Tiền mặt';
  return '-';
}
