'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoticeCard, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
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
    <PageShell maxWidth="max-w-6xl">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/schedule" className="text-xs font-medium text-info hover:text-info/80">← Lịch chơi</Link>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{playDate?.title || playDate?.playDate || 'Ngày chơi'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{playDate?.playDate || 'Đang tải'} · {playDate?.sessionCount ?? 0} ca</p>
        </div>
      </header>

      {isLoading ? <NoticeCard>Đang tải ngày chơi...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
      {actionError ? <NoticeCard tone="warning">{actionError}</NoticeCard> : null}

      {!isPastPlayDate && canManageSessions ? (
      <section className="rounded-xl border border-border bg-surface p-4 shadow-soft">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_130px_130px_100px] md:items-end">
          <label className="block">
            <span className={formLabelClass}>Tên ca</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className={formInputClass} />
          </label>
          <label className="block">
            <span className={formLabelClass}>Bắt đầu</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={formInputClass} />
          </label>
          <label className="block">
            <span className={formLabelClass}>Kết thúc</span>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={formInputClass} />
          </label>
          <label className="block">
            <span className={formLabelClass}>Sân</span>
            <input type="number" min={1} max={maxCourtCount} value={courtCount} onChange={(event) => setCourtCount(Number(event.target.value))} className={formInputClass} />
            <span className="mt-1 block text-[11px] text-muted-foreground">Tối đa {maxCourtCount} sân</span>
          </label>
          <label className="block md:col-span-3">
            <span className={formLabelClass}>Ghi chú</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} />
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
              <article key={session.id} className="rounded-xl border border-info/25 bg-info-soft/50 p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_130px_130px_100px] md:items-end">
                  <label className="block">
                    <span className={formLabelClass}>Tên ca</span>
                    <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Bắt đầu</span>
                    <input type="time" value={editForm.startTime} onChange={(event) => setEditForm((current) => ({ ...current, startTime: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Kết thúc</span>
                    <input type="time" value={editForm.endTime} onChange={(event) => setEditForm((current) => ({ ...current, endTime: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Sân</span>
                    <input type="number" min={1} max={maxCourtCount} value={editForm.courtCount} onChange={(event) => setEditForm((current) => ({ ...current, courtCount: Number(event.target.value) }))} className={formInputClass} />
                    <span className="mt-1 block text-[11px] text-muted-foreground">Tối đa {maxCourtCount} sân</span>
                  </label>
                  <label className="block md:col-span-3">
                    <span className={formLabelClass}>Ghi chú</span>
                    <input value={editForm.note} onChange={(event) => setEditForm((current) => ({ ...current, note: event.target.value }))} className={formInputClass} />
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
            <article key={session.id} className="rounded-xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{session.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{session.startTime}-{session.endTime} · {session.courtCount} sân · {getSessionStatusLabel(session.status)}</div>
                  {session.note ? <div className="mt-2 text-sm text-muted-foreground">{session.note}</div> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={!canModify} onClick={() => beginEditSession(session)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="danger" disabled={!canModify || deletePlaySession.isPending} onClick={() => void removeSession(session)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`/sessions/${session.id}`}>
                    <Button size="sm">Chi tiết ca</Button>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!isLoading && playDate && playDate.sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted p-5 text-sm text-muted-foreground">Ngày này chưa có ca chơi.</div>
      ) : null}
    </PageShell>
  );
}
