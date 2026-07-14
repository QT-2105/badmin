'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle, CircleDollarSign, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { MetricCard, NoticeCard, PageHeader, PageShell, SectionCard, ToolbarCard, compactFormInputClass } from '@/components/ui/page-layout';
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
    <PageShell minWidth="min-w-[720px] md:min-w-0">
      <PageHeader
        eyebrow="Tổng quan vận hành"
        title="Dashboard"
        description="Xem nhanh doanh thu, chi phí, lợi nhuận, tồn kho và các ca cần xử lý trong kỳ. Điều phối realtime luôn mở từ chi tiết từng ca chơi."
        actions={(
          <>
          <Link href="/schedule"><Button size="sm" variant="secondary">Lịch chơi</Button></Link>
          <Link href="/finance"><Button size="sm" variant="secondary">Thu chi</Button></Link>
          <Link href="/inventory"><Button size="sm" variant="secondary">Kho cầu</Button></Link>
          </>
        )}
      />

      <ToolbarCard
        title="Kỳ báo cáo"
        description={data?.periodLabel ?? 'Mặc định tháng hiện tại'}
        actions={(
          <>
            <select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className={compactFormInputClass}>
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </select>
            {period === 'MONTH' ? (
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={compactFormInputClass} />
            ) : (
              <input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(event.target.value)} className={`${compactFormInputClass} sm:w-28`} />
            )}
          </>
        )}
      />

      {isLoading ? <NoticeCard>Đang tải dashboard...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}

      {data ? (
        <>
          <section className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={TrendingUp} label="Doanh thu" value={`${formatCurrency(data.totalIncome)}đ`} sub={`${data.sessions} ca · ${data.players} lượt người chơi`} tone="income" />
            <MetricCard icon={TrendingDown} label="Chi phí" value={`${formatCurrency(data.totalExpense)}đ`} sub={formatCostSub(data.costBreakdown)} tone="expense" />
            <MetricCard
              icon={CircleDollarSign}
              label="Lợi nhuận"
              value={`${formatCurrency(data.totalProfit)}đ`}
              sub={`Chưa thu ${formatCurrency(data.unpaidAmount)}đ`}
              tone="profit"
              valueClassName={data.totalProfit >= 0 ? undefined : 'text-danger'}
            />
            <MetricCard
              icon={Package}
              label="Tồn kho cầu"
              value={(
                <>
                  {data.inventoryTubes} ống {data.inventoryLooseBalls} quả <span className="text-base font-semibold opacity-80">({data.inventoryPieces} quả)</span>
                </>
              )}
              sub={`${data.inventoryProducts} loại · ${formatCurrency(data.inventoryValue)}đ vốn`}
              tone="inventory"
            />
          </section>

          <SectionCard
            title="Dòng tiền theo ngày"
            description="Thu, chi và lợi nhuận trong kỳ."
            className="min-h-[320px]"
            contentClassName="flex min-h-0 flex-1 flex-col"
            actions={(
                <div className="hidden gap-3 text-xs text-muted-foreground sm:flex">
                  <Legend color="bg-emerald-400" label="Thu" />
                  <Legend color="bg-rose-400" label="Chi" />
                  <Legend color="bg-cyan-300" label="Lãi" />
                </div>
            )}
          >
              <div className="operational-x-scroll mt-4 flex min-h-0 flex-1 items-end gap-1 pb-2">
                {data.dailyFinance.map((item) => (
                  <div key={item.date} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                    <div className="flex h-44 w-full items-end justify-center gap-0.5">
                      <Bar value={item.income} max={chartMax} className="bg-emerald-400/80" />
                      <Bar value={item.expense} max={chartMax} className="bg-rose-400/80" />
                      <Bar value={Math.abs(item.profit)} max={chartMax} className={item.profit >= 0 ? 'bg-cyan-300/80' : 'bg-amber-300/80'} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
          </SectionCard>

          <section className="grid auto-rows-fr gap-4 xl:grid-cols-3">
            <DashboardInfoCard title="Cơ cấu chi phí">
              <div className="space-y-3">
                {data.costBreakdown.length > 0 ? data.costBreakdown.map((item) => (
                  <BreakdownRow key={item.category} label={item.label} amount={item.amount} total={data.totalExpense} />
                )) : <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted-foreground">Chưa có chi phí trong kỳ.</div>}
              </div>
            </DashboardInfoCard>

            <DashboardInfoCard title="Cần chú ý">
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {data.alerts.length > 0 ? data.alerts.map((alert) => (
                  <Link key={alert.id} href={(alert.href || '/dashboard') as Route} className="block rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:bg-muted">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 ${alert.tone === 'danger' ? 'text-danger' : alert.tone === 'warning' ? 'text-warning' : 'text-info'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">{alert.title}</div>
                        <div className="text-xs text-muted-foreground">{alert.detail}</div>
                      </div>
                    </div>
                  </Link>
                )) : <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted-foreground">Không có cảnh báo vận hành.</div>}
              </div>
            </DashboardInfoCard>

            <DashboardInfoCard title="Tồn kho cần chú ý">
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {data.lowStockProducts.length > 0 ? data.lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border border-border bg-surface-muted p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{formatTubeBall(product.quantityBall, product.ballsPerTube)} · {product.quantityBall} quả</div>
                      </div>
                      <div className="shrink-0 text-right text-xs font-semibold text-inventory">{formatCurrency(product.stockValue)}đ</div>
                    </div>
                  </div>
                )) : <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted-foreground">Tồn kho chưa có loại cầu dưới ngưỡng thấp.</div>}
              </div>
            </DashboardInfoCard>
          </section>

          <SectionCard title="Ca chơi gần đây" actions={<Link href="/schedule" className="text-xs font-semibold text-info hover:opacity-80">Xem lịch</Link>} className="min-h-[360px]" contentClassName="flex flex-1 flex-col">
              <div className="operational-x-scroll mt-3 flex-1">
                <table className="min-w-[1180px] w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 text-left font-medium">Ca chơi</th>
                      <th className="py-2 text-left font-medium">Trạng thái</th>
                      <th className="py-2 text-right font-medium">Người</th>
                      <th className="py-2 text-right font-medium">Đã thu</th>
                      <th className="py-2 text-right font-medium">Số sân</th>
                      <th className="py-2 text-right font-medium">Tiền sân</th>
                      <th className="py-2 text-right font-medium">Số cầu</th>
                      <th className="py-2 text-right font-medium">Tiền cầu</th>
                      <th className="py-2 text-right font-medium">Tổng chi phí</th>
                      <th className="py-2 text-right font-medium">Lãi</th>
                      <th className="py-2 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="py-3">
                          <div className="font-medium text-foreground">{session.name}</div>
                          <div className="text-xs text-muted-foreground">{session.playDate} · {session.startTime}-{session.endTime}</div>
                        </td>
                        <td className="py-3 text-muted-foreground">{getSessionStatusLabel(session.status)}</td>
                        <td className="py-3 text-right text-muted-foreground">{session.playerCount}</td>
                        <td className="py-3 text-right font-mono text-success">{formatCurrency(session.paidAmount)}đ</td>
                        <td className="py-3 text-right text-muted-foreground">{session.courtCount}</td>
                        <td className="py-3 text-right font-mono text-foreground">{formatCurrency(session.courtCost)}đ</td>
                        <td className="py-3 text-right text-muted-foreground">{session.shuttlecockPiecesUsed}</td>
                        <td className="py-3 text-right font-mono text-inventory">{formatCurrency(session.shuttlecockExpense)}đ</td>
                        <td className="py-3 text-right font-mono text-danger">{formatCurrency(session.totalExpense)}đ</td>
                        <td className={`py-3 text-right font-mono ${session.totalProfit >= 0 ? 'text-info' : 'text-danger'}`}>{formatCurrency(session.totalProfit)}đ</td>
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
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}

function DashboardInfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionCard title={title} className="min-h-[210px]" contentClassName="flex-1">
      {children}
    </SectionCard>
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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{formatCurrency(amount)}đ</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-info" style={{ width: `${percent}%` }} />
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
