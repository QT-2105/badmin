'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { ActionMenu } from '@/components/ui/action-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/form';
import { NoticeCard, PageHeader, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/surface';
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

  function getSessionStatusTone(status?: string | null) {
    const normalized = normalizeSessionStatus(status);
    if (normalized === 'ACTIVE') return 'info';
    if (normalized === 'COMPLETED') return 'success';
    if (normalized === 'CANCELLED') return 'danger';
    return 'warning';
  }

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
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title={playDate?.title || playDate?.playDate || 'Ngày chơi'}
        description={playDate ? `${playDate.playDate} · ${playDate.sessionCount} ca` : 'Đang tải ngày chơi...'}
        backAction={<Link href="/schedule" className="inline-flex rounded-md text-xs font-medium text-info outline-none hover:text-info/80 focus-visible:ring-2 focus-visible:ring-focus/25">← Quay lại lịch</Link>}
      />

      {isLoading ? <NoticeCard>Đang tải ngày chơi...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
      {actionError ? <NoticeCard tone="warning">{actionError}</NoticeCard> : null}

      {!isPastPlayDate && canManageSessions ? (
        <FormSection
          title="Tạo ca chơi"
          description="Nhập thời gian và số sân cho ca trong ngày này."
          contentClassName="pt-1"
        >
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_130px_130px_100px] lg:grid-cols-[minmax(220px,1fr)_130px_130px_100px_auto] lg:items-end">
            <label className="block">
              <span className={formLabelClass}>Tên ca</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Bắt đầu</span>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Kết thúc</span>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Sân</span>
              <Input type="number" min={1} max={maxCourtCount} value={courtCount} onChange={(event) => setCourtCount(Number(event.target.value))} className={formInputClass} />
              <span className="mt-1 block text-[11px] text-muted-foreground">Tối đa {maxCourtCount} sân</span>
            </label>
            <Button type="submit" disabled={createPlaySession.isPending} className="h-11 whitespace-nowrap md:col-span-4 lg:col-span-1">
              {createPlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tạo ca
            </Button>
            <label className="block md:col-span-4 lg:col-span-5">
              <span className={formLabelClass}>Ghi chú</span>
              <Input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} />
            </label>
          </form>
        </FormSection>
      ) : null}

      <section className="space-y-3">
        {sortedSessions.map((session) => {
          const canModify = canManageSessions && !isPastPlayDate && normalizeSessionStatus(session.status) === 'PENDING';
          const isEditing = editingSessionId === session.id;

          if (isEditing) {
            return (
              <Card key={session.id} className="border-info/25 ring-1 ring-info/10">
                <div className="grid gap-3 md:grid-cols-[1fr_130px_130px_100px] md:items-end">
                  <label className="block">
                    <span className={formLabelClass}>Tên ca</span>
                    <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Bắt đầu</span>
                    <Input type="time" value={editForm.startTime} onChange={(event) => setEditForm((current) => ({ ...current, startTime: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Kết thúc</span>
                    <Input type="time" value={editForm.endTime} onChange={(event) => setEditForm((current) => ({ ...current, endTime: event.target.value }))} className={formInputClass} />
                  </label>
                  <label className="block">
                    <span className={formLabelClass}>Sân</span>
                    <Input type="number" min={1} max={maxCourtCount} value={editForm.courtCount} onChange={(event) => setEditForm((current) => ({ ...current, courtCount: Number(event.target.value) }))} className={formInputClass} />
                    <span className="mt-1 block text-[11px] text-muted-foreground">Tối đa {maxCourtCount} sân</span>
                  </label>
                  <label className="block md:col-span-3">
                    <span className={formLabelClass}>Ghi chú</span>
                    <Input value={editForm.note} onChange={(event) => setEditForm((current) => ({ ...current, note: event.target.value }))} className={formInputClass} />
                  </label>
                  <div className="flex gap-2">
                    <Button aria-label="Lưu chỉnh sửa ca" size="sm" variant="secondary" disabled={updatePlaySession.isPending} onClick={() => void saveEditSession()}>
                      {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button aria-label="Hủy chỉnh sửa ca" size="sm" variant="ghost" onClick={cancelEditSession}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Card key={session.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 text-lg font-semibold leading-tight text-foreground">{session.name}</div>
                    <StatusBadge tone={getSessionStatusTone(session.status)}>
                      {getSessionStatusLabel(session.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{session.startTime}-{session.endTime} · {session.courtCount} sân</div>
                  {session.note ? <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.note}</div> : null}
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-2 md:w-auto md:justify-end">
                  <Link href={`/sessions/${session.id}`} className="w-full md:w-auto" aria-label={`Mở chi tiết ca ${session.name}, ${session.startTime}-${session.endTime}`}>
                    <Button size="sm" className="w-full md:w-auto">Chi tiết ca</Button>
                  </Link>
                  <ActionMenu
                    label={`Mở thao tác ca ${session.name}`}
                    items={[
                      {
                        key: 'edit',
                        label: 'Sửa ca',
                        icon: Pencil,
                        disabled: !canModify,
                        onSelect: () => beginEditSession(session)
                      },
                      {
                        key: 'delete',
                        label: 'Xóa ca',
                        icon: Trash2,
                        danger: true,
                        disabled: !canModify || deletePlaySession.isPending,
                        onSelect: () => void removeSession(session)
                      }
                    ]}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {!isLoading && playDate && playDate.sessions.length === 0 ? (
        <EmptyState title="Chưa có ca chơi" description="Ngày này chưa có ca nào được tạo." />
      ) : null}
    </PageShell>
  );
}
