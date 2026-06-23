'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, X } from 'lucide-react';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { useSessionPlayerMutations } from '@/hooks/use-session-players';
import { useBadmintonStore } from '@/lib/badminton-store';
import { cn } from '@/lib/utils';
import { LEVEL_OPTIONS } from '@/lib/player-labels';

export function PlayerDatabasePanel({
  onClose,
  showClose = true,
  showHeader = true,
  viewMode = 'expanded',
  className,
  headerAction,
  readonly = false,
  fullHeight = false
}: {
  onClose?: () => void;
  showClose?: boolean;
  showHeader?: boolean;
  viewMode?: 'compact' | 'expanded';
  className?: string;
  headerAction?: ReactNode;
  readonly?: boolean;
  fullHeight?: boolean;
}) {
  const { players, updatePlayer, updatePlayerPayment, runtimeSessionId } = useBadmintonStore();
  const { updatePlayer: persistPlayer } = useSessionPlayerMutations(runtimeSessionId || '');
  const isCompact = viewMode === 'compact';
  const [sortBy, setSortBy] = useState('FEMALE_FIRST');
  const [dirtyPlayerIds, setDirtyPlayerIds] = useState<Set<string>>(new Set());
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);

  const paymentMethodConfig = {
    UNPAID: { label: 'Chưa TT', color: 'text-rose-300', bg: 'bg-rose-500/10' },
    TM: { label: 'TM', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
    CK: { label: 'CK', color: 'text-cyan-300', bg: 'bg-cyan-500/10' }
  };

  const totals = useMemo(() => {
    const paidPlayers = players.filter((p) => p.paymentStatus === 'PAID');
    const paidTm = paidPlayers.filter((p) => p.paymentType === 'TM').reduce((sum, p) => sum + p.money, 0);
    const paidCk = paidPlayers.filter((p) => p.paymentType === 'CK').reduce((sum, p) => sum + p.money, 0);
    const unpaid = players.filter((p) => p.paymentStatus !== 'PAID').reduce((sum, p) => sum + p.money, 0);
    return {
      revenue: paidTm + paidCk,
      paidTm,
      paidCk,
      unpaid
    };
  }, [players]);

  const visiblePlayers = useMemo(() => {
    return [...players].sort((left, right) => {
      if (sortBy === 'FEMALE_FIRST' && left.gender !== right.gender) return left.gender === 'Nữ' ? -1 : 1;
      if (sortBy === 'MATCH_ASC' && left.matchesPlayed !== right.matchesPlayed) return left.matchesPlayed - right.matchesPlayed;
      if (sortBy === 'LEVEL_DESC' && left.level !== right.level) return right.level - left.level;
      return left.name.localeCompare(right.name, 'vi');
    });
  }, [players, sortBy]);

  const formatMoney = (value: number) => Math.round(value).toLocaleString('vi-VN');

  function markDirty(playerId: string) {
    setDirtyPlayerIds((current) => new Set(current).add(playerId));
  }

  async function saveChanges() {
    const dirtyPlayers = players.filter((player) => dirtyPlayerIds.has(player.id));
    await Promise.all(
      dirtyPlayers.map((player) =>
        persistPlayer.mutateAsync({
          id: player.id,
          payload: {
            fullName: player.name,
            gender: player.gender,
            level: player.level,
            paymentAmount: player.money,
            discount: player.discount,
            paymentMethod: player.paymentType === 'CK' ? 'BANK' : 'CASH',
            paymentStatus: player.paymentStatus,
            note: player.note
          }
        })
      )
    );
    setDirtyPlayerIds(new Set());
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('px-4 py-3 overflow-hidden flex flex-col min-h-0', className)}
    >
      {/* HEADER */}
      {showHeader ? (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100">DANH SÁCH NGƯỜI CHƠI</h3>
          <div className="flex items-center gap-2">
            {!isCompact ? (
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-slate-200 outline-none">
                <option value="FEMALE_FIRST">Nữ trước</option>
                <option value="NAME">Tên A-Z</option>
                <option value="MATCH_ASC">Ít trận trước</option>
                <option value="LEVEL_DESC">Trình độ cao</option>
              </select>
            ) : null}
            {readonly ? (
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-400">Chỉ xem</span>
            ) : dirtyPlayerIds.size > 0 && runtimeSessionId ? (
              <button
                type="button"
                onClick={() => void saveChanges()}
                disabled={persistPlayer.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-xs font-semibold text-slate-950 disabled:opacity-50"
              >
                {persistPlayer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Lưu thay đổi ({dirtyPlayerIds.size})
              </button>
            ) : null}
            {headerAction}
            {showClose && onClose ? (
              <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </motion.button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TABLE */}
      {!isCompact ? (
        <div className="rounded-lg overflow-hidden border border-slate-700/30 flex-1 min-h-0">
          <div className="h-full overflow-x-auto">
            <div className={cn(fullHeight ? 'h-full overflow-y-auto' : 'max-h-[min(38vh,340px)] overflow-y-auto')}>
              <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/30">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Người chơi</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">GT</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Trình độ</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Trận</th>
                  <th className="px-3 py-2 text-right text-slate-300 font-semibold">Tiền</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Giảm</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Thanh toán</th>
                  <th className="px-3 py-2 text-left text-slate-300 font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {visiblePlayers.map((player) => {
                  const paymentValue = player.paymentStatus === 'PAID' ? player.paymentType : 'UNPAID';
                  const paymentTone = paymentMethodConfig[paymentValue as keyof typeof paymentMethodConfig];

                  return (
                    <motion.tr
                      key={player.id}
                      className="cursor-pointer transition-colors hover:bg-slate-700/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setQuickViewPlayer(toRuntimeQuickViewPlayer(player))}
                    >
                      <td className="px-3 py-2 text-slate-200 font-medium">
                        <div className="flex min-w-[180px] items-center gap-2">
                          <PlayerAvatar name={player.name} gender={player.gender} avatarUrl={player.avatarUrl} size="sm" />
                          <input
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none disabled:text-slate-500"
                            value={player.name}
                            disabled={readonly}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(e) => {
                              if (readonly) return;
                              updatePlayer(player.id, { name: e.target.value });
                              markDirty(player.id);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-400" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={player.gender}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { gender: (e.target.value as 'Nam' | 'Nữ') });
                            markDirty(player.id);
                          }}
                          className="bg-transparent text-slate-200 outline-none text-sm disabled:text-slate-500"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-cyan-300 font-semibold" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={player.level}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { level: Number(e.target.value) });
                            markDirty(player.id);
                          }}
                          className="bg-transparent text-cyan-300 outline-none text-sm disabled:text-slate-500"
                        >
                          {LEVEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{player.matchesPlayed}</td>
                      <td className="px-3 py-2 text-right text-slate-300 font-mono" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="number"
                          value={Math.round(player.money)}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { money: Number(e.target.value) });
                            markDirty(player.id);
                          }}
                          className="w-24 bg-transparent text-slate-200 outline-none text-sm text-right disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-amber-300" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="number"
                          value={player.discount}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { discount: Number(e.target.value) });
                            markDirty(player.id);
                          }}
                          className="w-14 bg-transparent text-amber-300 outline-none text-sm disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={paymentValue}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            const value = e.target.value as 'UNPAID' | 'TM' | 'CK';
                            if (value === 'UNPAID') {
                              updatePlayerPayment(player.id, { paymentStatus: 'UNPAID' });
                              markDirty(player.id);
                              return;
                            }
                            updatePlayerPayment(player.id, { paymentStatus: 'PAID', paymentType: value });
                            markDirty(player.id);
                          }}
                          className={cn(
                            'bg-transparent text-slate-200 outline-none text-sm rounded px-2 py-1',
                            paymentTone.bg,
                            paymentTone.color
                          )}
                        >
                          <option value="UNPAID">Chưa TT</option>
                          <option value="TM">TM</option>
                          <option value="CK">CK</option>
                        </select>
                      </td>
                      <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <input
                          value={player.note}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { note: e.target.value });
                            markDirty(player.id);
                          }}
                          className="w-full bg-transparent text-slate-200 outline-none text-sm disabled:text-slate-500"
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* STATS FOOTER */}
      {!isCompact ? (
        <div className="mt-3 grid grid-cols-5 gap-2 text-xs shrink-0">
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-400">Đang xem</div>
            <div className="font-bold text-cyan-300">{visiblePlayers.length}/{players.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-400">Doanh thu</div>
            <div className="font-bold text-emerald-300">{formatMoney(totals.revenue)}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-400">Thanh toán TM</div>
            <div className="font-bold text-emerald-300">{formatMoney(totals.paidTm)}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-400">Thanh toán CK</div>
            <div className="font-bold text-cyan-300">{formatMoney(totals.paidCk)}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-400">Chưa TT</div>
            <div className="font-bold text-rose-300">{formatMoney(totals.unpaid)}</div>
          </div>
        </div>
      ) : null}
      <PlayerQuickView player={quickViewPlayer} onClose={() => setQuickViewPlayer(null)} />
    </motion.div>
  );
}

function toRuntimeQuickViewPlayer(player: ReturnType<typeof useBadmintonStore.getState>['players'][number]): QuickViewPlayer {
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
