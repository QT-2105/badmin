'use client';

import { useState } from 'react';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { Player } from '@/lib/badminton-store';
import { getLevelLabel } from '@/lib/player-labels';

interface PlayerTeamProps {
  team: (Player | undefined)[];
  teamLabel: string;
}

export function PlayerTeam({ team, teamLabel }: PlayerTeamProps) {
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-semibold text-slate-400">{teamLabel}</div>
      <div className="space-y-0.5">
        {team.map((player, idx) => (
          <button
            type="button"
            key={idx}
            className="grid w-full grid-cols-[auto_1fr] items-start gap-1.5 rounded-md p-0.5 text-left transition-colors hover:bg-white/[0.04]"
            onClick={() => player && setQuickViewPlayer(toQuickViewPlayer(player))}
          >
            <PlayerAvatar name={player?.name ?? 'Người chơi'} gender={player?.gender} avatarUrl={player?.avatarUrl} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="overflow-hidden break-words text-[11px] font-medium leading-4 text-slate-200 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{player?.name}</p>
              <div className="flex flex-wrap items-center gap-1 text-[10px] leading-3 text-slate-400">
                <span>{getLevelLabel(player?.level)}</span>
                <span>{player?.gender === 'Nam' ? '♂' : '♀'}</span>
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
