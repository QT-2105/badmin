'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Loader2, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn, type DataTableState } from '@/components/ui/data-table';
import { SuccessState, WarningState } from '@/components/ui/feedback';
import { FilterBar } from '@/components/ui/filter-bar';
import { Input, Select } from '@/components/ui/form';
import { PageHeader, PageShell, SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCurrentUser } from '@/hooks/use-auth';
import { useTransactions, useFinanceMutations } from '@/hooks/use-finance';
import { hasPermission } from '@/lib/auth/permissions';
import { formatCurrency } from '@/lib/date-format';
import { getFinanceTotals, getSignedAmount, normalizeAdjustmentType } from '@/lib/finance-calculation';
import type { SessionTransactionSummary } from '@/types/domain';

type ReportPeriod = 'MONTH' | 'YEAR';
type TransactionSort = 'NEWEST' | 'OLDEST';

const today = new Date();
const manualCategories = [
  { value: 'COURT_FEE', label: 'Sân' },
  { value: 'SHUTTLECOCK', label: 'Cầu' },
  { value: 'SESSION_FEE', label: 'Slot' },
  { value: 'OTHER', label: 'Khác' }
] as const;

export function FinancePageClient() {
  const { data: currentUser } = useCurrentUser();
  const { createTransaction } = useFinanceMutations();
  const canWriteFinance = hasPermission(currentUser ?? null, 'finance.manage');
  const [transactionType, setTransactionType] = useState('INCOME');
  const [adjustmentType, setAdjustmentType] = useState('NORMAL');
  const [category, setCategory] = useState('SHUTTLECOCK');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('MONTH');
  const [reportMonth, setReportMonth] = useState(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [reportYear, setReportYear] = useState(() => String(today.getFullYear()));
  const [sortBy, setSortBy] = useState<TransactionSort>('NEWEST');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: transactions = [], isLoading, error, refetch } = useTransactions({ period: reportPeriod, month: reportMonth, year: reportYear });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const titleError = actionError === 'Vui lòng nhập tiêu đề phiếu thu chi.';

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, reportMonth, reportPeriod, reportYear, sortBy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!title.trim()) {
      setActionError('Vui lòng nhập tiêu đề phiếu thu chi.');
      return;
    }
    try {
      await createTransaction.mutateAsync({ transactionType, adjustmentType, category, title, quantity, unitPrice, note });
      setTitle('');
      setNote('');
      setUnitPrice(0);
      setActionSuccess('Đã ghi phiếu thu chi.');
    } catch (caught) {
      setActionError(getFinanceActionErrorMessage(caught));
    }
  }

  const reportTransactions = useMemo(() => transactions.filter((item) => isInReportPeriod(item.createdAt, reportPeriod, reportMonth, reportYear)), [reportMonth, reportPeriod, reportYear, transactions]);

  const sortedTransactions = useMemo(() => {
    return [...reportTransactions].sort((left, right) => {
      if (sortBy === 'OLDEST') return getTime(left.createdAt) - getTime(right.createdAt);
      return getTime(right.createdAt) - getTime(left.createdAt);
    });
  }, [reportTransactions, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
  const visibleTransactions = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedTransactions, totalPages]);

  const totals = getFinanceTotals(reportTransactions);
  const profit = totals.income - totals.expense;
  const profitTone = profit > 0 ? 'success' : profit < 0 ? 'danger' : 'neutral';
  const summarySub = isLoading ? 'Đang tải dữ liệu...' : `${reportTransactions.length} phiếu trong kỳ`;
  const selectedPeriodLabel = reportPeriod === 'MONTH' ? `tháng ${reportMonth}` : `năm ${reportYear}`;
  const transactionLoadingState: DataTableState = {
    title: 'Đang tải giao dịch',
    description: `Đang lấy dữ liệu thu chi cho ${selectedPeriodLabel}.`
  };
  const transactionErrorState: DataTableState = {
    title: 'Không thể tải dữ liệu thu chi',
    description: 'Vui lòng kiểm tra kết nối và thử tải lại danh sách.',
    action: (
      <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
        Tải lại
      </Button>
    )
  };
  const transactionEmptyState: DataTableState = {
    title: 'Không có dữ liệu trong kỳ báo cáo',
    description: `Chưa có phiếu thu chi nào được ghi nhận trong ${selectedPeriodLabel}.`
  };
  const transactionColumns = useMemo<DataTableColumn<SessionTransactionSummary>[]>(() => [
    {
      key: 'type',
      header: 'Loại',
      width: '112px',
      render: (item) => <TransactionBadge type={item.transactionType} adjustmentType={item.adjustmentType} />
    },
    {
      key: 'content',
      header: 'Nội dung',
      render: (item) => (
        <div className="min-w-0">
          <div className="break-words font-medium leading-5 text-foreground">{item.title || item.category}</div>
          <div className="mt-1 break-words text-xs leading-5 text-muted-foreground">{getCategoryLabel(item.category)} · {item.note || '-'}</div>
        </div>
      )
    },
    {
      key: 'unit',
      header: 'SL x Đơn giá',
      align: 'right',
      width: '150px',
      render: (item) => (
        <span className="font-mono text-muted-foreground">
          {item.quantity} x {formatCurrency(item.unitPrice)}đ
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Số tiền',
      align: 'right',
      width: '150px',
      render: (item) => (
        <span className={`font-mono font-semibold ${getSignedAmount(item.totalAmount, item.adjustmentType) >= 0 ? 'text-foreground' : 'text-warning'}`}>
          {formatSignedCurrency(item.totalAmount, item.adjustmentType)}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Thời gian',
      align: 'right',
      width: '170px',
      render: (item) => <span className="text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</span>
    }
  ], []);

  return (
    <PageShell className="gap-4 md:gap-5">
      <PageHeader
        eyebrow="Thu chi vận hành"
        title="Thu chi"
        description="Theo dõi thu, chi và lợi nhuận theo kỳ báo cáo; đối soát phiếu tự sinh từ ca và phiếu nhập tay."
      />

      <FilterBar
        title="Kỳ báo cáo"
        description={reportPeriod === 'MONTH' ? `Tháng ${reportMonth}` : `Năm ${reportYear}`}
        density="compact"
        contentClassName="w-full sm:w-auto md:flex-nowrap"
        filters={(
          <>
            <Select
              aria-label="Chọn kỳ báo cáo"
              value={reportPeriod}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
              className={`${compactFormInputClass} w-full sm:w-40`}
            >
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </Select>
            {reportPeriod === 'MONTH' ? (
              <Input
                aria-label="Chọn tháng báo cáo"
                type="month"
                value={reportMonth}
                onChange={(event) => setReportMonth(event.target.value)}
                className={`${compactFormInputClass} w-full sm:w-44`}
              />
            ) : (
              <Input
                aria-label="Nhập năm báo cáo"
                type="number"
                min={2000}
                max={2100}
                value={reportYear}
                onChange={(event) => setReportYear(event.target.value)}
                className={`${compactFormInputClass} w-full sm:w-32`}
              />
            )}
          </>
        )}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isLoading}>
        <StatCard
          icon={TrendingUp}
          label="Doanh thu"
          value={`${formatCurrency(totals.income)}đ`}
          sub={summarySub}
          tone="success"
          density="compact"
        />
        <StatCard
          icon={TrendingDown}
          label="Chi phí"
          value={`${formatCurrency(totals.expense)}đ`}
          sub={summarySub}
          tone="danger"
          density="compact"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Lợi nhuận"
          value={`${formatCurrency(profit)}đ`}
          sub={summarySub}
          tone={profitTone}
          density="compact"
          className="sm:col-span-2 lg:col-span-1"
        />
      </section>

      {canWriteFinance ? (
      <SectionCard
        title="Tạo phiếu thu chi"
        description="Nhập phiếu vận hành thủ công; hệ thống giữ nguyên loại, phân loại, số lượng và đơn giá khi ghi nhận."
        actions={(
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsFormOpen((open) => !open)} className="whitespace-nowrap">
            {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isFormOpen ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        )}
      >

        {isFormOpen ? (
          <form onSubmit={submit} className="rounded-lg border border-border bg-surface-muted p-3 md:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_130px_180px_150px_96px_150px] xl:items-end">
            <label className="block xl:col-span-1">
              <span className={formLabelClass}>Tiêu đề</span>
              <Input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={formInputClass}
                placeholder="VD: Thu slot vãng lai"
                aria-invalid={titleError || undefined}
                aria-describedby={titleError ? 'finance-action-error' : undefined}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>Loại</span>
              <Select value={transactionType} onChange={(event) => setTransactionType(event.target.value)} className={formInputClass}>
                <option value="INCOME">Thu</option>
                <option value="EXPENSE">Chi</option>
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Kiểu ghi nhận</span>
              <Select value={adjustmentType} onChange={(event) => setAdjustmentType(event.target.value)} className={formInputClass}>
                <option value="NORMAL">Ghi nhận thường</option>
                <option value="DEDUCTION">{transactionType === 'INCOME' ? 'Điều chỉnh giảm thu' : 'Điều chỉnh giảm chi'}</option>
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Phân Loại</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value)} className={formInputClass}>
                {manualCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>SL</span>
              <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Đơn giá</span>
              <Input type="number" min={0} step={1} value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} className={formInputClass} />
            </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
            <label className="block">
              <span className={formLabelClass}>Ghi chú</span>
              <Input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} placeholder="Thông tin đối soát nội bộ nếu có" />
            </label>
            <Button type="submit" disabled={createTransaction.isPending} className="h-11 w-full whitespace-nowrap sm:w-auto">
              {createTransaction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi phiếu
            </Button>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-5 text-muted-foreground">
              Tổng tiền vẫn được ghi nhận theo công thức hiện tại: số lượng x đơn giá. Không cần chọn ca chơi cho phiếu nhập tay.
            </div>
          </form>
        ) : null}
      </SectionCard>
      ) : null}

      {actionError ? (
        <div id="finance-action-error" role="alert">
          <WarningState title="Chưa thể ghi phiếu" description={actionError} size="sm" />
        </div>
      ) : null}
      {actionSuccess ? (
        <div id="finance-action-success" role="status" aria-live="polite">
          <SuccessState title="Đã ghi nhận" description={actionSuccess} size="sm" />
        </div>
      ) : null}

      <SectionCard
        title="Danh sách thu chi"
        description="Danh sách đang hiển thị theo kỳ báo cáo đã chọn; dùng sắp xếp mới nhất hoặc cũ nhất để đối soát nhanh."
        actions={(
          <>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as TransactionSort)} className={`${compactFormInputClass} w-full sm:w-40`}>
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
            </Select>
            <Select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} w-full sm:w-32`}>
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
            </Select>
          </>
        )}
      >
        <DataTable
          aria-label="Danh sách thu chi"
          rows={visibleTransactions}
          columns={transactionColumns}
          getRowKey={(item) => item.id}
          loading={isLoading}
          error={Boolean(error)}
          loadingState={transactionLoadingState}
          errorState={transactionErrorState}
          emptyState={transactionEmptyState}
          density="compact"
          minWidth="880px"
          pagination={(
            <PaginationControls
              currentPage={Math.min(currentPage, totalPages)}
              totalPages={totalPages}
              totalItems={sortedTransactions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        />
      </SectionCard>
    </PageShell>
  );
}

function TransactionBadge({ type, adjustmentType }: { type: string; adjustmentType?: string | null }) {
  const isDeduction = normalizeAdjustmentType(adjustmentType) === 'DEDUCTION';
  const config = type === 'INCOME'
    ? isDeduction
      ? { label: 'Giảm thu', tone: 'warning' as const }
      : { label: 'Thu', tone: 'success' as const }
    : isDeduction
      ? { label: 'Giảm chi', tone: 'info' as const }
      : { label: 'Chi', tone: 'danger' as const };
  return <StatusBadge tone={config.tone} className="w-fit rounded-lg">{config.label}</StatusBadge>;
}

function getTime(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isInReportPeriod(value: string | null, period: ReportPeriod, selectedMonth: string, selectedYear: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'MONTH') {
    const [year, month] = selectedMonth.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  }
  return date.getFullYear() === Number(selectedYear);
}

function getCategoryLabel(value: string): string {
  if (value === 'SHUTTLECOCK' || value === 'SHUTTLECOCK_USAGE') return 'Cầu';
  if (value === 'COURT_FEE') return 'Sân';
  if (value === 'SESSION_FEE') return 'Slot';
  return 'Khác';
}

function formatSignedCurrency(amount: number, adjustmentType?: string | null): string {
  const signedAmount = getSignedAmount(amount, adjustmentType);
  const prefix = signedAmount < 0 ? '-' : '';
  return `${prefix}${formatCurrency(Math.abs(signedAmount))}đ`;
}

function getFinanceActionErrorMessage(caught: unknown): string {
  if (!(caught instanceof Error)) return 'Không thể ghi phiếu thu chi. Vui lòng thử lại.';
  if (caught.message === 'Failed to create transaction') return 'Không thể ghi phiếu thu chi. Vui lòng thử lại.';
  return caught.message;
}
