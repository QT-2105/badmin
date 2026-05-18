"use client";

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

type SessionItem = {
  id: string;
  playDate: string;
  startsAt: string;
  endsAt: string;
  courtCount: number;
  createdAt: string;
};

const STORAGE_KEY = 'badmin_sessions_v1';

function loadSessions(): SessionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionItem[];
  } catch {
    return [];
  }
}

function saveSessions(items: SessionItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [playDate, setPlayDate] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('18:00');
  const [endsAt, setEndsAt] = useState<string>('20:00');
  const [courtCount, setCourtCount] = useState<number>(3);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  function createSession(e?: React.FormEvent) {
    e?.preventDefault();
    const date = playDate || new Date().toISOString().slice(0, 10);
    const s: SessionItem = {
      id: uuidv4(),
      playDate: date,
      startsAt,
      endsAt,
      courtCount,
      createdAt: new Date().toISOString()
    };

    const next = [s, ...sessions];
    setSessions(next);
    saveSessions(next);
    setPlayDate('');
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Ca chơi</h1>
        <Link href="/">
          <Button size="sm" variant="ghost">Quay lại</Button>
        </Link>
      </header>

      <section className="mb-6 rounded-2xl bg-card/80 p-4">
        <form onSubmit={createSession} className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-sm text-slate-400">Ngày thi đấu</label>
            <input className="mt-1 w-full rounded-md bg-slate-900/70 p-2 text-sm text-white" type="date" value={playDate} onChange={(e) => setPlayDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Bắt đầu</label>
            <input className="mt-1 w-full rounded-md bg-slate-900/70 p-2 text-sm text-white" type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Kết thúc</label>
            <input className="mt-1 w-full rounded-md bg-slate-900/70 p-2 text-sm text-white" type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <div className="w-full">
              <label className="block text-sm text-slate-400">Sân</label>
              <input className="mt-1 w-full rounded-md bg-slate-900/70 p-2 text-sm text-white" type="number" min={2} max={8} value={courtCount} onChange={(e) => setCourtCount(Number(e.target.value))} />
            </div>
            <div className="ml-2">
              <Button type="submit" className="mt-6">Tạo</Button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {sessions.length === 0 && <div className="text-sm text-slate-400">Chưa có ca nào. Tạo một ca ở trên.</div>}
        {sessions.map((s) => (
          <article key={s.id} className="flex items-center justify-between rounded-xl bg-white/4 p-3">
            <div>
              <div className="text-sm font-medium text-white">{s.playDate} · {s.startsAt}-{s.endsAt}</div>
              <div className="text-xs text-slate-400">{s.courtCount} sân · tạo {new Date(s.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/sessions/${s.id}`}>
                <Button size="sm">Mở</Button>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
