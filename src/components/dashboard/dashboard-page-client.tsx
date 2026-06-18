'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle, CalendarDays, CircleDollarSign, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { formatCurrency } from '@/lib/date-format';
import { getSessionStatusLabel } from '@/lib/session-status';

type ReportPeriod = 'MONTH' | 'YEAR';

const today = new Date();

export function DashboardPageClient() {
  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [month, setMonth] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [year, setYear] = useState(() => String(today.getFullYear()));
  const { data, isLoading, error } = useDashboardSummary({ period, month, year });

  const chartMax = useMemo(() => {
    if (!data?.dailyFinance.length) return 1;
    return Math.max(1, ...data.dailyFinance.flatMap((item) => [item.income, item.expense, Math.abs(item.profit)]));
  }, [data?.dailyFinance]);

  return (
    <div className="operational-x-scroll w-full">
      <div className="mx-auto flex w-full min-w-[720px] max-w-7xl flex-col gap-4 px-4 py-5 md:min-w-0 md:px-6">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Tổng quan vận hành</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">Theo dõi tiền, kho và ca chơi cần xử lý. Điều phối realtime vẫn nằm trong từng ca.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/schedule"><Button size="sm" variant="secondary">Lịch chơi</Button></Link>
          <Link href="/finance"><Button size="sm" variant="secondary">Thu chi</Button></Link>
          <Link href="/inventory"><Button size="sm" variant="secondary">Kho cầu</Button></Link>
        </div>
      </header>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Kỳ báo cáo</div>
            <div className="text-xs text-slate-400">{data?.periodLabel ?? 'Mặc định tháng hiện tại'}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </select>
            {period === 'MONTH' ? (
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            ) : (
              <input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(event.target.value)} className="h-10 w-28 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            )}
          </div>
        </div>
      </section>

      {isLoading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải dashboard...</div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div> : null}

      {data ? (
        <>
          <section className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={TrendingUp} label="Doanh thu" value={`${formatCurrency(data.totalIncome)}đ`} sub={`${data.sessions} ca · ${data.players} lượt người chơi`} tone="text-emerald-300" />
            <KpiCard icon={TrendingDown} label="Chi phí" value={`${formatCurrency(data.totalExpense)}đ`} sub={formatCostSub(data.costBreakdown)} tone="text-rose-300" />
            <KpiCard icon={CircleDollarSign} label="Lợi nhuận" value={`${formatCurrency(data.totalProfit)}đ`} sub={`Chưa thu ${formatCurrency(data.unpaidAmount)}đ`} tone={data.totalProfit >= 0 ? 'text-cyan-300' : 'text-rose-300'} />
            <KpiCard icon={Package} label="Tồn kho cầu" value={`${data.inventoryPieces} quả`} sub={`${data.inventoryProducts} loại · ${formatCurrency(data.inventoryValue)}đ vốn`} tone="text-amber-300" />
          </section>

          <section className="grid items-stretch gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="flex min-h-[320px] flex-col rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Dòng tiền theo ngày</h2>
                  <p className="mt-1 text-xs text-slate-400">Thu, chi và lợi nhuận trong kỳ.</p>
                </div>
                <div className="hidden gap-3 text-xs text-slate-400 sm:flex">
                  <Legend color="bg-emerald-400" label="Thu" />
                  <Legend color="bg-rose-400" label="Chi" />
                  <Legend color="bg-cyan-300" label="Lãi" />
                </div>
              </div>
              <div className="operational-x-scroll mt-4 flex min-h-0 flex-1 items-end gap-1 pb-2">
                {data.dailyFinance.map((item) => (
                  <div key={item.date} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                    <div className="flex h-44 w-full items-end justify-center gap-0.5">
                      <Bar value={item.income} max={chartMax} className="bg-emerald-400/80" />
                      <Bar value={item.expense} max={chartMax} className="bg-rose-400/80" />
                      <Bar value={Math.abs(item.profit)} max={chartMax} className={item.profit >= 0 ? 'bg-cyan-300/80' : 'bg-amber-300/80'} />
                    </div>
                    <div className="text-[10px] text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid auto-rows-fr gap-4">
              <div className="flex min-h-[150px] flex-col rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-white">Cơ cấu chi phí</h2>
                <div className="mt-4 flex-1 space-y-3">
                  {data.costBreakdown.length > 0 ? data.costBreakdown.map((item) => (
                    <BreakdownRow key={item.category} label={item.label} amount={item.amount} total={data.totalExpense} />
                  )) : <div className="text-sm text-slate-400">Chưa có chi phí trong kỳ.</div>}
                </div>
              </div>

              <div className="flex min-h-[150px] flex-col rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-white">Cần chú ý</h2>
                <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                  {data.alerts.length > 0 ? data.alerts.map((alert) => (
                    <Link key={alert.id} href={(alert.href || '/dashboard') as Route} className="block rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`mt-0.5 h-4 w-4 ${alert.tone === 'danger' ? 'text-rose-300' : alert.tone === 'warning' ? 'text-amber-300' : 'text-cyan-300'}`} />
                        <div>
                          <div className="text-sm font-semibold text-white">{alert.title}</div>
                          <div className="text-xs text-slate-400">{alert.detail}</div>
                        </div>
                      </div>
                    </Link>
                  )) : <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">Không có cảnh báo vận hành.</div>}
                </div>
              </div>
            </div>
          </section>

          <section className="grid items-stretch gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="flex min-h-[360px] flex-col rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Ca chơi gần đây</h2>
                <Link href="/schedule" className="text-xs font-semibold text-cyan-200 hover:text-cyan-100">Xem lịch</Link>
              </div>
              <div className="operational-x-scroll mt-3 flex-1">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="py-2 text-left font-medium">Ca chơi</th>
                      <th className="py-2 text-left font-medium">Trạng thái</th>
                      <th className="py-2 text-right font-medium">Người</th>
                      <th className="py-2 text-right font-medium">Đã thu</th>
                      <th className="py-2 text-right font-medium">Chi phí</th>
                      <th className="py-2 text-right font-medium">Lãi</th>
                      <th className="py-2 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="py-3">
                          <div className="font-medium text-white">{session.name}</div>
                          <div className="text-xs text-slate-400">{session.playDate} · {session.startTime}-{session.endTime}</div>
                        </td>
                        <td className="py-3 text-slate-300">{getSessionStatusLabel(session.status)}</td>
                        <td className="py-3 text-right text-slate-300">{session.playerCount}</td>
                        <td className="py-3 text-right font-mono text-emerald-200">{formatCurrency(session.paidAmount)}đ</td>
                        <td className="py-3 text-right font-mono text-rose-200">{formatCurrency(session.totalExpense)}đ</td>
                        <td className={`py-3 text-right font-mono ${session.totalProfit >= 0 ? 'text-cyan-200' : 'text-rose-200'}`}>{formatCurrency(session.totalProfit)}đ</td>
                        <td className="py-3 text-right">
                          <Link href={`/sessions/${session.id}`}>
                            <Button size="sm" variant="secondary" className="h-9">Chi tiết</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex min-h-[360px] flex-col rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h2 className="text-sm font-semibold text-white">Tồn kho cần chú ý</h2>
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                {data.lowStockProducts.length > 0 ? data.lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{product.name}</div>
                        <div className="text-xs text-slate-400">{formatTubeBall(product.quantityBall, product.ballsPerTube)} · {product.quantityBall} quả</div>
                      </div>
                      <div className="text-right text-xs text-amber-200">{formatCurrency(product.stockValue)}đ</div>
                    </div>
                  </div>
                )) : <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-400">Tồn kho chưa có loại cầu dưới ngưỡng thấp.</div>}
              </div>
            </div>
          </section>
        </>
      ) : null}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }: { icon: typeof CalendarDays; label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="flex h-full min-h-[132px] flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-3 break-words text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-auto pt-2 text-xs leading-5 text-slate-400">{sub}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const height = Math.max(2, Math.round((value / max) * 100));
  return <div className={`w-2 rounded-t ${className}`} style={{ height: `${height}%` }} />;
}

function BreakdownRow({ label, amount, total }: { label: string; amount: number; total: number }) {
  const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-white">{formatCurrency(amount)}đ</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-cyan-300/80" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatCostSub(items: Array<{ label: string; amount: number }>): string {
  if (items.length === 0) return 'Chưa có chi phí';
  return items.slice(0, 2).map((item) => `${item.label} ${formatCurrency(item.amount)}đ`).join(' · ');
}

function formatTubeBall(quantityBall: number, ballsPerTube: number): string {
  return `${Math.floor(quantityBall / ballsPerTube)} ống ${quantityBall % ballsPerTube} quả`;
}
