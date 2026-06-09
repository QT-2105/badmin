'use client';

import { Player } from '@/lib/badminton-store';
import { cn } from '@/lib/utils';
import { getLevelLabel } from '@/lib/player-labels';

interface PlayerTeamProps {
  team: (Player | undefined)[];
  teamLabel: string;
}

export function PlayerTeam({ team, teamLabel }: PlayerTeamProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-semibold text-slate-400">{teamLabel}</div>
      <div className="space-y-0.5">
        {team.map((player, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-900',
                player?.gender === 'Nam' ? 'bg-cyan-400' : 'bg-pink-400'
              )}
            >
              {player
                ?.name.split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-200 truncate">{player?.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>{getLevelLabel(player?.level)}</span>
                <span>{player?.gender === 'Nam' ? '♂' : '♀'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
