'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePlayDate, useScheduleMutations } from '@/hooks/use-play-dates';
import { hasPermission } from '@/lib/auth/permissions';
import { isPastDateInput, todayDateInput } from '@/lib/date-format';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';
import type { PlaySessionSummary } from '@/types/domain';

export function PlayDateDetailClient({ playDateId }: { playDateId: string }) {
  const { data: playDate, isLoading, error } = usePlayDate(playDateId);
  const { data: currentUser } = useCurrentUser();
  const { createPlaySession, updatePlaySession, deletePlaySession } = useScheduleMutations(playDateId);
  const { settings } = useAppSettings();
  const [name, setName] = useState('Ca tối');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('22:00');
  const [courtCount, setCourtCount] = useState(2);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', startTime: '', endTime: '', courtCount: 1, note: '' });
  const today = useMemo(() => todayDateInput(), []);
  const isPastPlayDate = Boolean(playDate?.playDate && isPastDateInput(playDate.playDate, today));
  const sortedSessions = useMemo(() => {
    return [...(playDate?.sessions ?? [])].sort((left, right) => left.startTime.localeCompare(right.startTime));
  }, [playDate?.sessions]);
  const maxCourtCount = settings.maxCourtCountPerSession;
  const canManageSessions = hasPermission(currentUser ?? null, 'schedule.manage');

  useEffect(() => {
    setCourtCount((current) => Math.min(current, maxCourtCount));
    setEditForm((current) => ({ ...current, courtCount: Math.min(current.courtCount, maxCourtCount) }));
  }, [maxCourtCount]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    if (isPastPlayDate) {
      setActionError('Ngày chơi đã thuộc quá khứ, không thể tạo thêm ca chơi.');
      return;
    }
    if (courtCount > maxCourtCount) {
      setActionError(`Số sân tối đa theo cài đặt hiện tại là ${maxCourtCount}.`);
      return;
    }
    try {
      await createPlaySession.mutateAsync({
        id: playDateId,
        payload: { name, startTime, endTime, courtCount, note }
      });
      setNote('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể tạo ca chơi');
    }
  }

  function beginEditSession(session: PlaySessionSummary) {
    if (isPastPlayDate) {
      setActionError('Ngày chơi đã thuộc quá khứ, không thể chỉnh sửa ca chơi.');
      return;
    }
    setActionError(null);
    setEditingSessionId(session.id);
    setEditForm({
      name: session.name,
      startTime: session.startTime,
      endTime: session.endTime,
      courtCount: session.courtCount,
      note: session.note || ''
    });
  }

  function cancelEditSession() {
    setEditingSessionId(null);
    setEditForm({ name: '', startTime: '', endTime: '', courtCount: 1, note: '' });
  }

  async function saveEditSession() {
    if (!editingSessionId) return;
    setActionError(null);
    if (isPastPlayDate) {
      setActionError('Ngày chơi đã thuộc quá khứ, không thể chỉnh sửa ca chơi.');
      return;
    }
    if (editForm.courtCount > maxCourtCount) {
      setActionError(`Số sân tối đa theo cài đặt hiện tại là ${maxCourtCount}.`);
      return;
    }
    try {
      await updatePlaySession.mutateAsync({ id: editingSessionId, payload: editForm });
      cancelEditSession();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể cập nhật ca chơi');
    }
  }

  async function removeSession(session: PlaySessionSummary) {
    if (isPastPlayDate) {
      setActionError('Ngày chơi đã thuộc quá khứ, không thể xóa ca chơi.');
      return;
    }
    if (!window.confirm(`Xóa ca "${session.name}"?`)) return;
    setActionError(null);
    try {
      await deletePlaySession.mutateAsync(session.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa ca chơi');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/schedule" className="text-xs text-cyan-200 hover:text-cyan-100">← Lịch chơi</Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{playDate?.title || playDate?.playDate || 'Ngày chơi'}</h1>
          <p className="mt-1 text-sm text-slate-400">{playDate?.playDate || 'Đang tải'} · {playDate?.sessionCount ?? 0} ca</p>
        </div>
      </header>

      {isLoading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải ngày chơi...</div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div> : null}
      {actionError ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">{actionError}</div> : null}

      {!isPastPlayDate && canManageSessions ? (
      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_130px_130px_100px] md:items-end">
          <label className="block">
            <span className="text-xs text-slate-400">Tên ca</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Bắt đầu</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Kết thúc</span>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Sân</span>
            <input type="number" min={1} max={maxCourtCount} value={courtCount} onChange={(event) => setCourtCount(Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            <span className="mt-1 block text-[11px] text-slate-500">Tối đa {maxCourtCount} sân</span>
          </label>
          <label className="block md:col-span-3">
            <span className="text-xs text-slate-400">Ghi chú</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <Button type="submit" disabled={createPlaySession.isPending} className="h-11">
            {createPlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tạo ca
          </Button>
        </form>
      </section>
      ) : null}

      <section className="space-y-3">
        {sortedSessions.map((session) => {
          const canModify = canManageSessions && !isPastPlayDate && normalizeSessionStatus(session.status) === 'PENDING';
          const isEditing = editingSessionId === session.id;

          if (isEditing) {
            return (
              <article key={session.id} className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_130px_130px_100px] md:items-end">
                  <label className="block">
                    <span className="text-xs text-slate-400">Tên ca</span>
                    <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Bắt đầu</span>
                    <input type="time" value={editForm.startTime} onChange={(event) => setEditForm((current) => ({ ...current, startTime: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Kết thúc</span>
                    <input type="time" value={editForm.endTime} onChange={(event) => setEditForm((current) => ({ ...current, endTime: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Sân</span>
                    <input type="number" min={1} max={maxCourtCount} value={editForm.courtCount} onChange={(event) => setEditForm((current) => ({ ...current, courtCount: Number(event.target.value) }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
                    <span className="mt-1 block text-[11px] text-slate-500">Tối đa {maxCourtCount} sân</span>
                  </label>
                  <label className="block md:col-span-3">
                    <span className="text-xs text-slate-400">Ghi chú</span>
                    <input value={editForm.note} onChange={(event) => setEditForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={updatePlaySession.isPending} onClick={() => void saveEditSession()}>
                      {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditSession}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          }

          return (
            <article key={session.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{session.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{session.startTime}-{session.endTime} · {session.courtCount} sân · {getSessionStatusLabel(session.status)}</div>
                  {session.note ? <div className="mt-2 text-sm text-slate-300">{session.note}</div> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={!canModify} onClick={() => beginEditSession(session)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="danger" disabled={!canModify || deletePlaySession.isPending} onClick={() => void removeSession(session)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`/sessions/${session.id}`}>
                    <Button size="sm" variant="secondary">Chi tiết</Button>
                  </Link>
                  {!isPastPlayDate ? (
                    <Link href={`/sessions/${session.id}/runtime`}>
                      <Button size="sm">Điều phối</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!isLoading && playDate && playDate.sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">Ngày này chưa có ca chơi.</div>
      ) : null}
    </div>
  );
}
