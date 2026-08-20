'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { PlayerFeeInput } from '@/components/player/player-fee-input';
import { PlayerAvatar } from '@/components/player/player-avatar';
import { PlayerQuickView, type QuickViewPlayer } from '@/components/player/player-quick-view';
import { useSessionPlayerMutations } from '@/hooks/use-session-players';
import { useSessionCoupleMutations } from '@/hooks/use-session-couples';
import { useBadmintonStore } from '@/lib/badminton-store';
import { PLAYER_TAG_OPTIONS, normalizePlayerTags, togglePlayerTag } from '@/lib/player-tags';
import { cn } from '@/lib/utils';
import { LEVEL_OPTIONS } from '@/lib/player-labels';
import type { SessionCoupleSummary } from '@/types/domain';

export function PlayerDatabasePanel({
  onClose,
  showClose = true,
  showHeader = true,
  viewMode = 'expanded',
  className,
  headerAction,
  readonly = false,
  fullHeight = false,
  onCommitRuntime
}: {
  onClose?: () => void;
  showClose?: boolean;
  showHeader?: boolean;
  viewMode?: 'compact' | 'expanded';
  className?: string;
  headerAction?: ReactNode;
  readonly?: boolean;
  fullHeight?: boolean;
  onCommitRuntime?: () => Promise<boolean>;
}) {
  const players = useBadmintonStore((state) => state.players);
  const updatePlayer = useBadmintonStore((state) => state.updatePlayer);
  const updatePlayerPayment = useBadmintonStore((state) => state.updatePlayerPayment);
  const runtimeSessionId = useBadmintonStore((state) => state.runtimeSessionId);
  const { updatePlayer: persistPlayer } = useSessionPlayerMutations(runtimeSessionId || '', { invalidateRuntime: false });
  const coupleMutations = useSessionCoupleMutations(runtimeSessionId || '', { invalidateRuntime: false });
  const isCompact = viewMode === 'compact';
  const [sortBy, setSortBy] = useState('FEMALE_FIRST');
  const [dirtyPlayerIds, setDirtyPlayerIds] = useState<Set<string>>(new Set());
  const [quickViewPlayer, setQuickViewPlayer] = useState<QuickViewPlayer | null>(null);
  const [coupleMemberA, setCoupleMemberA] = useState('');
  const [coupleMemberB, setCoupleMemberB] = useState('');
  const [coupleMode, setCoupleMode] = useState<'MEN' | 'WOMEN' | 'MIXED'>('MIXED');
  const [coupleError, setCoupleError] = useState<string | null>(null);
  const [coupleEditorOpen, setCoupleEditorOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const paymentMethodConfig = {
    UNPAID: { label: 'Chưa TT', color: 'text-amber-200', bg: 'bg-amber-500/10' },
    CASH: { label: 'Tiền mặt', color: 'text-emerald-200', bg: 'bg-emerald-500/10' },
    BANK: { label: 'Chuyển khoản', color: 'text-cyan-200', bg: 'bg-cyan-500/10' },
    WAIVED: { label: 'Free', color: 'text-violet-200', bg: 'bg-violet-500/10' }
  };

  const totals = useMemo(() => {
    const paidPlayers = players.filter((p) => p.paymentStatus === 'PAID');
    const paidTm = paidPlayers.filter((p) => p.paymentType === 'TM').reduce((sum, p) => sum + p.money, 0);
    const paidCk = paidPlayers.filter((p) => p.paymentType === 'CK').reduce((sum, p) => sum + p.money, 0);
    const unpaid = players.filter((p) => p.paymentStatus !== 'PAID' && p.paymentStatus !== 'WAIVED').reduce((sum, p) => sum + p.money, 0);
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

  const couples = useMemo<SessionCoupleSummary[]>(() => {
    const groups = new Map<string, typeof players>();
    for (const player of players) {
      if (player.coupleNumber === null || player.coupleMatchMode === null) continue;
      const key = `${player.coupleNumber}:${player.coupleMatchMode}`;
      groups.set(key, [...(groups.get(key) ?? []), player]);
    }
    return [...groups.entries()].flatMap(([key, members]) => {
      if (members.length !== 2) return [];
      const [numberValue, matchMode] = key.split(':') as [string, SessionCoupleSummary['matchMode']];
      const displayNumber = Number(numberValue);
      return [{
        id: `${runtimeSessionId}:${displayNumber}`,
        sessionId: runtimeSessionId || '',
        displayNumber,
        matchMode,
        active: true,
        nextMatchRequestedAt: members[0].nextMatchRequestedAt !== null && members[0].nextMatchRequestedAt === members[1].nextMatchRequestedAt
          ? new Date(members[0].nextMatchRequestedAt).toISOString()
          : null,
        members: members.map((player) => ({ playerId: player.id, fullName: player.name, gender: player.gender, level: player.level })) as SessionCoupleSummary['members'],
        createdAt: null,
        updatedAt: null
      }];
    }).sort((left, right) => left.displayNumber - right.displayNumber);
  }, [players, runtimeSessionId]);

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
            paymentMethod: player.paymentStatus === 'PAID' ? player.paymentType === 'CK' ? 'BANK' : 'CASH' : null,
            paymentStatus: player.paymentStatus,
            note: player.note,
            playerTags: player.playerTags
          }
        })
      )
    );
    const committed = (await onCommitRuntime?.()) ?? true;
    if (!committed) {
      setSaveError('Đã lưu thông tin người chơi nhưng chưa đồng bộ được hàng gợi ý. Vui lòng thử lại.');
      return;
    }
    setSaveError(null);
    setDirtyPlayerIds(new Set());
  }

  async function addCouple() {
    if (!runtimeSessionId || !coupleMemberA || !coupleMemberB || coupleMemberA === coupleMemberB) {
      setCoupleError('Chọn đúng hai người chơi khác nhau.');
      return;
    }
    try {
      const couple = await coupleMutations.createCouple.mutateAsync({ memberIds: [coupleMemberA, coupleMemberB], matchMode: coupleMode });
      const coupleMemberIds = new Set(couple.members.map((member) => member.playerId));
      useBadmintonStore.setState((state) => ({
        players: state.players.map((player) => coupleMemberIds.has(player.id)
          ? { ...player, coupleNumber: couple.displayNumber, coupleMatchMode: couple.matchMode }
          : player),
        nextMatches: state.nextMatches.map((match) => match.locked && match.roster.some((playerId) => coupleMemberIds.has(playerId))
          ? { ...match, validity: 'STALE' as const, warningCodes: [...new Set([...(match.warningCodes ?? []), 'COUPLE_CHANGED'])] }
          : match)
      }));
      useBadmintonStore.getState().refreshNextMatches();
      await onCommitRuntime?.();
      setCoupleMemberA('');
      setCoupleMemberB('');
      setCoupleError(null);
    } catch (error) {
      setCoupleError(error instanceof Error ? error.message : 'Không thể tạo Couple.');
    }
  }

  async function removeCouple(coupleId: string, displayNumber: number) {
    try {
      await coupleMutations.deleteCouple.mutateAsync(coupleId);
      useBadmintonStore.setState((state) => ({
        players: state.players.map((player) => player.coupleNumber === displayNumber
          ? { ...player, coupleNumber: null, coupleMatchMode: null }
          : player)
      }));
      useBadmintonStore.getState().refreshNextMatches();
      await onCommitRuntime?.();
      setCoupleError(null);
    } catch (error) {
      setCoupleError(error instanceof Error ? error.message : 'Không thể gỡ Couple.');
    }
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
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sắp xếp danh sách người chơi" className="h-9 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
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
                aria-label={`Lưu ${dirtyPlayerIds.size} thay đổi người chơi`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-xs font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-50"
              >
                {persistPlayer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Lưu thay đổi ({dirtyPlayerIds.size})
              </button>
            ) : null}
            {headerAction}
            {showClose && onClose ? (
              <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.1 }} aria-label="Đóng danh sách người chơi" className="text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                <X className="w-4 h-4" />
              </motion.button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isCompact && runtimeSessionId ? (
        <section className="mb-2 rounded-lg border border-white/10 bg-white/[0.025]" aria-label="Thiết lập Couple">
          <button
            type="button"
            onClick={() => setCoupleEditorOpen((open) => !open)}
            aria-expanded={coupleEditorOpen}
            className="flex h-9 w-full items-center justify-between gap-2 px-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70"
          >
            <span className="min-w-0 truncate text-[11px] font-semibold text-slate-300">
              Couple hỗ trợ xếp cặp <span className="font-medium text-slate-500">({couples.length})</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-500">
              Thiết lập {coupleEditorOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </button>
          {coupleEditorOpen ? (
            <div className="border-t border-white/10 p-2">
              <div className="mb-2 text-[10px] font-medium text-slate-500">Partner chỉ được giữ cùng nhau trong nội dung đã chọn; các nội dung khác vẫn xếp bình thường.</div>
              <div className="flex flex-wrap items-end gap-1.5">
                <select value={coupleMemberA} onChange={(event) => setCoupleMemberA(event.target.value)} disabled={readonly} aria-label="Người chơi Couple thứ nhất" className="h-8 min-w-[140px] flex-1 rounded-md border border-white/10 bg-slate-950 px-2 text-[11px] text-slate-200">
                  <option value="">Người thứ nhất</option>
                  {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <select value={coupleMemberB} onChange={(event) => setCoupleMemberB(event.target.value)} disabled={readonly} aria-label="Người chơi Couple thứ hai" className="h-8 min-w-[140px] flex-1 rounded-md border border-white/10 bg-slate-950 px-2 text-[11px] text-slate-200">
                  <option value="">Người thứ hai</option>
                  {players.filter((player) => player.id !== coupleMemberA).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
                </select>
                <select value={coupleMode} onChange={(event) => setCoupleMode(event.target.value as typeof coupleMode)} disabled={readonly} aria-label="Nội dung Couple" className="h-8 rounded-md border border-white/10 bg-slate-950 px-2 text-[11px] text-slate-200">
                  <option value="MIXED">Nam nữ</option>
                  <option value="MEN">Đôi nam</option>
                  <option value="WOMEN">Đôi nữ</option>
                </select>
                {!readonly ? (
                  <button type="button" onClick={() => void addCouple()} disabled={coupleMutations.createCouple.isPending} className="inline-flex h-8 items-center gap-1 rounded-md bg-violet-300 px-2.5 text-[11px] font-bold text-slate-950 disabled:opacity-50">
                    {coupleMutations.createCouple.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Thêm
                  </button>
                ) : null}
              </div>
              {couples.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {couples.map((couple) => (
                    <span key={couple.id} className="inline-flex items-center gap-1 rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                      Couple_{couple.displayNumber}: {couple.members[0].fullName} + {couple.members[1].fullName} · {couple.matchMode === 'MIXED' ? 'Nam nữ' : couple.matchMode === 'MEN' ? 'Đôi nam' : 'Đôi nữ'}
                      {!readonly ? <button type="button" onClick={() => void removeCouple(couple.id, couple.displayNumber)} aria-label={`Gỡ Couple_${couple.displayNumber}`} className="ml-1 text-rose-200 hover:text-rose-100"><Trash2 className="h-3 w-3" /></button> : null}
                    </span>
                  ))}
                </div>
              ) : null}
              {coupleError ? <div role="alert" className="mt-1.5 text-[10px] font-medium text-rose-200">{coupleError}</div> : null}
            </div>
          ) : null}
        </section>
      ) : null}
      {saveError ? <div role="alert" className="mb-2 rounded-lg border border-rose-300/20 bg-rose-400/10 px-2.5 py-2 text-[11px] font-medium text-rose-100">{saveError}</div> : null}

      {/* TABLE */}
      {!isCompact ? (
        <div className="rounded-lg overflow-hidden border border-slate-700/30 flex-1 min-h-0">
          <div className="h-full overflow-x-auto">
            <div className={cn(fullHeight ? 'h-full overflow-y-auto' : 'max-h-[min(38vh,340px)] overflow-y-auto')}>
              <table className="w-full table-auto text-[11px]">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700/30">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Người chơi</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">GT</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Trình độ</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Trận</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-slate-300">Tiền</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Giảm</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Thanh toán</th>
                  <th className="w-28 max-w-28 px-2 py-1.5 text-left font-semibold text-slate-300">Ghi chú</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-300">Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {visiblePlayers.map((player) => {
                  const paymentValue = getPaymentSelectValue(player);
                  const paymentTone = paymentMethodConfig[paymentValue as keyof typeof paymentMethodConfig];
                  const normalizedTags = normalizePlayerTags(player.playerTags);
                  const hasEndedGame = normalizedTags.includes('END_GAME');

                  return (
                    <motion.tr
                      key={player.id}
                      className="cursor-pointer transition-colors hover:bg-slate-700/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setQuickViewPlayer(toRuntimeQuickViewPlayer(player))}
                    >
                      <td className="px-2 py-1.5 font-medium text-slate-200">
                        <div className="flex min-w-[160px] items-center gap-1.5">
                          <PlayerAvatar name={player.name} gender={player.gender} avatarUrl={player.avatarUrl} size="xs" />
                          <textarea
                            rows={2}
                            className="min-w-0 flex-1 resize-none bg-transparent text-[11px] leading-4 text-slate-200 outline-none disabled:text-slate-500"
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
                      <td className="px-2 py-1.5 text-slate-400" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={player.gender}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { gender: (e.target.value as 'Nam' | 'Nữ') });
                            markDirty(player.id);
                          }}
                          className="bg-transparent text-[11px] text-slate-200 outline-none disabled:text-slate-500"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5 font-semibold text-cyan-300" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={player.level}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { level: Number(e.target.value) });
                            markDirty(player.id);
                          }}
                          className="bg-transparent text-[11px] text-cyan-300 outline-none disabled:text-slate-500"
                        >
                          {LEVEL_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-slate-300">{player.matchesPlayed}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-300" onClick={(event) => event.stopPropagation()}>
                        <PlayerFeeInput
                          value={Math.round(player.money)}
                          disabled={readonly}
                          className="w-24"
                          onChange={(value) => {
                            if (readonly) return;
                            updatePlayer(player.id, { money: Number(value || 0) });
                            markDirty(player.id);
                          }}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-amber-300" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="number"
                          value={player.discount}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            updatePlayer(player.id, { discount: Number(e.target.value) });
                            markDirty(player.id);
                          }}
                          className="w-12 bg-transparent text-[11px] text-amber-300 outline-none disabled:text-slate-500"
                        />
                      </td>
                      <td className="px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={paymentValue}
                          disabled={readonly}
                          onChange={(e) => {
                            if (readonly) return;
                            const value = e.target.value as 'UNPAID' | 'CASH' | 'BANK' | 'WAIVED';
                            if (value === 'UNPAID') {
                              updatePlayerPayment(player.id, { paymentStatus: 'UNPAID' });
                              markDirty(player.id);
                              return;
                            }
                            if (value === 'WAIVED') {
                              updatePlayerPayment(player.id, { paymentStatus: 'WAIVED' });
                              markDirty(player.id);
                              return;
                            }
                            updatePlayerPayment(player.id, { paymentStatus: 'PAID', paymentType: value === 'BANK' ? 'CK' : 'TM' });
                            markDirty(player.id);
                          }}
                          className={cn(
                            'rounded bg-transparent px-1.5 py-1 text-[11px] text-slate-200 outline-none',
                            paymentTone.bg,
                            paymentTone.color
                          )}
                        >
                          <option value="UNPAID">Chưa TT</option>
                          <option value="CASH">Tiền mặt</option>
                          <option value="BANK">Chuyển khoản</option>
                          <option value="WAIVED">Free</option>
                        </select>
                      </td>
                      <td className="w-28 max-w-28 px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
                        <div className="flex w-28 max-w-28 items-center gap-1">
                          <input
                            value={player.note}
                            disabled={readonly}
                            onChange={(e) => {
                              if (readonly) return;
                              updatePlayer(player.id, { note: e.target.value });
                              markDirty(player.id);
                            }}
                            title={player.note || 'Chưa có ghi chú'}
                            className="min-w-0 flex-1 truncate bg-transparent text-[11px] text-slate-200 outline-none disabled:text-slate-500"
                          />
                          <button
                            type="button"
                            onClick={() => setQuickViewPlayer(toRuntimeQuickViewPlayer(player))}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 transition hover:bg-white/[0.06] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                            aria-label={`Xem đầy đủ ghi chú của ${player.name}`}
                            title="Xem chi tiết người chơi"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
                        <div className="grid min-w-[160px] grid-cols-2 gap-0.5">
                          {PLAYER_TAG_OPTIONS.map((tag) => {
                            const active = normalizedTags.includes(tag.value);
                            const disabledByEndGame = tag.value === 'PRIORITY' && hasEndedGame;
                            return (
                              <button
                                key={tag.value}
                                type="button"
                                disabled={readonly || disabledByEndGame}
                                title={disabledByEndGame ? 'Tắt End-Game trước khi yêu cầu Trận kế.' : undefined}
                                onClick={() => {
                                  if (readonly || disabledByEndGame) return;
                                  updatePlayer(player.id, { playerTags: togglePlayerTag(player.playerTags, tag.value) });
                                  markDirty(player.id);
                                }}
                                className={cn(
                                  'rounded-md border px-1 py-0 text-[9px] font-semibold leading-4 transition disabled:cursor-not-allowed disabled:opacity-50',
                                  active ? tag.activeClassName : tag.className
                                )}
                              >
                                {tag.label}
                              </button>
                            );
                          })}
                        </div>
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
        <div className="mt-2 grid shrink-0 grid-cols-5 gap-1.5 text-[11px]">
          <div className="rounded border border-cyan-300/20 bg-cyan-400/[0.08] p-1.5">
            <div className="text-slate-400">Đang xem</div>
            <div className="font-bold text-cyan-300">{visiblePlayers.length}/{players.length}</div>
          </div>
          <div className="rounded border border-emerald-300/20 bg-emerald-400/[0.08] p-1.5">
            <div className="text-slate-400">Doanh thu</div>
            <div className="font-bold text-emerald-300">{formatMoney(totals.revenue)}</div>
          </div>
          <div className="rounded border border-emerald-300/20 bg-emerald-400/[0.08] p-1.5">
            <div className="text-slate-400">Tiền mặt</div>
            <div className="font-bold text-emerald-300">{formatMoney(totals.paidTm)}</div>
          </div>
          <div className="rounded border border-cyan-300/20 bg-cyan-400/[0.08] p-1.5">
            <div className="text-slate-400">Chuyển khoản</div>
            <div className="font-bold text-cyan-300">{formatMoney(totals.paidCk)}</div>
          </div>
          <div className="rounded border border-rose-300/20 bg-rose-400/[0.08] p-1.5">
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

function getPaymentSelectValue(player: ReturnType<typeof useBadmintonStore.getState>['players'][number]): 'UNPAID' | 'CASH' | 'BANK' | 'WAIVED' {
  if (player.paymentStatus === 'WAIVED') return 'WAIVED';
  if (player.paymentStatus !== 'PAID') return 'UNPAID';
  return player.paymentType === 'CK' ? 'BANK' : 'CASH';
}
