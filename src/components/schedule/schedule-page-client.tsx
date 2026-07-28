'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarPlus, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';

import { ActionMenu } from '@/components/ui/action-menu';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, LoadingState, WarningState } from '@/components/ui/feedback';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/form';
import { PageFeedbackStack, PageHeader, PageShell, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/surface';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePlayDates, useScheduleMutations } from '@/hooks/use-play-dates';
import { hasPermission } from '@/lib/auth/permissions';
import { isPastDateInput, todayDateInput } from '@/lib/date-format';
import { getSessionStatusLabel, normalizeSessionStatus } from '@/lib/session-status';

const scheduleInteractiveClass =
  'hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:ring-2 hover:ring-primary/15 focus-visible:ring-focus/50 active:bg-primary-soft/80 active:text-primary';
const compactScheduleButtonClass = `h-9 whitespace-nowrap px-3 text-xs ${scheduleInteractiveClass}`;
const compactIconButtonClass = `h-9 min-w-9 px-2 ${scheduleInteractiveClass}`;

export function SchedulePageClient() {
  const { data: playDates = [], isLoading, error } = usePlayDates();
  const { data: currentUser } = useCurrentUser();
  const { createPlayDate, deletePlayDate } = useScheduleMutations();
  const canManageSchedule = hasPermission(currentUser ?? null, 'schedule.manage');
  const today = useMemo(() => todayDateInput(), []);
  const [playDate, setPlayDate] = useState(today);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [createFormExpanded, setCreateFormExpanded] = useState(true);
  const [expandedDateIds, setExpandedDateIds] = useState<Set<string>>(() => new Set());
  const [pendingDeletePlayDateId, setPendingDeletePlayDateId] = useState<string | null>(null);
  const sortedPlayDates = useMemo(() => {
    return [...playDates].sort((left, right) => right.playDate.localeCompare(left.playDate));
  }, [playDates]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      await createPlayDate.mutateAsync({ playDate, title, note });
      setTitle('');
      setNote('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể tạo ngày chơi');
    }
  }

  function togglePlayDateSessions(id: string) {
    setExpandedDateIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function hasIncompleteSessions(sessions: Array<{ status?: string | null }>) {
    return sessions.some((session) => {
      const normalized = normalizeSessionStatus(session.status);
      return normalized === 'PENDING' || normalized === 'ACTIVE';
    });
  }

  function getSessionStatusTone(status?: string | null) {
    const normalized = normalizeSessionStatus(status);
    if (normalized === 'ACTIVE') return 'info';
    if (normalized === 'COMPLETED') return 'success';
    if (normalized === 'CANCELLED') return 'danger';
    return 'warning';
  }

  function requestRemovePlayDate(id: string) {
    const item = playDates.find((playDateItem) => playDateItem.id === id);
    if (item && isPastDateInput(item.playDate, today)) {
      setActionError('Ngày chơi đã thuộc quá khứ, chỉ được xem lại thông tin.');
      return;
    }
    setActionError(null);
    setPendingDeletePlayDateId(id);
  }

  async function confirmRemovePlayDate() {
    if (!pendingDeletePlayDateId) return;
    setActionError(null);
    try {
      await deletePlayDate.mutateAsync(pendingDeletePlayDateId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa ngày chơi');
    } finally {
      setPendingDeletePlayDateId(null);
    }
  }

  const pendingDeletePlayDate = playDates.find((item) => item.id === pendingDeletePlayDateId);

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title="Lịch chơi"
        description="Tạo ngày chơi, mở ngày để tạo ca, rồi vào chi tiết ca để thêm người chơi và điều phối sân."
      />

      {canManageSchedule ? (
        <FormSection
          title="Tạo ngày chơi"
          description="Chọn ngày, thêm tiêu đề nếu có (Mặc định hệ thống tự tạo tiêu đề, ngày theo thời gian thực)."
          collapsible
          expanded={createFormExpanded}
          onExpandedChange={setCreateFormExpanded}
          showCollapseLabel
          contentClassName="pt-0"
          className="rounded-xl"
        >
          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_minmax(220px,1fr)_auto] lg:items-end">
            <label className="block">
              <span className={formLabelClass}>Tiêu đề</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="VD: Thứ ... | 202...-...-..." className={formInputClass} />
            </label>
            <label className="block lg:w-[180px]">
              <span className={formLabelClass}>Ngày chơi</span>
              <Input type="date" min={today} value={playDate} onChange={(event) => setPlayDate(event.target.value)} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Ghi chú</span>
              <Input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} />
            </label>
            <Button type="submit" disabled={createPlayDate.isPending} className="h-10 whitespace-nowrap px-4 lg:w-auto">
              {createPlayDate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              Tạo ngày
            </Button>
          </form>
        </FormSection>
      ) : null}

      {(isLoading || error || actionError) ? (
        <PageFeedbackStack>
          {isLoading ? <LoadingState title="Đang tải lịch chơi..." size="sm" /> : null}
          {error ? <ErrorState title={error.message} size="sm" /> : null}
          {actionError ? <WarningState title={actionError} size="sm" /> : null}
        </PageFeedbackStack>
      ) : null}

      <section aria-label="Danh sách ngày chơi" className="grid gap-3 lg:grid-cols-2">
        {sortedPlayDates.map((item) => {
          const isPast = isPastDateInput(item.playDate, today);
          const isToday = item.playDate === today;
          const expanded = expandedDateIds.has(item.id);
          const hasIncompleteSession = hasIncompleteSessions(item.sessions);
          const sortedSessions = [...item.sessions].sort((left, right) => left.startTime.localeCompare(right.startTime));
          return (
          <Card
            key={item.id}
            padding="sm"
            className={`transition-[background-color,border-color,box-shadow] duration-150 ${
              isToday
                ? 'border-info/35 ring-1 ring-info/15'
                : hasIncompleteSession
                  ? 'border-warning/35 ring-1 ring-warning/15'
                  : ''
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 break-words text-base font-semibold leading-tight text-foreground sm:text-lg">{item.title || item.playDate}</div>
                  {isToday ? <StatusBadge tone="info" className="min-h-6 px-2 text-xs">Hôm nay</StatusBadge> : null}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <span>{item.playDate} · {item.sessionCount} ca</span>
                  {item.sessions.length > 0 ? (
                    <Button
                      type="button"
                      onClick={() => togglePlayDateSessions(item.id)}
                      variant="secondary"
                      size="sm"
                      className={compactScheduleButtonClass}
                      aria-label={expanded ? 'Thu gọn danh sách ca' : 'Mở danh sách ca'}
                      aria-expanded={expanded}
                      aria-controls={`play-date-sessions-${item.id}`}
                    >
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {expanded ? 'Thu gọn' : 'Danh sách ca'}
                    </Button>
                  ) : null}
                </div>
                {(hasIncompleteSession || isPast) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hasIncompleteSession ? <StatusBadge tone="warning" className="min-h-6 px-2 text-xs">Có ca chưa hoàn tất</StatusBadge> : null}
                    {isPast ? <StatusBadge tone="neutral" className="min-h-6 px-2 text-xs">Chỉ xem lại</StatusBadge> : null}
                  </div>
                ) : null}
                {item.note ? <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">{item.note}</div> : null}
              </div>
              <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
                <Link href={`/schedule/${item.id}`} className="w-full sm:w-auto" aria-label={`Mở chi tiết ngày chơi ${item.title || item.playDate}`}>
                  <Button size="sm" variant="secondary" className={`w-full sm:w-auto ${compactScheduleButtonClass}`}>Chi tiết ngày</Button>
                </Link>
                {!isPast && canManageSchedule ? (
                  <ActionMenu
                    label={`Mở thao tác ngày chơi ${item.title || item.playDate}`}
                    triggerClassName={compactIconButtonClass}
                    items={[
                      {
                        key: 'delete',
                        label: 'Xóa ngày',
                        icon: Trash2,
                        danger: true,
                        disabled: deletePlayDate.isPending,
                        onSelect: () => requestRemovePlayDate(item.id)
                      }
                    ]}
                  />
                ) : null}
              </div>
            </div>
            {item.sessions.length > 0 && expanded ? (
              <div id={`play-date-sessions-${item.id}`} className="mt-3 space-y-2 border-t border-border pt-3">
                {sortedSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    aria-label={`Mở chi tiết ca ${session.name}, ${session.startTime}-${session.endTime}`}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs outline-none transition-[background-color,border-color,box-shadow] hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:ring-2 hover:ring-primary/15 focus-visible:ring-2 focus-visible:ring-focus/50 sm:flex-row sm:items-center sm:justify-between sm:text-sm"
                  >
                    <span className="min-w-0 font-semibold text-foreground">
                      {session.startTime}-{session.endTime} · {session.name} · {session.courtCount} sân
                    </span>
                    <StatusBadge tone={getSessionStatusTone(session.status)} className="shrink-0">
                      {getSessionStatusLabel(session.status)}
                    </StatusBadge>
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>
          );
        })}
      </section>

      {!isLoading && playDates.length === 0 ? (
        <PageFeedbackStack>
          <EmptyState title="Chưa có ngày chơi" description="Tạo ngày chơi đầu tiên ở trên." />
        </PageFeedbackStack>
      ) : null}
      <ConfirmationDialog
        open={Boolean(pendingDeletePlayDateId)}
        title="Xóa ngày chơi?"
        description={pendingDeletePlayDate ? `Ngày ${pendingDeletePlayDate.title || pendingDeletePlayDate.playDate} sẽ bị xóa theo đúng quyền và mutation hiện tại.` : 'Ngày chơi sẽ bị xóa theo đúng quyền và mutation hiện tại.'}
        confirmLabel="Xóa ngày"
        cancelLabel="Hủy"
        tone="danger"
        isLoading={deletePlayDate.isPending}
        onCancel={() => setPendingDeletePlayDateId(null)}
        onConfirm={confirmRemovePlayDate}
      />
    </PageShell>
  );
}
