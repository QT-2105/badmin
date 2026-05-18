'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaymentStatus = 'paid' | 'partial' | 'pending';
type QueueKey = 'waiting' | 'resting' | 'notArrived';
type CourtStatus = 'active' | 'ready' | 'waiting';
type ReviewFilter = 'all' | 'unpaid' | 'fatigue';

type Player = {
  id: string;
  name: string;
  gender: 'M' | 'F';
  skill: number;
  fatigue: number;
  tags: string[];
  payment: PaymentStatus;
  attendance: 'present' | 'late' | 'absent';
  recentPartner?: string;
};

type Court = {
  id: string;
  name: string;
  status: CourtStatus;
  score: {
    fairness: number;
    antiRepeat: number;
    fatigue: number;
  };
  slots: Array<string | null>;
};

const playersList: Player[] = [
  { id: 'p1', name: 'Alya', gender: 'F', skill: 5, fatigue: 2, tags: ['Mixed doubles'], payment: 'paid', attendance: 'present', recentPartner: 'Hadi' },
  { id: 'p2', name: 'Hadi', gender: 'M', skill: 5, fatigue: 3, tags: ['Aggressive'], payment: 'paid', attendance: 'present', recentPartner: 'Alya' },
  { id: 'p3', name: 'Nina', gender: 'F', skill: 4, fatigue: 2, tags: ['Defensive'], payment: 'partial', attendance: 'present', recentPartner: 'Rafi' },
  { id: 'p4', name: 'Rafi', gender: 'M', skill: 4, fatigue: 2, tags: ['Men doubles'], payment: 'paid', attendance: 'present', recentPartner: 'Nina' },
  { id: 'p5', name: 'Dewi', gender: 'F', skill: 3, fatigue: 1, tags: ['Beginner friendly'], payment: 'pending', attendance: 'present' },
  { id: 'p6', name: 'Bagas', gender: 'M', skill: 4, fatigue: 2, tags: ['Strong smasher'], payment: 'paid', attendance: 'present' },
  { id: 'p7', name: 'Mira', gender: 'F', skill: 4, fatigue: 1, tags: ['Mixed doubles'], payment: 'pending', attendance: 'present' },
  { id: 'p8', name: 'Dika', gender: 'M', skill: 3, fatigue: 1, tags: ['Defensive'], payment: 'paid', attendance: 'present' },
  { id: 'p9', name: 'Sinta', gender: 'F', skill: 3, fatigue: 4, tags: ['Senior player'], payment: 'paid', attendance: 'present' },
  { id: 'p10', name: 'Lukman', gender: 'M', skill: 4, fatigue: 4, tags: ['VIP'], payment: 'partial', attendance: 'present' },
  { id: 'p11', name: 'Tio', gender: 'M', skill: 4, fatigue: 3, tags: ['Aggressive'], payment: 'paid', attendance: 'present' },
  { id: 'p12', name: 'Arman', gender: 'M', skill: 3, fatigue: 3, tags: ['Men doubles'], payment: 'paid', attendance: 'present' },
  { id: 'p13', name: 'Ken', gender: 'M', skill: 4, fatigue: 1, tags: ['Wants Alya'], payment: 'pending', attendance: 'late' },
  { id: 'p14', name: 'Ayu', gender: 'F', skill: 3, fatigue: 1, tags: ['Mixed doubles'], payment: 'pending', attendance: 'late' },
  { id: 'p15', name: 'Bimo', gender: 'M', skill: 2, fatigue: 0, tags: ['Beginner friendly'], payment: 'paid', attendance: 'late' },
  { id: 'p16', name: 'Lia', gender: 'F', skill: 2, fatigue: 0, tags: ['Beginner friendly'], payment: 'paid', attendance: 'late' },
  { id: 'p17', name: 'Raka', gender: 'M', skill: 5, fatigue: 5, tags: ['VIP'], payment: 'paid', attendance: 'present' },
  { id: 'p18', name: 'Puri', gender: 'F', skill: 4, fatigue: 5, tags: ['Defensive'], payment: 'paid', attendance: 'present' },
  { id: 'p19', name: 'Gilang', gender: 'M', skill: 3, fatigue: 0, tags: ['Men doubles'], payment: 'pending', attendance: 'absent' }
];

