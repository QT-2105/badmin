'use client';

import { useState } from 'react';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { Player } from '@/lib/badminton-store';
import { getDisplayPlayerName } from '@/lib/player-display';
import { getLevelLabel } from '@/lib/player-labels';

interface PlayerTeamProps {
  team: (Player | undefined)[];
}

export function PlayerTeam({ team }: PlayerTeamProps) {
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);
  const teamSlots = [team[0], team[1]];

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-rows-2">
        {teamSlots.map((player, idx) => (
          <button
            type="button"
            key={idx}
            className="grid min-h-0 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 border border-transparent px-1 py-1 text-left transition-colors first:rounded-t-lg last:rounded-b-lg last:border-t-white/20 hover:border-cyan-300/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            onClick={() => player && setQuickViewPlayer(toQuickViewPlayer(player))}
            aria-label={player ? `Xem nhanh ${player.name}` : 'Vị trí người chơi trống'}
          >
            <PlayerAvatar name={player?.name ?? 'Người chơi'} gender={player?.gender} avatarUrl={player?.avatarUrl} size="xs" />
            <div className="min-w-0">
              <p className="line-clamp-2 break-words text-xs font-semibold leading-[1.2] text-slate-50" title={player?.name}>{getDisplayPlayerName(player?.name)}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-medium leading-3 text-slate-300/90">
                <span className="text-slate-300">{getLevelLabel(player?.level)}</span>
                {player?.gender ? (
                  <span className={player.gender === 'Nam' ? 'text-cyan-200' : player.gender === 'Nữ' ? 'text-pink-200' : 'text-slate-300'}>
                    {player.gender}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
      <PlayerQuickView player={quickViewPlayer} onClose={() => setQuickViewPlayer(null)} />
    </div>
  );
}

function toQuickViewPlayer(player: Player): QuickViewPlayer {
  return {
    id: player.id,
    name: player.name,
    gender: player.gender,
    level: player.level,
    matchesPlayed: player.matchesPlayed,
    status: player.status,
    paymentAmount: player.money,
    discount: player.discount,
    paymentStatus: player.paymentStatus,
    paymentMethod: player.paymentType,
    note: player.note,
    avatarUrl: player.avatarUrl,
    lastCourt: player.lastCourt
  };
}
