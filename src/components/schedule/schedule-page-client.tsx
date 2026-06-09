'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarPlus, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePlayDates, useScheduleMutations } from '@/hooks/use-play-dates';
import { isPastDateInput, todayDateInput } from '@/lib/date-format';

export function SchedulePageClient() {
  const { data: playDates = [], isLoading, error } = usePlayDates();
  const { createPlayDate, deletePlayDate } = useScheduleMutations();
  const today = useMemo(() => todayDateInput(), []);
  const [playDate, setPlayDate] = useState(today);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Playing schedule</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Lịch chơi</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">Tạo ngày chơi và mở từng ca để vận hành runtime sân.</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-xs text-slate-400">Ngày chơi</span>
            <input type="date" min={today} value={playDate} onChange={(event) => setPlayDate(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Tiêu đề</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="VD: Thứ ... | 202...-...-..." className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Ghi chú</span>
            <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
          </label>
          <Button type="submit" disabled={createPlayDate.isPending} className="h-11">
            {createPlayDate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Tạo ngày
          </Button>
        </form>
      </section>

      {isLoading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải lịch chơi...</div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div> : null}
      {actionError ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">{actionError}</div> : null}

      <section className="grid gap-3 lg:grid-cols-2">
        {sortedPlayDates.map((item) => {
          const isPast = isPastDateInput(item.playDate, today);
          return (
          <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white">{item.title || item.playDate}</div>
                  {isPast ? <span className="rounded-full border border-slate-500/30 bg-slate-700/30 px-2 py-0.5 text-[11px] text-slate-300">Chỉ xem lại</span> : null}
                </div>
                <div className="mt-1 text-xs text-slate-400">{item.playDate} · {item.sessionCount} ca</div>
                {item.note ? <div className="mt-2 text-sm text-slate-300">{item.note}</div> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/schedule/${item.id}`}>
                  <Button size="sm" variant="secondary">Mở</Button>
                </Link>
                {!isPast ? (
                  <Button size="sm" variant="danger" disabled={deletePlayDate.isPending} onClick={() => void removePlayDate(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            {item.sessions.length > 0 ? (
              <div className="mt-3 space-y-2">
                {[...item.sessions].sort((left, right) => left.startTime.localeCompare(right.startTime)).slice(0, 3).map((session) => (
                  <Link key={session.id} href={`/sessions/${session.id}`} className="block rounded-lg bg-slate-950/60 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900">
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
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">Chưa có ngày chơi nào. Tạo ngày chơi đầu tiên ở trên.</div>
      ) : null}
    </div>
  );
}