const initialCourts: Court[] = [
  {
    id: 'c1',
    name: 'Court 1',
    status: 'active',
    score: { fairness: 92, antiRepeat: 88, fatigue: 85 },
    slots: ['p1', 'p2', 'p3', 'p4']
  },
  {
    id: 'c2',
    name: 'Court 2',
    status: 'ready',
    score: { fairness: 89, antiRepeat: 84, fatigue: 90 },
    slots: ['p5', 'p6', 'p7', 'p8']
  },
  {
    id: 'c3',
    name: 'Court 3',
    status: 'waiting',
    score: { fairness: 87, antiRepeat: 82, fatigue: 80 },
    slots: ['p9', 'p10', 'p11', 'p12']
  }
];

const initialQueues: Record<QueueKey, string[]> = {
  waiting: ['p13', 'p14', 'p15', 'p16'],
  resting: ['p17', 'p18'],
  notArrived: ['p19']
};

const playersById = Object.fromEntries(playersList.map((player) => [player.id, player])) as Record<string, Player>;

function removeFromQueues(queues: Record<QueueKey, string[]>, playerId: string): Record<QueueKey, string[]> {
  return {
    waiting: queues.waiting.filter((id) => id !== playerId),
    resting: queues.resting.filter((id) => id !== playerId),
    notArrived: queues.notArrived.filter((id) => id !== playerId)
  };
}

function removeFromCourts(courts: Court[], playerId: string): Court[] {
  return courts.map((court) => ({
    ...court,
    slots: court.slots.map((slot) => (slot === playerId ? null : slot))
  }));
}

