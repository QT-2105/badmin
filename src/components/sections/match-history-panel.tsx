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
      <header className="flex shrink-0 flex-col gap-2 border-b border-white/10 bg-slate-950/95 px-3 py-2.5 shadow-[0_10px_30px_rgba(2,6,23,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.20em] text-cyan-200/80">Lịch sử trận đấu</div>
          <h2 id="runtime-match-history-title" className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2 text-lg font-bold text-white">
            <span className="truncate">{selectedPlayer ? `Trận của ${selectedPlayer.name}` : 'Tất cả trận trong ca'}</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
              {history.length} trận
            </span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={selectedPlayerId}
            onChange={(event) => onSelectedPlayerChange(event.target.value)}
            aria-label="Lọc lịch sử trận theo người chơi"
            className="h-9 min-w-[200px] rounded-lg border border-white/10 bg-slate-900 px-2.5 text-xs font-bold text-white outline-none transition-colors hover:border-cyan-300/25 focus:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300/70"
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
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-bold text-slate-200 transition-colors hover:border-cyan-300/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            <X className="h-3.5 w-3.5" />
            Đóng
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5">
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

          <section className="grid gap-2.5" role="list" aria-label="Danh sách trận đã kết thúc">
            {history.map((match) => (
              <article key={match.id} role="listitem" className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 shadow-sm shadow-slate-950/20 transition-colors hover:border-cyan-300/20">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="truncate text-sm font-bold text-white">{match.courtName}</div>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-1.5 py-0 text-[9px] font-bold text-emerald-100">
                        Đã kết thúc
                      </span>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-1.5 py-0 text-[9px] font-black uppercase tracking-[0.10em] text-cyan-100">
                        Sân {match.courtNumber}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-slate-400">
                      <span>Bắt đầu {match.startedAt ? formatDateTime(match.startedAt) : '—'}</span>
                      <span className="text-slate-600">·</span>
                      <span>Kết thúc {formatDateTime(match.endedAt)}</span>
                      <span className="text-slate-600">·</span>
                      <span>{match.durationSeconds === null ? 'Không có thời lượng' : formatDuration(match.durationSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid gap-1.5 md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] md:items-stretch">
                  <TeamBox label="Đội A" players={match.teamA.map((player) => player.playerName)} highlightPlayerId={selectedPlayerId} participants={match.teamA} />
                  <div className="grid place-items-center text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">VS</div>
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
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
        {participants.map((player) => (
          <span
            key={player.playerId}
            className={`min-w-0 rounded-md border px-2 py-1.5 text-xs font-bold ${
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
