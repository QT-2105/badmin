'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

import { ActionMenu } from '@/components/ui/action-menu';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/form';
import { NoticeCard, PageFeedbackStack, PageHeader, PageShell, formLabelClass } from '@/components/ui/page-layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/surface';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePlayDate, useScheduleMutations } from '@/hooks/use-play-dates';
import { hasPermission } from '@/lib/auth/permissions';
import { formatPlayDateTitle, isPastDateInput, todayDateInput } from '@/lib/date-format';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';
import type { PlaySessionSummary } from '@/types/domain';

const scheduleInteractiveClass =
  'hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:ring-2 hover:ring-primary/15 focus-visible:ring-focus/50 active:bg-primary-soft/80 active:text-primary';
const schedulePrimaryActionClass = 'hover:brightness-110 hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50 active:brightness-95';
const compactScheduleButtonClass = `h-9 whitespace-nowrap px-3 text-xs ${scheduleInteractiveClass}`;
const compactIconButtonClass = `h-9 min-w-9 px-2 ${scheduleInteractiveClass}`;
const compactInputClass = 'block h-10';
const sessionContentWidthClass = 'max-w-[1080px]';
const sessionFormGridClass = 'grid max-w-full gap-4';
const sessionTopRowClass =
  'grid max-w-full gap-3 min-[980px]:grid-cols-[minmax(18rem,30rem)_8.5rem_8.5rem_5.5rem] min-[980px]:items-start min-[980px]:justify-start';
const sessionBottomRowClass =
  'grid max-w-full gap-3 min-[780px]:grid-cols-[minmax(18rem,30rem)_8.75rem] min-[780px]:items-end min-[780px]:justify-start';
const sessionEditFormGridClass = 'grid max-w-full gap-3';
const sessionEditTopRowClass =
  'grid max-w-full gap-3 min-[920px]:grid-cols-[minmax(16rem,28rem)_8rem_8rem_5.25rem] min-[920px]:items-start min-[920px]:justify-start';
const sessionEditBottomRowClass =
  'grid max-w-full gap-3 min-[780px]:grid-cols-[minmax(16rem,28rem)_auto] min-[780px]:items-end min-[780px]:justify-start';
const sessionFieldClass = 'grid min-w-0 content-start gap-1.5';
const sessionLabelClass = `${formLabelClass} block leading-4`;
const sessionNameFieldClass = `${sessionFieldClass} min-[780px]:max-w-[30rem]`;
const sessionTimeFieldClass = `${sessionFieldClass} min-[780px]:max-w-[8.5rem]`;
const sessionCourtFieldClass = `${sessionFieldClass} min-[780px]:max-w-[5.5rem]`;
const sessionActionFieldClass = 'flex min-w-0 items-end';
const sessionNoteFieldClass = `${sessionFieldClass} min-[780px]:max-w-[30rem]`;
const sessionNameInputClass = `${compactInputClass} w-full min-[780px]:max-w-[30rem]`;
const sessionTimeInputClass = `${compactInputClass} w-full min-[780px]:w-[8.5rem]`;
const sessionCourtInputClass = `${compactInputClass} w-full text-right tabular-nums min-[780px]:w-[5.5rem]`;
const sessionNoteInputClass = `${compactInputClass} w-full`;
const sessionEditNameFieldClass = `${sessionFieldClass} min-[780px]:max-w-[28rem]`;
const sessionEditTimeFieldClass = `${sessionFieldClass} min-[780px]:max-w-[8rem]`;
const sessionEditCourtFieldClass = `${sessionFieldClass} min-[780px]:max-w-[5.25rem]`;
const sessionEditNoteFieldClass = `${sessionFieldClass} min-[780px]:max-w-[28rem]`;
const sessionEditNameInputClass = `${compactInputClass} w-full min-[780px]:max-w-[28rem]`;
const sessionEditTimeInputClass = `${compactInputClass} w-full min-[780px]:w-[8rem]`;
const sessionEditCourtInputClass = `${compactInputClass} w-full text-right tabular-nums min-[780px]:w-[5.25rem]`;

