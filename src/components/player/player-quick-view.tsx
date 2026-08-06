'use client';

import { PlayerAvatar } from '@/components/player/player-avatar';
import { Dialog } from '@/components/ui/dialog';
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
  if (!player) return null;

  const payable = Math.max(0, Number(player.paymentAmount ?? 0) - Number(player.discount ?? 0));

  return (
    <Dialog
      open={Boolean(player)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={player.name}
      description={`${player.gender || 'Không rõ'} · ${getLevelLabel(player.level ?? undefined)}`}
      closeLabel="Đóng thông tin người chơi"
      size="sm"
      contentClassName="space-y-4"
    >
      <div className="flex justify-center">
        <PlayerAvatar name={player.name} gender={player.gender} avatarUrl={player.avatarUrl} size="lg" className="h-24 w-24 text-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Trạng thái" value={statusLabel(player.status)} />
        <Info label="Số trận" value={`${player.matchesPlayed ?? 0}`} />
        <Info label="Phí" value={`${formatCurrency(payable)}đ`} />
        <Info label="Thanh toán" value={paymentLabel(player.paymentStatus, player.paymentMethod)} />
        {player.lastCourt ? <Info label="Sân gần nhất" value={player.lastCourt} /> : null}
      </div>

      {player.note ? (
        <Surface variant="subtle" padding="sm">
          <div className="text-xs text-muted-foreground">Ghi chú</div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{player.note}</div>
        </Surface>
      ) : null}
    </Dialog>
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
