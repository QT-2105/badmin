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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Lịch sử trận đấu</div>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {selectedPlayer ? `Trận của ${selectedPlayer.name}` : 'Tất cả trận trong ca'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">Tra cứu trận đã kết thúc theo từng người chơi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPlayerId}
            onChange={(event) => onSelectedPlayerChange(event.target.value)}
            className="h-10 min-w-[220px] rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none"
          >
            <option value="">Tất cả người chơi</option>
            {[...players].sort((left, right) => left.name.localeCompare(right.name, 'vi')).map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" />
            Đóng
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          {error ? (
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div>
          ) : null}

          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải lịch sử trận đấu...</div>
          ) : null}

          {!isLoading && history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
              Chưa có trận đã kết thúc phù hợp với bộ lọc hiện tại.
            </div>
          ) : null}

          <section className="grid gap-3">
            {history.map((match) => (
              <article key={match.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{match.courtName}</div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      Kết thúc {formatDateTime(match.endedAt)} · {match.durationSeconds === null ? 'Không có thời lượng' : formatDuration(match.durationSeconds)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                    Sân {match.courtNumber}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                  <TeamBox label="Đội A" players={match.teamA.map((player) => player.playerName)} highlightPlayerId={selectedPlayerId} participants={match.teamA} />
                  <div className="grid place-items-center text-xs font-bold text-slate-500">VS</div>
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
    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {participants.map((player) => (
          <span
            key={player.playerId}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${
              highlightPlayerId && highlightPlayerId === player.playerId
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-white/[0.06] text-slate-100'
            }`}
          >
            {player.playerName}
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