export function PlayDateDetailClient({ playDateId }: { playDateId: string }) {
  const { data: playDate, isLoading, error } = usePlayDate(playDateId);
  const { data: currentUser } = useCurrentUser();
  const { createPlaySession, updatePlaySession, deletePlaySession } = useScheduleMutations(playDateId);
  const { settings } = useAppSettings();
  const [name, setName] = useState('');
  const [hasEditedName, setHasEditedName] = useState(false);
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('22:00');
  const [courtCount, setCourtCount] = useState(2);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', startTime: '', endTime: '', courtCount: 1, note: '' });
  const [pendingDeleteSession, setPendingDeleteSession] = useState<PlaySessionSummary | null>(null);
  const today = useMemo(() => todayDateInput(), []);
  const isPastPlayDate = Boolean(playDate?.playDate && isPastDateInput(playDate.playDate, today));
  const sortedSessions = useMemo(() => {
    return [...(playDate?.sessions ?? [])].sort((left, right) => left.startTime.localeCompare(right.startTime));
  }, [playDate?.sessions]);
  const maxCourtCount = settings.maxCourtCountPerSession;
  const canManageSessions = hasPermission(currentUser ?? null, 'schedule.manage');
  const suggestedSessionName = useMemo(() => {
    const weekday = playDate?.playDate ? formatPlayDateTitle(playDate.playDate).split('|')[0]?.trim() : 'Thứ ...';
    const startHour = startTime.slice(0, 2) || 'hh';
    const endHour = endTime.slice(0, 2) || 'hh';
    return `Ca ${startHour}-${endHour} | ${weekday}`;
  }, [endTime, playDate?.playDate, startTime]);

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

  useEffect(() => {
    if (!hasEditedName) {
      setName(suggestedSessionName);
    }
  }, [hasEditedName, suggestedSessionName]);

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
      setHasEditedName(false);
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

  function requestRemoveSession(session: PlaySessionSummary) {
    if (isPastPlayDate) {
      setActionError('Ngày chơi đã thuộc quá khứ, không thể xóa ca chơi.');
      return;
    }
    setActionError(null);
    setPendingDeleteSession(session);
  }

  async function confirmRemoveSession() {
    if (!pendingDeleteSession) return;
    setActionError(null);
    try {
      await deletePlaySession.mutateAsync(pendingDeleteSession.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa ca chơi');
    } finally {
      setPendingDeleteSession(null);
    }
  }

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title={playDate?.title || playDate?.playDate || 'Ngày chơi'}
        description={playDate ? `${playDate.playDate} · ${playDate.sessionCount} ca` : 'Đang tải ngày chơi...'}
        backAction={
          <Link
            href="/schedule"
            className={`inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground shadow-subtle outline-none transition-[background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${scheduleInteractiveClass}`}
            aria-label="Quay lại danh sách lịch chơi"
          >
            ← Quay lại lịch
          </Link>
        }
      />

      {(isLoading || error || actionError) ? (
        <PageFeedbackStack>
          {isLoading ? <NoticeCard>Đang tải ngày chơi...</NoticeCard> : null}
          {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
          {actionError ? <NoticeCard tone="warning">{actionError}</NoticeCard> : null}
        </PageFeedbackStack>
      ) : null}

      {!isPastPlayDate && canManageSessions ? (
        <FormSection
          title="Tạo ca chơi"
          description="Nhập thời gian và số sân cho ca trong ngày này."
          contentClassName="pt-0"
          className={`${sessionContentWidthClass} rounded-xl`}
        >
          <form onSubmit={submit} className={sessionFormGridClass}>
            <div className={sessionTopRowClass}>
              <label className={sessionNameFieldClass}>
                <span className={sessionLabelClass}>Tên ca</span>
                <Input
                  value={name}
                  onChange={(event) => {
                    setHasEditedName(true);
                    setName(event.target.value);
                  }}
                  maxLength={50}
                  placeholder={suggestedSessionName}
                  className={sessionNameInputClass}
                />
              </label>
              <label className={sessionTimeFieldClass}>
                <span className={sessionLabelClass}>Giờ bắt đầu</span>
                <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} maxLength={10} className={sessionTimeInputClass} />
              </label>
              <label className={sessionTimeFieldClass}>
                <span className={sessionLabelClass}>Giờ kết thúc</span>
                <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} maxLength={10} className={sessionTimeInputClass} />
              </label>
              <label className={sessionCourtFieldClass}>
                <span className={sessionLabelClass}>Số sân</span>
                <Input type="number" min={1} max={maxCourtCount} maxLength={2} inputMode="numeric" value={courtCount} onChange={(event) => setCourtCount(Number(event.target.value))} className={sessionCourtInputClass} aria-describedby="create-session-court-helper" />
                <span id="create-session-court-helper" className="mt-1 block text-[11px] leading-4 text-muted-foreground">Tối đa {maxCourtCount} sân.</span>
              </label>
            </div>
            <div className={sessionBottomRowClass}>
              <label className={sessionNoteFieldClass}>
                <span className={sessionLabelClass}>Ghi chú</span>
                <Input value={note} onChange={(event) => setNote(event.target.value)} className={sessionNoteInputClass} />
              </label>
              <div className={sessionActionFieldClass}>
                <Button type="submit" disabled={createPlaySession.isPending} className={`h-10 w-full whitespace-nowrap px-4 min-[780px]:w-[8.75rem] ${schedulePrimaryActionClass}`}>
                  {createPlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tạo ca
                </Button>
              </div>
            </div>
          </form>
        </FormSection>
      ) : null}

      <section aria-label="Danh sách ca chơi trong ngày" className={`${sessionContentWidthClass} space-y-3`}>
        {sortedSessions.map((session) => {
          const canModify = canManageSessions && !isPastPlayDate && normalizeSessionStatus(session.status) === 'PENDING';
          const isEditing = editingSessionId === session.id;

          if (isEditing) {
            return (
              <Card key={session.id} padding="sm" className="border-info/25 ring-1 ring-info/10">
                <div className={sessionEditFormGridClass}>
                  <div className={sessionEditTopRowClass}>
                    <label className={sessionEditNameFieldClass}>
                      <span className={sessionLabelClass}>Tên ca</span>
                      <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} maxLength={50} className={sessionEditNameInputClass} />
                    </label>
                    <label className={sessionEditTimeFieldClass}>
                      <span className={sessionLabelClass}>Giờ bắt đầu</span>
                      <Input type="time" value={editForm.startTime} onChange={(event) => setEditForm((current) => ({ ...current, startTime: event.target.value }))} maxLength={10} className={sessionEditTimeInputClass} />
                    </label>
                    <label className={sessionEditTimeFieldClass}>
                      <span className={sessionLabelClass}>Giờ kết thúc</span>
                      <Input type="time" value={editForm.endTime} onChange={(event) => setEditForm((current) => ({ ...current, endTime: event.target.value }))} maxLength={10} className={sessionEditTimeInputClass} />
                    </label>
                    <label className={sessionEditCourtFieldClass}>
                      <span className={sessionLabelClass}>Số sân</span>
                      <Input type="number" min={1} max={maxCourtCount} maxLength={2} inputMode="numeric" value={editForm.courtCount} onChange={(event) => setEditForm((current) => ({ ...current, courtCount: Number(event.target.value) }))} className={sessionEditCourtInputClass} aria-describedby={`edit-session-court-helper-${session.id}`} />
                      <span id={`edit-session-court-helper-${session.id}`} className="mt-1 block text-[11px] leading-4 text-muted-foreground">Tối đa {maxCourtCount} sân.</span>
                    </label>
                  </div>
                  <div className={sessionEditBottomRowClass}>
                    <label className={sessionEditNoteFieldClass}>
                      <span className={sessionLabelClass}>Ghi chú</span>
                      <Input value={editForm.note} onChange={(event) => setEditForm((current) => ({ ...current, note: event.target.value }))} className={sessionNoteInputClass} />
                    </label>
                    <div className={`${sessionActionFieldClass} flex-wrap gap-2`}>
                      <Button aria-label="Lưu chỉnh sửa ca" size="sm" variant="secondary" disabled={updatePlaySession.isPending} onClick={() => void saveEditSession()} className={`h-10 min-w-[5.5rem] px-3 text-xs ${scheduleInteractiveClass}`}>
                        {updatePlaySession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Lưu
                      </Button>
                      <Button aria-label="Hủy chỉnh sửa ca" size="sm" variant="ghost" onClick={cancelEditSession} className={`h-10 min-w-[5.5rem] px-3 text-xs ${scheduleInteractiveClass}`}>
                        <X className="h-4 w-4" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          }

          return (
            <Card key={session.id} padding="sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 break-words text-base font-semibold leading-tight text-foreground sm:text-lg">{session.name}</div>
                    <StatusBadge tone={getSessionStatusTone(session.status)} className="min-h-6 px-2 text-xs">
                      {getSessionStatusLabel(session.status)}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{session.startTime}-{session.endTime} · {session.courtCount} sân</div>
                  {session.note ? <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">{session.note}</div> : null}
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-2 md:w-auto md:justify-end">
                  <Link href={`/sessions/${session.id}`} className="w-full md:w-auto" aria-label={`Mở chi tiết ca ${session.name}, ${session.startTime}-${session.endTime}`}>
                    <Button size="sm" className={`w-full md:w-auto ${compactScheduleButtonClass}`}>Chi tiết ca</Button>
                  </Link>
                  <ActionMenu
                    label={`Mở thao tác ca ${session.name}`}
                    triggerClassName={compactIconButtonClass}
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
                        onSelect: () => requestRemoveSession(session)
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
        <PageFeedbackStack className={sessionContentWidthClass}>
          <EmptyState title="Chưa có ca chơi" description="Ngày này chưa có ca nào được tạo." className="py-8 md:py-9" />
        </PageFeedbackStack>
      ) : null}
      <ConfirmationDialog
        open={Boolean(pendingDeleteSession)}
        title="Xóa ca chơi?"
        description={pendingDeleteSession ? `Ca "${pendingDeleteSession.name}" sẽ bị xóa theo đúng quyền và mutation hiện tại.` : 'Ca chơi sẽ bị xóa theo đúng quyền và mutation hiện tại.'}
        confirmLabel="Xóa ca"
        cancelLabel="Hủy"
        tone="danger"
        isLoading={deletePlaySession.isPending}
        onCancel={() => setPendingDeleteSession(null)}
        onConfirm={confirmRemoveSession}
      />
    </PageShell>
  );
}
