'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle, ChevronDown, CircleDollarSign, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/form';
import { NoticeCard, PageFeedbackStack, PageHeader, PageShell, PageSummaryGrid, SectionCard, compactFormInputClass } from '@/components/ui/page-layout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { formatCurrency } from '@/lib/date-format';
import { getSessionStatusLabel } from '@/lib/session-status';
import type { DashboardSummary } from '@/types/domain';

type ReportPeriod = 'MONTH' | 'YEAR';
type RecentSession = DashboardSummary['recentSessions'][number];
type DashboardAlert = DashboardSummary['alerts'][number];
type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'inventory';

const today = new Date();
const neutralTableTextClass = 'font-mono tabular-nums text-text-secondary';
const neutralCountClass = 'tabular-nums text-text-secondary';
const dashboardButtonClass =
  'transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:ring-2 hover:ring-primary/15 focus-visible:ring-focus/50 active:bg-primary-soft/80 active:text-primary motion-reduce:transition-none';
const dashboardFieldClass =
  'hover:border-primary/40 hover:bg-surface-hover focus-visible:border-focus focus-visible:ring-focus/25';
const dashboardClickableCardClass =
  'transition-[background-color,border-color,color,box-shadow] duration-150 hover:border-info/50 hover:bg-info-soft/20 hover:ring-2 hover:ring-info/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50 active:bg-info-soft/30 motion-reduce:transition-none';

function getSessionStatusTone(status: RecentSession['status']): BadgeTone {
  const normalizedStatus = String(status).toUpperCase();

  if (normalizedStatus.includes('COMPLETED') || normalizedStatus.includes('FINISHED')) return 'success';
  if (normalizedStatus.includes('ACTIVE') || normalizedStatus.includes('RUNNING') || normalizedStatus.includes('IN_PROGRESS')) return 'info';
  if (normalizedStatus.includes('CANCEL')) return 'danger';
  if (normalizedStatus.includes('PENDING') || normalizedStatus.includes('SCHEDULED') || normalizedStatus.includes('WAITING')) return 'warning';

  return 'neutral';
}

