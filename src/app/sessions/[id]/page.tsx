"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SessionData = {
  id: string;
  playDate: string;
  startsAt: string;
  endsAt: string;
  courtCount: number;
};

const SESSIONS_KEY = 'badmin_sessions_v1';

function loadSession(id: string): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw) as SessionData[];
    return arr.find((a) => a.id === id) ?? null;
  } catch {
    return null;
  }
}

const SESSION_STATE_KEY = (id: string) => `badmin_session_state_${id}`;

type Player = { id: string; name: string };

type SuggestedPlayer = Player & {
  reason: string;
};

export default function SessionDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [waiting, setWaiting] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Array<{ number: number; pairA: Player[]; pairB: Player[] }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([]);

  useEffect(() => {
    if (!id) return;
    const s = loadSession(id);
    if (!s) {
      router.replace('/sessions');
      return;
    }
    setSession(s);

    // load persisted session state
    const raw = localStorage.getItem(SESSION_STATE_KEY(id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setWaiting(parsed.waiting ?? []);
        setCourts(parsed.courts ?? []);
        return;
      } catch {}
    }

    const initialCourts = Array.from({ length: s.courtCount }).map((_, i) => ({ number: i + 1, pairA: [], pairB: [] }));
    setCourts(initialCourts);
  }, [id, router]);

  function persist() {
    if (!id) return;
    localStorage.setItem(SESSION_STATE_KEY(id), JSON.stringify({ waiting, courts }));
  }

  useEffect(() => {
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, courts]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setSuggestedPlayers(buildSuggestion(waiting, courts.length || session.courtCount || 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, waiting, courts]);

  function addPlayer(name: string) {
    const p = { id: uuidv4(), name };
    setWaiting((w) => [p, ...w]);
    setNewName('');
    setShowAdd(false);
  }

  function buildSuggestion(waitingPlayers: Player[], courtCount: number): SuggestedPlayer[] {
    return waitingPlayers
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, courtCount * 4)
      .map((player, index) => ({
        ...player,
        reason: index < courtCount * 2 ? 'Ưu tiên vào sân ngay khi có chỗ trống' : 'Dự phòng cho lượt kế tiếp'
      }));
  }

  function refreshSuggestion(nextWaiting: Player[] = waiting, nextCourts = courts) {
    const courtCount = nextCourts.length || session?.courtCount || 1;
    setSuggestedPlayers(buildSuggestion(nextWaiting, courtCount));
  }

  function assignToCourt(playerId: string, courtNumber: number, side: 'A' | 'B') {
    const player = waiting.find((w) => w.id === playerId);
    if (!player) return;
    const nextWaiting = waiting.filter((x) => x.id !== playerId);
    const nextCourts = courts.map((c) => (c.number === courtNumber ? { ...c, [side === 'A' ? 'pairA' : 'pairB']: [...(side === 'A' ? c.pairA : c.pairB), player] } : c));

    setCourts(nextCourts);
    setWaiting(nextWaiting);
    refreshSuggestion(nextWaiting, nextCourts);
  }

  function removeFromCourt(playerId: string) {
    const nextCourts = courts.map((c) => ({ ...c, pairA: c.pairA.filter((p) => p.id !== playerId), pairB: c.pairB.filter((p) => p.id !== playerId) }));
    setCourts(nextCourts);
    refreshSuggestion(waiting, nextCourts);
  }

  function applySuggestion() {
    if (!session) return;

    const nextWaiting = [...waiting];
    const nextCourts = courts.map((court) => {
      const nextCourt = { ...court, pairA: [...court.pairA], pairB: [...court.pairB] };

      while (nextCourt.pairA.length < 2 && nextWaiting.length > 0) {
        nextCourt.pairA.push(nextWaiting.shift() as Player);
      }

      while (nextCourt.pairB.length < 2 && nextWaiting.length > 0) {
        nextCourt.pairB.push(nextWaiting.shift() as Player);
      }

      return nextCourt;
    });

    setCourts(nextCourts);
    setWaiting(nextWaiting);
    refreshSuggestion(nextWaiting, nextCourts);
  }

  if (!session) return null;

  const activePlayers = courts.reduce((count, court) => count + court.pairA.length + court.pairB.length, 0);
  const flowHint = `${activePlayers} người đang ở sân, phần còn lại nằm trong hàng chờ để chuẩn bị cho lượt sau.`;
  const rotationSummary = [
    `${courts.length} sân đang sẵn sàng nhận lượt mới`,
    `${activePlayers} người đang ở sân`,
    `${waiting.length} người đang ở hàng chờ`
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/70 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ca chơi · {session.playDate}</h1>
          <div className="text-sm text-slate-400">{session.startsAt} - {session.endsAt} · {session.courtCount} sân</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/sessions">
            <Button size="sm" variant="ghost">Quay lại</Button>
          </Link>
          <Button size="sm" onClick={() => setShowAdd(true)}>Thêm người chơi</Button>
          <Button size="sm" variant="secondary" onClick={applySuggestion}>Áp dụng gợi ý</Button>
        </div>
      </header>

      <section className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-3">
        {rotationSummary.map((item, index) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Bước {index + 1}</div>
            <div className="mt-1 text-sm text-white">{item}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          <h2 className="mb-2 text-lg font-semibold text-white">Sân đấu</h2>
          <div className="space-y-3">
            {courts.map((c) => (
              <article key={c.number} className="rounded-xl bg-slate-900/70 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Sân {c.number}</div>
                    <div className="text-xs text-slate-400">Cặp A · Cặp B</div>
                  </div>
                  <Badge variant={c.pairA.length + c.pairB.length >= 4 ? 'muted' : 'success'}>{c.pairA.length + c.pairB.length}/4</Badge>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">Cặp A</p>
                    <div className="mt-2 space-y-2">
                      {c.pairA.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-md bg-slate-800/80 px-3 py-2 text-sm text-white">
                          <div>{p.name}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { removeFromCourt(p.id); setWaiting((w)=>[p,...w]); }}>Loại ra</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Cặp B</p>
                    <div className="mt-2 space-y-2">
                      {c.pairB.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-md bg-slate-800/80 px-3 py-2 text-sm text-white">
                          <div>{p.name}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { removeFromCourt(p.id); setWaiting((w)=>[p,...w]); }}>Loại ra</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => {
                    if (waiting.length === 0) return;
                    assignToCourt(waiting[0].id, c.number, 'A');
                  }}>Thêm nhanh A</Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    if (waiting.length === 0) return;
                    assignToCourt(waiting[0].id, c.number, 'B');
                  }}>Thêm nhanh B</Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Gợi ý lượt tiếp theo</h2>
                <p className="mt-1 text-sm text-slate-400">Hệ thống chỉ gợi ý. Người dùng có thể đổi người trước khi áp dụng.</p>
              </div>
              <Badge variant="success">Có thể chỉnh</Badge>
            </div>

            <div className="mt-3 space-y-2">
              {suggestedPlayers.length > 0 ? suggestedPlayers.map((player, index) => (
                <div key={player.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-white">{index + 1}. {player.name}</div>
                      <div className="text-xs text-slate-400">{player.reason}</div>
                    </div>
                    <Badge variant={index < 8 ? 'default' : 'muted'}>{index < 8 ? 'Ưu tiên' : 'Dự bị'}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => assignToCourt(player.id, courts[0]?.number ?? 1, 'A')}>Đưa vào A</Button>
                    <Button size="sm" variant="secondary" onClick={() => assignToCourt(player.id, courts[0]?.number ?? 1, 'B')}>Đưa vào B</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSuggestedPlayers((prev) => prev.filter((item) => item.id !== player.id))}>Bỏ gợi ý</Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">Chưa tạo gợi ý. Bấm “Áp dụng gợi ý” hoặc thêm người chơi vào hàng chờ.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h2 className="mb-2 text-lg font-semibold text-white">Người chơi chờ</h2>
            <div className="space-y-2">
              {waiting.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-md bg-slate-800/80 px-3 py-2 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
                  <div>{p.name}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => assignToCourt(p.id, courts[0]?.number ?? 1, 'A')} variant="ghost">Thêm A</Button>
                    <Button size="sm" onClick={() => assignToCourt(p.id, courts[0]?.number ?? 1, 'B')} variant="ghost">Thêm B</Button>
                  </div>
                </div>
              ))}
              {waiting.length === 0 && <div className="text-sm text-slate-400">Không có người chờ</div>}
            </div>
          </section>
        </aside>
      </section>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-card/90 p-4 shadow-soft backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Thêm người chơi</h3>
            <div className="mt-3 flex gap-2">
              <input className="flex-1 rounded-md bg-slate-900/70 p-2 text-sm text-white" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Tên người chơi" />
              <Button onClick={() => { if (newName.trim()) addPlayer(newName.trim()); }}>
                Thêm
              </Button>
            </div>
            <div className="mt-3 text-right">
              <Button variant="ghost" onClick={()=>setShowAdd(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