function ratingLabel(value: number): string {
  if (value >= 90) {
    return 'Excellent';
  }

  if (value >= 80) {
    return 'Good';
  }

  return 'Risk';
}

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [queues, setQueues] = useState<Record<QueueKey, string[]>>(initialQueues);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  const allCourtPlayers = useMemo(() => {
    return courts.flatMap((court) => court.slots).filter((playerId): playerId is string => Boolean(playerId));
  }, [courts]);

  const checkedInCount = playersList.length - queues.notArrived.length;
  const unpaidPlayers = playersList.filter((player) => player.payment !== 'paid');
  const highFatiguePlayers = allCourtPlayers.map((id) => playersById[id]).filter((player) => player.fatigue >= 4);

  const reviewItems = useMemo(() => {
    const unpaid = unpaidPlayers.map((player) => ({
      id: `unpaid-${player.id}`,
      type: 'Finance',
      title: `${player.name} chưa hoàn tất phí`,
      detail: `Trạng thái thanh toán: ${player.payment}`,
      severity: 'high'
    }));

    const fatigue = highFatiguePlayers.map((player) => ({
      id: `fatigue-${player.id}`,
      type: 'Rotation',
      title: `${player.name} fatigue cao`,
      detail: 'Nên nghỉ 1 vòng để tránh quá tải',
      severity: 'medium'
    }));

    if (reviewFilter === 'unpaid') {
      return unpaid;
    }

    if (reviewFilter === 'fatigue') {
      return fatigue;
    }

    return [...unpaid, ...fatigue];
  }, [reviewFilter, unpaidPlayers, highFatiguePlayers]);

  const placeSelectedPlayer = (courtId: string, slotIndex: number) => {
    if (!selectedPlayerId) {
      return;
    }

    const nextQueues = removeFromQueues(queues, selectedPlayerId);
    const nextCourts = removeFromCourts(courts, selectedPlayerId).map((court) => {
      if (court.id !== courtId) {
        return court;
      }

      const nextSlots = [...court.slots];
      const replacedPlayer = nextSlots[slotIndex];
      nextSlots[slotIndex] = selectedPlayerId;

      if (replacedPlayer && replacedPlayer !== selectedPlayerId) {
        nextQueues.waiting.unshift(replacedPlayer);
      }

      return { ...court, slots: nextSlots };
    });

    setCourts(nextCourts);
    setQueues(nextQueues);
    setSelectedPlayerId(null);
  };

  const movePlayerToQueue = (playerId: string, targetQueue: QueueKey) => {
    const nextQueues = removeFromQueues(queues, playerId);
    nextQueues[targetQueue] = [playerId, ...nextQueues[targetQueue]];
    setCourts(removeFromCourts(courts, playerId));
    setQueues(nextQueues);

    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    }
  };

  const swapPairs = (courtId: string) => {
    setCourts((prev) =>
      prev.map((court) => {
        if (court.id !== courtId) {
          return court;
        }

        const [a, b, c, d] = court.slots;
        return { ...court, slots: [c, d, a, b] };
      })
    );
  };

  const rotateCourt = (courtId: string) => {
    setCourts((prev) =>
      prev.map((court) => {
        if (court.id !== courtId) {
          return court;
        }

        const [a, b, c, d] = court.slots;
        return { ...court, slots: [b, c, d, a] };
      })
    );
  };

  const suggestCourt = (courtId: string) => {
    const candidateIds = [...queues.waiting].sort((left, right) => playersById[left].fatigue - playersById[right].fatigue);
    if (candidateIds.length === 0) {
      return;
    }

    const nextCourts = courts.map((court) => {
      if (court.id !== courtId) {
        return court;
      }

      const nextSlots = [...court.slots];

      for (let index = 0; index < nextSlots.length; index += 1) {
        if (nextSlots[index] === null && candidateIds.length > 0) {
          nextSlots[index] = candidateIds.shift() ?? null;
        }
      }

      return { ...court, slots: nextSlots };
    });

    const usedIds = queues.waiting.filter((id) => !candidateIds.includes(id));
    const nextQueue = {
      ...queues,
      waiting: queues.waiting.filter((id) => !usedIds.includes(id))
    };

    setCourts(nextCourts);
    setQueues(nextQueue);
  };

  const checkInPlayer = (playerId: string) => {
    setQueues((prev) => {
      const next = removeFromQueues(prev, playerId);
      return { ...next, waiting: [...next.waiting, playerId] };
    });
  };

  const autoRotateRound = () => {
    const waitingPool = [...queues.waiting];
    const movedToRest: string[] = [];

    const nextCourts = courts.map((court) => {
      const nextSlots = [...court.slots];

      for (const index of [2, 3]) {
        if (nextSlots[index]) {
          movedToRest.push(nextSlots[index] as string);
          nextSlots[index] = waitingPool.shift() ?? null;
        }
      }

      return { ...court, slots: nextSlots, status: 'active' as const };
    });

    setCourts(nextCourts);
    setQueues({
      ...queues,
      waiting: waitingPool,
      resting: [...movedToRest, ...queues.resting]
    });
    setSelectedPlayerId(null);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-2 pb-28 pt-2 sm:px-4 sm:pb-32 sm:pt-3">
      <section className="z-20 rounded-3xl border border-white/10 bg-slate-950/85 p-2 shadow-soft backdrop-blur-xl sm:sticky sm:top-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            <p className="text-[8px] uppercase tracking-[0.22em] text-emerald-300/80 sm:text-[10px] sm:tracking-[0.28em]">Điều khiển vận hành</p>
            <h1 className="font-display mt-1 text-base font-semibold text-white sm:text-xl lg:text-2xl">Sắp xếp sân & review quản lý</h1>
            <p className="mt-1 text-[10px] leading-snug text-slate-400 sm:text-xs lg:text-sm">Ưu tiên thao tác 1 tay: chọn người chơi, chạm slot, xoay vòng ngay.</p>
          </div>
          <Badge variant="success" className="hidden shrink-0 self-start text-[10px] sm:inline-flex sm:text-xs">Realtime + Offline</Badge>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 xl:grid-cols-4">
          <Stat label="Tổng người" value={String(playersList.length)} tone="text-white" />
          <Stat label="Đã check-in" value={String(checkedInCount)} tone="text-emerald-300" />
          <Stat label="Đang chờ" value={String(queues.waiting.length)} tone="text-cyan-300" />
          <Stat label="Chưa thanh toán" value={String(unpaidPlayers.length)} tone="text-amber-300" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-2 xl:flex">
          <Button className="w-full sm:w-auto" onClick={autoRotateRound}>Xoay vòng tự động</Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setSelectedPlayerId(null)}>Bỏ chọn</Button>
          <Button variant="ghost" className="w-full sm:w-auto">Bắt đầu match</Button>
          <Button variant="ghost" className="w-full sm:w-auto">Thêm tài chính</Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3">
          <div className="rounded-3xl border border-white/10 bg-card/80 p-2.5 shadow-soft sm:p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <h2 className="font-display text-base font-semibold text-white sm:text-[15px]">Bảng sắp xếp sân (giao diện bảng)</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Bảng</Badge>
                <Badge variant="muted" className="hidden sm:inline-flex">Sân (visual)</Badge>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {courts.map((court, courtIndex) => (
                <motion.article
                  key={court.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: courtIndex * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-slate-900/65 p-2.5 sm:p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-white sm:text-base">{court.name}</h3>
                      <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Cân bằng {court.score.fairness} · Tránh lặp {court.score.antiRepeat} · Mệt mỏi {court.score.fatigue}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={court.status === 'active' ? 'success' : court.status === 'ready' ? 'warning' : 'muted'} className="text-[10px] sm:text-[11px]">
                        {court.status === 'active' ? 'ĐANG CHƠI' : court.status === 'ready' ? 'SẴN SÀNG' : 'CHỜ'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {court.slots.map((playerId, slotIndex) => {
                      const player = playerId ? playersById[playerId] : null;
                      const isSelected = selectedPlayerId !== null;

                      return (
                        <div
                          key={`${court.id}-${slotIndex}`}
                          onClick={() => placeSelectedPlayer(court.id, slotIndex)}
                          className={cn(
                            'rounded-xl border px-2.5 py-2 text-left transition-all sm:px-3',
                            player ? 'border-white/10 bg-white/5' : 'border-dashed border-white/15 bg-white/[0.03]',
                            isSelected && 'ring-2 ring-emerald-400/50'
                          )}
                        >
                          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">{slotIndex < 2 ? 'Cặp A' : 'Cặp B'}</p>
                          {player ? (
                            <>
                              <p className="mt-1 text-[13px] font-medium text-white sm:text-sm">{player.name}</p>
                              <p className="text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">Kỹ năng {player.skill} · Mệt mỏi {player.fatigue} · {player.payment === 'paid' ? 'Đã thanh toán' : player.payment === 'partial' ? 'Thanh toán một phần' : 'Chưa thanh toán'}</p>
                              <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                                {player.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="rounded-full bg-white/7 px-2 py-0.5 text-[10px] text-slate-300">{tag}</span>
                                ))}
                              </div>
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px]"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    movePlayerToQueue(player.id, 'resting');
                                  }}
                                >
                                  Nghỉ
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="mt-1 text-[12px] text-slate-500 sm:text-sm">Chạm để đặt người chơi</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => swapPairs(court.id)}>Hoán đổi cặp</Button>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => rotateCourt(court.id)}>Xoay</Button>
                    <Button size="sm" className="w-full" onClick={() => suggestCourt(court.id)}>Gợi ý</Button>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <QueuePanel
            title="Chờ"
            subtitle="Ưu tiên vào sân"
            players={queues.waiting}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            onPick={setSelectedPlayerId}
            onMove={(playerId) => movePlayerToQueue(playerId, 'resting')}
            moveLabel="Nghỉ"
          />

          <QueuePanel
            title="Nghỉ"
            subtitle="Vừa thi đấu"
            players={queues.resting}
            playersById={playersById}
            selectedPlayerId={selectedPlayerId}
            onPick={setSelectedPlayerId}
            onMove={(playerId) => movePlayerToQueue(playerId, 'waiting')}
            moveLabel="Vào hàng chờ"
          />

          <article className="rounded-3xl border border-white/10 bg-card/80 p-2.5 shadow-soft sm:p-3">
            <h3 className="font-display text-sm font-semibold text-white">Chưa đến</h3>
            <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">Check-in nhanh để đưa vào hàng chờ</p>
            <div className="mt-2 space-y-2">
              <AnimatePresence>
                {queues.notArrived.map((playerId) => {
                  const player = playersById[playerId];
                  return (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{player.name}</p>
                        <p className="text-[11px] text-slate-400">Kỹ năng {player.skill} · {player.tags[0]}</p>
                      </div>
                      <Button size="sm" variant="secondary" className="h-8 px-3 text-[11px]" onClick={() => checkInPlayer(player.id)}>
                        Check-in
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-card/80 p-2.5 shadow-soft sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-white">Review quản lý</h3>
              <Badge variant="warning">{reviewItems.length} cảnh báo</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterButton active={reviewFilter === 'all'} onClick={() => setReviewFilter('all')} label="Tất cả" />
              <FilterButton active={reviewFilter === 'unpaid'} onClick={() => setReviewFilter('unpaid')} label="Tài chính" />
              <FilterButton active={reviewFilter === 'fatigue'} onClick={() => setReviewFilter('fatigue')} label="Mệt mỏi" />
            </div>
            <div className="mt-2 space-y-2">
              {reviewItems.length === 0 && <p className="text-xs text-slate-500">Không có cảnh báo trong bộ lọc hiện tại.</p>}
              {reviewItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        item.severity === 'high' ? 'bg-rose-500/20 text-rose-200' : 'bg-amber-500/20 text-amber-200'
                      )}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <footer className="sticky bottom-0 z-20 mt-1 border-t border-white/10 bg-slate-950/90 px-2 py-2 backdrop-blur-xl lg:fixed lg:inset-x-0 lg:bottom-0 lg:px-3 lg:py-3">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-1.5 sm:gap-2">
          <Button className="h-12 px-2 text-[10px] leading-tight sm:h-11 sm:px-3 sm:text-xs sm:leading-normal">Ca chơi</Button>
          <Button variant="secondary" className="h-12 px-2 text-[10px] leading-tight sm:h-11 sm:px-3 sm:text-xs sm:leading-normal">Sân</Button>
          <Button variant="ghost" className="h-12 px-2 text-[10px] leading-tight sm:h-11 sm:px-3 sm:text-xs sm:leading-normal">Tài chính</Button>
        </div>
      </footer>
    </main>
  );
}

function QueuePanel({
  title,
  subtitle,
  players,
  playersById,
  selectedPlayerId,
  onPick,
  onMove,
  moveLabel
}: {
  title: string;
  subtitle: string;
  players: string[];
  playersById: Record<string, Player>;
  selectedPlayerId: string | null;
  onPick: (playerId: string | null) => void;
  onMove: (playerId: string) => void;
  moveLabel: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-card/80 p-2.5 shadow-soft sm:p-3">
      <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">{subtitle}</p>

      <div className="mt-2 space-y-2">
        <AnimatePresence>
          {players.map((playerId) => {
            const player = playersById[playerId];
            const selected = selectedPlayerId === player.id;

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn('rounded-xl border px-2.5 py-2 sm:px-3', selected ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-white/10 bg-white/5')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-white sm:text-sm">{player.name}</p>
                    <p className="text-[10px] text-slate-400 sm:text-[11px]">
                      KN{player.skill} · MM{player.fatigue} · {player.tags[0]} · {player.payment === 'paid' ? 'Đã TT' : player.payment === 'partial' ? 'TT 1 phần' : 'Chưa TT'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selected ? 'primary' : 'secondary'}
                      className="h-8 px-2 text-[11px]"
                      onClick={() => onPick(selected ? null : player.id)}
                    >
                      {selected ? 'Chọn' : 'Chọn'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] sm:text-[11px]" onClick={() => onMove(player.id)}>
                      {moveLabel}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </article>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-[11px]',
        active ? 'bg-emerald-400 text-slate-950' : 'bg-white/8 text-slate-300 hover:bg-white/12'
      )}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-inset ring-white/8 sm:p-3">
      <div className={`text-base font-semibold tracking-tight sm:text-lg ${tone}`}>{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">{label}</div>
    </div>
  );
}