const recentSessionColumns: DataTableColumn<RecentSession>[] = [
  {
    key: 'session',
    header: 'Ca chơi',
    render: (session) => (
      <div>
        <div className="font-medium text-foreground">{session.name}</div>
        <div className="text-xs text-muted-foreground">{session.playDate} · {session.startTime}-{session.endTime}</div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (session) => (
      <StatusBadge tone={getSessionStatusTone(session.status)} className="rounded-lg">
        {getSessionStatusLabel(session.status)}
      </StatusBadge>
    )
  },
  {
    key: 'players',
    header: 'Người',
    align: 'right',
    render: (session) => <span className={neutralCountClass}>{session.playerCount}</span>
  },
  {
    key: 'paidAmount',
    header: 'Đã thu',
    align: 'right',
    render: (session) => <span className={neutralTableTextClass}>{formatCurrency(session.paidAmount)}đ</span>
  },
  {
    key: 'courtCount',
    header: 'Số sân',
    align: 'right',
    render: (session) => <span className={neutralCountClass}>{session.courtCount}</span>
  },
  {
    key: 'courtCost',
    header: 'Tiền sân',
    align: 'right',
    render: (session) => <span className={neutralTableTextClass}>{formatCurrency(session.courtCost)}đ</span>
  },
  {
    key: 'shuttlecockPiecesUsed',
    header: 'Số cầu',
    align: 'right',
    render: (session) => <span className={neutralCountClass}>{session.shuttlecockPiecesUsed}</span>
  },
  {
    key: 'shuttlecockExpense',
    header: 'Tiền cầu',
    align: 'right',
    render: (session) => <span className={neutralTableTextClass}>{formatCurrency(session.shuttlecockExpense)}đ</span>
  },
  {
    key: 'totalExpense',
    header: 'Tổng chi phí',
    align: 'right',
    render: (session) => <span className={neutralTableTextClass}>{formatCurrency(session.totalExpense)}đ</span>
  },
  {
    key: 'totalProfit',
    header: 'Lợi nhuận/ca',
    align: 'right',
    render: (session) => <span className={neutralTableTextClass}>{formatCurrency(session.totalProfit)}đ</span>
  },
  {
    key: 'action',
    header: 'Thao tác',
    align: 'right',
    render: (session) => (
      <Link href={`/sessions/${session.id}`}>
        <Button size="sm" variant="secondary" className={`h-9 ${dashboardButtonClass}`}>Chi tiết</Button>
      </Link>
    )
  }
];

export function DashboardPageClient() {
  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [month, setMonth] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [year, setYear] = useState(() => String(today.getFullYear()));
  const [operationalAlertsExpanded, setOperationalAlertsExpanded] = useState(false);
  const [stockAlertsExpanded, setStockAlertsExpanded] = useState(false);
  const { data, isLoading, error } = useDashboardSummary({ period, month, year });
  const recentSessionProfitTotal = useMemo(() => {
    return data?.recentSessions.reduce((total, session) => total + session.totalProfit, 0) ?? 0;
  }, [data?.recentSessions]);

  const operationalAlerts = useMemo(() => {
    return data?.alerts.filter((alert) => !alert.id.startsWith('stock-')) ?? [];
  }, [data?.alerts]);

  const unpaidSessionHref = useMemo(() => {
    const session = data?.recentSessions.find((item) => item.expectedAmount > item.paidAmount && isIncompleteSessionStatus(item.status));
    return session ? `/sessions/${session.id}` : undefined;
  }, [data?.recentSessions]);

  const chartMax = useMemo(() => {
    if (!data?.dailyFinance.length) return 1;
    return Math.max(1, ...data.dailyFinance.flatMap((item) => [item.income, item.expense, Math.abs(item.profit)]));
  }, [data?.dailyFinance]);

  useEffect(() => {
    setOperationalAlertsExpanded(operationalAlerts.length > 0);
  }, [operationalAlerts.length]);

  useEffect(() => {
    setStockAlertsExpanded((data?.lowStockProducts.length ?? 0) > 0);
  }, [data?.lowStockProducts.length]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Tổng quan vận hành"
        title="Tổng quan"
        description="Báo cáo thống kê doanh thu, chi phí, lợi nhuận và tồn kho trong kỳ. Hỗ trợ thao tác mở nhanh các khu vực vận hành cần xử lý. Cảnh báo vận hành"
        actions={(
          <>
          <Link href="/schedule" className="w-full sm:w-auto"><Button size="sm" variant="secondary" className={`h-10 w-full sm:w-auto ${dashboardButtonClass}`}>Lịch chơi</Button></Link>
          <Link href="/finance" className="w-full sm:w-auto"><Button size="sm" variant="secondary" className={`h-10 w-full sm:w-auto ${dashboardButtonClass}`}>Thu chi</Button></Link>
          <Link href="/inventory" className="w-full sm:w-auto"><Button size="sm" variant="secondary" className={`h-10 w-full sm:w-auto ${dashboardButtonClass}`}>Kho cầu</Button></Link>
          </>
        )}
      />

      <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-card-title">Kỳ báo cáo</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{data?.periodLabel ?? 'Mặc định tháng hiện tại'}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)} className={`${compactFormInputClass} ${dashboardFieldClass} sm:w-36`}>
            <option value="MONTH">Theo tháng</option>
            <option value="YEAR">Theo năm</option>
          </Select>
          {period === 'MONTH' ? (
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={`${compactFormInputClass} ${dashboardFieldClass} sm:w-40`} />
          ) : (
            <Input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(event.target.value)} className={`${compactFormInputClass} ${dashboardFieldClass} sm:w-28`} />
          )}
        </div>
      </section>

      {(isLoading || error) ? (
        <PageFeedbackStack>
          {isLoading ? <NoticeCard>Đang tải dashboard...</NoticeCard> : null}
          {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
        </PageFeedbackStack>
      ) : null}

      {data ? (
        <>
          <PageSummaryGrid className="sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={TrendingUp} label="Doanh thu" value={`${formatCurrency(data.totalIncome)}đ`} sub={`${data.sessions} ca · ${data.players} lượt người chơi`} tone="success" />
            <StatCard icon={TrendingDown} label="Chi phí" value={`${formatCurrency(data.totalExpense)}đ`} sub={formatCostSub(data.costBreakdown)} tone="expense" />
            <StatCard
              icon={CircleDollarSign}
              label="Lợi nhuận"
              value={`${formatCurrency(data.totalProfit)}đ`}
              tone={data.totalProfit > 0 ? 'primary' : data.totalProfit < 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              icon={Package}
              label="Tồn kho cầu"
              value={(
                <>
                  {data.inventoryTubes} ống {data.inventoryLooseBalls} quả <span className="text-sm font-semibold opacity-80">({data.inventoryPieces} quả)</span>
                </>
              )}
              sub={`${data.inventoryProducts} loại · ${formatCurrency(data.inventoryValue)}đ vốn`}
              tone={data.lowStockProducts.length > 0 ? 'warning' : 'stock'}
            />
          </PageSummaryGrid>

          <SectionCard
            title="Dòng tiền theo ngày"
            description="Thu, chi và lợi nhuận trong kỳ."
            density="compact"
            actions={(
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                <Legend tone="income" label="Thu" />
                <Legend tone="expense" label="Chi" />
                <Legend tone="profit" label="Lãi" />
              </div>
            )}
          >
            <div className="rounded-xl border border-border bg-surface-muted p-3">
              {data.dailyFinance.length > 0 ? (
                <div className="operational-x-scroll" aria-label="Biểu đồ thu, chi và lợi nhuận theo ngày">
                  <div className="flex min-h-[184px] min-w-max items-end gap-2 pb-1" role="list">
                    {data.dailyFinance.map((item) => (
                      <div
                        key={item.date}
                        aria-label={`${item.label}: thu ${formatCurrency(item.income)} đồng, chi ${formatCurrency(item.expense)} đồng, lãi ${formatCurrency(item.profit)} đồng`}
                        className="flex w-10 flex-col items-center gap-2"
                        role="listitem"
                      >
                        <div className="flex h-36 w-full items-end justify-center gap-1">
                          <Bar value={item.income} max={chartMax} tone="income" />
                          <Bar value={item.expense} max={chartMax} tone="expense" />
                          <Bar value={Math.abs(item.profit)} max={chartMax} tone={item.profit >= 0 ? 'profit' : 'loss'} />
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState title="Chưa có dòng tiền" description="Kỳ báo cáo hiện tại chưa phát sinh dữ liệu thu chi theo ngày." />
              )}
            </div>
          </SectionCard>

          <section className="grid items-start gap-4 xl:grid-cols-3">
            <DashboardInfoCard title="Cơ cấu chi phí">
              <div className="space-y-3" role="list" aria-label="Cơ cấu chi phí trong kỳ">
                {data.costBreakdown.length > 0 ? data.costBreakdown.map((item) => (
                  <BreakdownRow key={item.category} label={item.label} amount={item.amount} total={data.totalExpense} />
                )) : <EmptyState title="Chưa có chi phí" description="Kỳ báo cáo hiện tại chưa có khoản chi." />}
              </div>
            </DashboardInfoCard>

            <CollapsibleDashboardInfoCard
              alertCount={operationalAlerts.length}
              collapsedLabel={operationalAlerts.length > 0 ? `${operationalAlerts.length} cảnh báo vận hành` : 'Không có cảnh báo vận hành'}
              expanded={operationalAlertsExpanded}
              onToggle={() => setOperationalAlertsExpanded((value) => !value)}
              title="Cảnh báo vận hành"
            >
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1" role="list" aria-label="Cảnh báo vận hành">
                {operationalAlerts.length > 0 ? operationalAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={resolveAlertHref(alert, unpaidSessionHref) as Route}
                    className={`group block rounded-lg border border-border bg-surface-muted p-3 ${dashboardClickableCardClass}`}
                    role="listitem"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${alert.tone === 'danger' ? 'border-danger/25 bg-danger-soft text-danger' : alert.tone === 'warning' ? 'border-warning/30 bg-warning-soft text-warning' : 'border-info/25 bg-info-soft text-info'}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground transition-colors group-hover:text-info">{alert.title}</div>
                        <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{alert.detail}</div>
                      </div>
                    </div>
                  </Link>
                )) : <EmptyState title="Không có cảnh báo" description="Không có cảnh báo vận hành trong kỳ này." />}
              </div>
            </CollapsibleDashboardInfoCard>

            <CollapsibleDashboardInfoCard
              alertCount={data.lowStockProducts.length}
              collapsedLabel={data.lowStockProducts.length > 0 ? `${data.lowStockProducts.length} cảnh báo cầu tồn kho` : 'Tồn kho đang ổn định'}
              expanded={stockAlertsExpanded}
              onToggle={() => setStockAlertsExpanded((value) => !value)}
              title="Cảnh báo cầu tồn kho"
            >
              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1" role="list" aria-label="Tồn kho cầu dưới ngưỡng">
                {data.lowStockProducts.length > 0 ? data.lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border border-warning/25 bg-warning-soft/40 p-3" role="listitem">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{product.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span className="rounded-full border border-warning/25 bg-surface px-2 py-0.5 text-warning">{formatTubeBall(product.quantityBall, product.ballsPerTube)}</span>
                          <span>{product.quantityBall} quả</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs font-semibold text-warning">{formatCurrency(product.stockValue)}đ</div>
                    </div>
                  </div>
                )) : <EmptyState title="Tồn kho ổn định" description="Chưa có loại cầu nào dưới ngưỡng thấp." />}
              </div>
            </CollapsibleDashboardInfoCard>
          </section>

          <SectionCard
            title="Ca chơi gần đây"
            description="Các ca mới nhất trong kỳ báo cáo để mở nhanh chi tiết và đối soát vận hành."
            actions={(
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
                <div className="rounded-lg border border-info/20 bg-info-soft/35 px-3 py-2 text-sm text-muted-foreground" aria-label={`Tổng lợi nhuận trên các ca gần đây ${formatCurrency(recentSessionProfitTotal)} đồng`}>
                  <span>Tổng lợi nhuận/ca</span>
                  <span className="ml-2 font-mono font-semibold tabular-nums text-info">{formatCurrency(recentSessionProfitTotal)}đ</span>
                </div>
                <Link href="/schedule" className="w-full sm:w-auto"><Button size="sm" variant="secondary" className={`h-10 w-full sm:w-auto ${dashboardButtonClass}`}>Xem lịch</Button></Link>
              </div>
            )}
            className="min-h-[360px]"
            contentClassName="flex flex-1 flex-col"
          >
            <DataTable
              aria-label="Ca chơi gần đây"
              caption="Ca chơi gần đây"
              className="mt-3 flex-1"
              columns={recentSessionColumns}
              density="compact"
              emptyState={{
                title: 'Chưa có ca chơi',
                description: 'Kỳ báo cáo hiện tại chưa có ca chơi để hiển thị.'
              }}
              getRowKey={(session) => session.id}
              minWidth="1180px"
              mobileRenderer={(session) => (
                <div className="space-y-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words font-semibold text-foreground">{session.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{session.playDate} · {session.startTime}-{session.endTime}</div>
                    </div>
                    <StatusBadge tone={getSessionStatusTone(session.status)} className="shrink-0 rounded-lg">
                      {getSessionStatusLabel(session.status)}
                    </StatusBadge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Người chơi</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-foreground">{session.playerCount}</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Số sân</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-foreground">{session.courtCount}</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Đã thu</dt>
                      <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(session.paidAmount)}đ</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Lợi nhuận/ca</dt>
                      <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(session.totalProfit)}đ</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Tiền sân</dt>
                      <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(session.courtCost)}đ</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2">
                      <dt className="text-muted-foreground">Tiền cầu</dt>
                      <dd className="mt-1 font-mono font-semibold text-foreground">{formatCurrency(session.shuttlecockExpense)}đ</dd>
                    </div>
                  </dl>
                  <Link href={`/sessions/${session.id}`} className="block">
                    <Button size="sm" variant="secondary" className={`h-10 w-full ${dashboardButtonClass}`}>Chi tiết</Button>
                  </Link>
                </div>
              )}
              responsiveMode="cards"
              rowLabel={(session) => `Ca chơi ${session.name}`}
              rows={data.recentSessions}
              stickyHeader
              tableClassName="[&_thead_th]:text-[13px] [&_thead_th]:font-semibold [&_thead_th]:text-foreground [&_tbody_td]:text-sm"
            />
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

function CollapsibleDashboardInfoCard({
  title,
  alertCount,
  collapsedLabel,
  expanded,
  onToggle,
  children
}: {
  title: string;
  alertCount: number;
  collapsedLabel: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentId = useId();
  const description = expanded
    ? alertCount > 0 ? `${alertCount} mục cần xử lý` : 'Không có dữ liệu cảnh báo'
    : collapsedLabel;

  return (
    <section
      className={`min-w-0 self-start overflow-hidden rounded-xl border border-border bg-surface p-3 transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none sm:p-4 ${expanded ? 'min-h-[210px]' : ''}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-section-title">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          onClick={onToggle}
          variant="secondary"
          size="sm"
          className={`h-9 shrink-0 px-2 text-xs ${dashboardButtonClass}`}
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-label={expanded ? `Thu gọn ${title}` : `Mở rộng ${title}`}
        >
          {expanded ? 'Thu gọn' : 'Mở rộng'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </Button>
      </div>
      {expanded ? <div id={contentId} className="mt-3 min-w-0">{children}</div> : null}
    </section>
  );
}

function resolveAlertHref(alert: DashboardAlert, unpaidSessionHref?: string): string {
  if (alert.id === 'unpaid') {
    return unpaidSessionHref ?? '/schedule';
  }

  return alert.href ?? '/dashboard';
}

function isIncompleteSessionStatus(status: string): boolean {
  const normalizedStatus = status.toUpperCase();
  return !normalizedStatus.includes('COMPLETED') && !normalizedStatus.includes('FINISHED') && !normalizedStatus.includes('CANCEL');
}

type ChartTone = 'income' | 'expense' | 'profit' | 'loss';

const chartToneClass: Record<ChartTone, string> = {
  income: 'bg-success',
  expense: 'bg-danger',
  profit: 'bg-info',
  loss: 'bg-warning'
};

function Legend({ tone, label }: { tone: ChartTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${chartToneClass[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function Bar({ value, max, tone }: { value: number; max: number; tone: ChartTone }) {
  const height = value > 0 ? Math.max(2, Math.round((value / max) * 100)) : 2;
  return (
    <div
      className={`w-2.5 rounded-t-md opacity-90 ${chartToneClass[tone]}`}
      style={{ height: `${height}%` }}
    />
  );
}

function BreakdownRow({ label, amount, total }: { label: string; amount: number; total: number }) {
  const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3" role="listitem">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{label}</div>
          <div className="mt-0.5 text-xs font-medium text-muted-foreground">{percent}% tổng chi phí</div>
        </div>
        <span className="shrink-0 font-mono text-sm font-semibold text-danger">{formatCurrency(amount)}đ</span>
      </div>
      <div
        aria-label={`${label}: ${percent}% tổng chi phí`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-danger" style={{ width: `${percent}%` }} />
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
