'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { PlayerAvatar } from '@/components/player/player-avatar';
import { formatCurrency } from '@/lib/date-format';
import { getLevelLabel } from '@/lib/player-labels';

export type QuickViewPlayer = {
  id: string;
  name: string;
  gender?: string | null;
  level?: number | null;
  matchesPlayed?: number | null;
  status?: string | null;
  paymentAmount?: number | null;
  discount?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  note?: string | null;
  avatarUrl?: string | null;
  lastCourt?: string | null;
};

export function PlayerQuickView({
  player,
  onClose
}: {
  player: QuickViewPlayer | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!player) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, player]);

  if (!player || !mounted) return null;

  const payable = Math.max(0, Number(player.paymentAmount ?? 0) - Number(player.discount ?? 0));

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-slate-950/70 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center py-4">
        <div
          className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <PlayerAvatar name={player.name} gender={player.gender} avatarUrl={player.avatarUrl} size="lg" className="h-24 w-24 text-2xl" />
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-semibold leading-tight text-white">{player.name}</h2>
                <p className="text-sm text-slate-400">{player.gender || 'Không rõ'} · {getLevelLabel(player.level ?? undefined)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Trạng thái" value={statusLabel(player.status)} />
            <Info label="Số trận" value={`${player.matchesPlayed ?? 0}`} />
            <Info label="Phí" value={`${formatCurrency(payable)}đ`} />
            <Info label="Thanh toán" value={paymentLabel(player.paymentStatus, player.paymentMethod)} />
            {player.lastCourt ? <Info label="Sân gần nhất" value={player.lastCourt} /> : null}
          </div>

          {player.note ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs text-slate-500">Ghi chú</div>
              <div className="mt-1 text-sm text-slate-200">{player.note}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate font-medium text-slate-100">{value}</div>
    </div>
  );
}

function statusLabel(status?: string | null): string {
  if (status === 'PLAYING') return 'Đang chơi';
  if (status === 'JUST_FINISHED') return 'Vừa xong';
  if (status === 'PRIORITY') return 'Đã xếp';
  if (status === 'FINISHED') return 'Kết ca';
  if (status === 'RESTING') return 'Nghỉ';
  return 'Đang chờ';
}

function paymentLabel(status?: string | null, method?: string | null): string {
  if (status === 'PAID') return method === 'BANK' || method === 'CK' ? 'Đã thu CK' : 'Đã thu TM';
  if (status === 'WAIVED') return 'Free';
  return 'Chưa thu';
}
