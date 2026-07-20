'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { PlayerAvatar } from '@/components/player/player-avatar';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
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
    <div className="fixed inset-0 z-[90] bg-overlay px-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={`player-quick-view-${player.id}`}>
      <div className="flex min-h-full items-center justify-center py-4">
        <Surface
          variant="elevated"
          padding="lg"
          className="max-h-[92vh] w-full max-w-md overflow-y-auto shadow-md"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <PlayerAvatar name={player.name} gender={player.gender} avatarUrl={player.avatarUrl} size="lg" className="h-24 w-24 text-2xl" />
              <div className="min-w-0">
                <h2 id={`player-quick-view-${player.id}`} className="break-words text-2xl font-semibold leading-tight text-foreground">{player.name}</h2>
                <p className="text-sm text-muted-foreground">{player.gender || 'Không rõ'} · {getLevelLabel(player.level ?? undefined)}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 shrink-0 px-0" aria-label="Đóng thông tin người chơi">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Trạng thái" value={statusLabel(player.status)} />
            <Info label="Số trận" value={`${player.matchesPlayed ?? 0}`} />
            <Info label="Phí" value={`${formatCurrency(payable)}đ`} />
            <Info label="Thanh toán" value={paymentLabel(player.paymentStatus, player.paymentMethod)} />
            {player.lastCourt ? <Info label="Sân gần nhất" value={player.lastCourt} /> : null}
          </div>

          {player.note ? (
            <Surface variant="subtle" padding="sm" className="mt-3">
              <div className="text-xs text-muted-foreground">Ghi chú</div>
              <div className="mt-1 text-sm text-foreground">{player.note}</div>
            </Surface>
          ) : null}
        </Surface>
      </div>
    </div>,
    document.body
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Surface variant="subtle" padding="sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium text-foreground">{value}</div>
    </Surface>
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
