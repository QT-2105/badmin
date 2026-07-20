'use client';

import { X } from 'lucide-react';

import { useMatchHistory } from '@/hooks/use-match-history';
import type { Player } from '@/lib/badminton-store';
import { formatDuration } from '@/lib/date-format';

export function MatchHistoryPanel({
  sessionId,
  players,
  selectedPlayerId,
  onSelectedPlayerChange,
  onClose
}: {
  sessionId: string;
  players: Player[];
  selectedPlayerId: string;
  onSelectedPlayerChange: (playerId: string) => void;
  onClose: () => void;
}) {
  const { data: history = [], isLoading, error } = useMatchHistory(sessionId, selectedPlayerId || null);
  const selectedPlayer = selectedPlayerId ? players.find((player) => player.id === selectedPlayerId) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100" role="dialog" aria-modal="true" aria-labelledby="runtime-match-history-title">
      <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 shadow-[0_10px_30px_rgba(2,6,23,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/80">Lịch sử trận đấu</div>
          <h2 id="runtime-match-history-title" className="mt-1 truncate text-xl font-bold text-white">
            {selectedPlayer ? `Trận của ${selectedPlayer.name}` : 'Tất cả trận trong ca'}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>Tra cứu trận đã kết thúc theo từng người chơi.</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-bold text-cyan-100">
              {history.length} trận
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPlayerId}
            onChange={(event) => onSelectedPlayerChange(event.target.value)}
            aria-label="Lọc lịch sử trận theo người chơi"
            className="h-11 min-w-[220px] rounded-xl border border-white/10 bg-slate-900 px-3 text-sm font-medium text-white outline-none transition-colors hover:border-cyan-300/25 focus:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <option value="">Tất cả người chơi</option>
            {[...players].sort((left, right) => left.name.localeCompare(right.name, 'vi')).map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng lịch sử trận đấu"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-slate-200 transition-colors hover:border-cyan-300/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <X className="h-4 w-4" />
            Đóng
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          {error ? (
            <div className="rounded-xl border border-rose-300/25 bg-rose-400/[0.12] p-4 text-sm font-medium text-rose-100">{error.message}</div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr]">
                    <div className="h-20 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
                    <div className="hidden w-8 md:block" />
                    <div className="h-20 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.035] p-6 text-center text-sm font-medium text-slate-400">
              Chưa có trận đã kết thúc phù hợp với bộ lọc hiện tại.
            </div>
          ) : null}

          <section className="grid gap-3" role="list" aria-label="Danh sách trận đã kết thúc">
            {history.map((match) => (
              <article key={match.id} role="listitem" className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-sm shadow-slate-950/20 transition-colors hover:border-cyan-300/20">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-base font-bold text-white">{match.courtName}</div>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                        Đã kết thúc
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-slate-400">
                      <span>Bắt đầu {match.startedAt ? formatDateTime(match.startedAt) : '—'}</span>
                      <span className="text-slate-600">·</span>
                      <span>Kết thúc {formatDateTime(match.endedAt)}</span>
                      <span className="text-slate-600">·</span>
                      <span>{match.durationSeconds === null ? 'Không có thời lượng' : formatDuration(match.durationSeconds)}</span>
                    </div>
                  </div>
                  <div className="inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-cyan-100">
                    Sân {match.courtNumber}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] md:items-stretch">
                  <TeamBox label="Đội A" players={match.teamA.map((player) => player.playerName)} highlightPlayerId={selectedPlayerId} participants={match.teamA} />
                  <div className="grid place-items-center text-xs font-black uppercase tracking-[0.12em] text-slate-500">VS</div>
                  <TeamBox label="Đội B" players={match.teamB.map((player) => player.playerName)} highlightPlayerId={selectedPlayerId} participants={match.teamB} />
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

function TeamBox({
  label,
  participants,
  highlightPlayerId
}: {
  label: string;
  players: string[];
  participants: Array<{ playerId: string; playerName: string }>;
  highlightPlayerId: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {participants.map((player) => (
          <span
            key={player.playerId}
            className={`min-w-0 rounded-lg border px-2.5 py-2 text-sm font-bold ${
              highlightPlayerId && highlightPlayerId === player.playerId
                ? 'border-cyan-200/40 bg-cyan-400 text-slate-950'
                : 'border-white/[0.06] bg-white/[0.06] text-slate-100'
            }`}
            title={player.playerName}
          >
            <span className="block truncate">{player.playerName}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
}
