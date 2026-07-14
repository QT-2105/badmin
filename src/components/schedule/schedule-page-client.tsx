'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarPlus, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoticeCard, PageHeader, PageShell, SectionCard, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { useCurrentUser } from '@/hooks/use-auth';
import { usePlayDates, useScheduleMutations } from '@/hooks/use-play-dates';
import { hasPermission } from '@/lib/auth/permissions';
import { isPastDateInput, todayDateInput } from '@/lib/date-format';
import { normalizeSessionStatus } from '@/lib/session-status';

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
  const [expandedDateIds, setExpandedDateIds] = useState<Set<string>>(() => new Set());
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

  async function removePlayDate(id: string) {
    const item = playDates.find((playDateItem) => playDateItem.id === id);
    if (item && isPastDateInput(item.playDate, today)) {
      setActionError('Ngày chơi đã thuộc quá khứ, chỉ được xem lại thông tin.');
      return;
    }
    if (!window.confirm('Xóa ngày chơi này?')) return;
    setActionError(null);
    try {
      await deletePlayDate.mutateAsync(id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể xóa ngày chơi');
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Lịch vận hành"
        title="Lịch chơi"
        description="Tạo ngày chơi trước, mở chi tiết ngày để tạo ca, sau đó vào chi tiết ca để thêm người chơi, bắt đầu ca và điều phối sân."
      />

      {canManageSchedule ? (
      <SectionCard>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className={formLabelClass}>Ngày chơi</span>
            <input type="date" min={today} value={playDate} onChange={(event) => setPlayDate(event.target.value)} className={formInputClass} />
          </label>
          <label className="block">
            <span className={formLabelClass}>Tiêu đề</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="VD: Thứ ... | 202...-...-..." className={formInputClass} />
          </label>
          <label className="block">
            <span className={formLabelClass}>Ghi chú</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} />
          </label>
          <Button type="submit" disabled={createPlayDate.isPending} className="h-11">
            {createPlayDate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Tạo ngày
          </Button>
        </form>
      </SectionCard>
      ) : null}

      {isLoading ? <NoticeCard>Đang tải lịch chơi...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
      {actionError ? <NoticeCard tone="warning">{actionError}</NoticeCard> : null}

      <section className="grid gap-3 lg:grid-cols-2">
        {sortedPlayDates.map((item) => {
          const isPast = isPastDateInput(item.playDate, today);
          const isToday = item.playDate === today;
          const expanded = expandedDateIds.has(item.id);
          const hasIncompleteSession = hasIncompleteSessions(item.sessions);
          const sortedSessions = [...item.sessions].sort((left, right) => left.startTime.localeCompare(right.startTime));
          return (
          <article
            key={item.id}
            className={`rounded-xl border p-4 shadow-soft transition-colors ${
              isToday
                ? 'border-info/45 bg-surface ring-1 ring-info/15'
                : hasIncompleteSession
                  ? 'border-warning/45 bg-surface ring-1 ring-warning/15'
                  : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">{item.title || item.playDate}</div>
                  {isToday ? <span className="rounded-full border border-info/30 bg-info-soft px-2 py-0.5 text-[11px] font-semibold text-info">Hôm nay</span> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.playDate} · {item.sessionCount} ca</span>
                  {item.sessions.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => togglePlayDateSessions(item.id)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-surface-muted px-2 text-[11px] font-semibold text-foreground transition hover:bg-muted"
                      aria-label={expanded ? 'Thu gọn danh sách ca' : 'Mở danh sách ca'}
                    >
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {expanded ? 'Thu gọn' : 'Danh sách ca'}
                    </button>
                  ) : null}
                </div>
                {(hasIncompleteSession || isPast) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hasIncompleteSession ? <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">Có ca chưa hoàn tất</span> : null}
                    {isPast ? <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Chỉ xem lại</span> : null}
                  </div>
                ) : null}
                {item.note ? <div className="mt-2 text-sm text-muted-foreground">{item.note}</div> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/schedule/${item.id}`}>
                  <Button size="sm" variant="secondary">Chi tiết ngày</Button>
                </Link>
                {!isPast && canManageSchedule ? (
                  <Button size="sm" variant="danger" disabled={deletePlayDate.isPending} onClick={() => void removePlayDate(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            {item.sessions.length > 0 && expanded ? (
              <div className="mt-3 space-y-2">
                {sortedSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block rounded-lg border border-info/25 bg-info-soft px-3 py-2 text-sm font-semibold text-info transition hover:border-info/50 hover:bg-info-soft/80"
                  >
                    {session.name} · {session.startTime}-{session.endTime} · {session.courtCount} sân
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
          );
        })}
      </section>

      {!isLoading && playDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted p-5 text-sm text-muted-foreground">Chưa có ngày chơi nào. Tạo ngày chơi đầu tiên ở trên.</div>
      ) : null}
    </PageShell>
  );
}
