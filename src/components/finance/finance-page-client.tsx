'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/form';
import { MetricCard, NoticeCard, PageHeader, PageShell, SectionCard, ToolbarCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCurrentUser } from '@/hooks/use-auth';
import { useTransactions, useFinanceMutations } from '@/hooks/use-finance';
import { hasPermission } from '@/lib/auth/permissions';
import { formatCurrency } from '@/lib/date-format';
import { getFinanceTotals, getSignedAmount, normalizeAdjustmentType } from '@/lib/finance-calculation';

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
  const { data: transactions = [], isLoading, error } = useTransactions({ period: reportPeriod, month: reportMonth, year: reportYear });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, reportMonth, reportPeriod, reportYear, sortBy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    if (!title.trim()) {
      setActionError('Vui lòng nhập tiêu đề phiếu thu chi.');
      return;
    }
    try {
      await createTransaction.mutateAsync({ transactionType, adjustmentType, category, title, quantity, unitPrice, note });
      setTitle('');
      setNote('');
      setUnitPrice(0);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Không thể tạo phiếu thu chi');
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

  return (
    <PageShell>
      <PageHeader
        eyebrow="Thu chi vận hành"
        title="Thu chi"
        description="Theo dõi thu, chi và lợi nhuận theo kỳ báo cáo, gồm phiếu tự sinh từ ca và phiếu nhập tay."
      />

      <ToolbarCard
        title="Kỳ báo cáo"
        description="Mặc định tính theo tháng hiện tại."
        actions={(
          <>
            <Select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)} className={compactFormInputClass}>
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </Select>
            {reportPeriod === 'MONTH' ? (
              <Input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className={compactFormInputClass} />
            ) : (
              <Input type="number" min={2000} max={2100} value={reportYear} onChange={(event) => setReportYear(event.target.value)} className={`${compactFormInputClass} sm:w-28`} />
            )}
          </>
        )}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Doanh thu" value={`${formatCurrency(totals.income)}đ`} tone="income" />
        <MetricCard label="Chi phí" value={`${formatCurrency(totals.expense)}đ`} tone="expense" />
        <MetricCard label="Lợi nhuận" value={`${formatCurrency(totals.income - totals.expense)}đ`} tone="profit" valueClassName={totals.income - totals.expense >= 0 ? undefined : 'text-danger'} />
      </section>

      {canWriteFinance ? (
      <SectionCard
        title="Tạo phiếu thu chi"
        description="Dùng cho các khoản vận hành nhập tay: cầu, sân, slot, khác. Không cần chọn ca chơi."
        actions={(
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsFormOpen((open) => !open)}>
            {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isFormOpen ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        )}
      >

        {isFormOpen ? (
          <form onSubmit={submit} className="grid gap-3 rounded-lg bg-surface-muted p-3 md:grid-cols-[1.5fr_110px_150px_120px_90px_130px_auto] md:items-end">
            <label className="block md:col-span-1">
              <span className={formLabelClass}>Tiêu đề</span>
              <Input required value={title} onChange={(event) => setTitle(event.target.value)} className={formInputClass} />
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
            <label className="block md:col-span-6">
              <span className={formLabelClass}>Ghi chú</span>
              <Input value={note} onChange={(event) => setNote(event.target.value)} className={formInputClass} />
            </label>
            <Button type="submit" disabled={createTransaction.isPending} className="h-11">
              {createTransaction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi phiếu
            </Button>
          </form>
        ) : null}
      </SectionCard>
      ) : null}

      {isLoading ? <NoticeCard>Đang tải giao dịch...</NoticeCard> : null}
      {error ? <NoticeCard tone="danger">{error.message}</NoticeCard> : null}
      {actionError ? <NoticeCard tone="warning">{actionError}</NoticeCard> : null}

      <SectionCard
        title="Danh sách thu chi"
        description="Danh sách đang hiển thị theo kỳ báo cáo đã chọn; dùng sắp xếp mới nhất hoặc cũ nhất để đối soát nhanh."
        actions={(
          <>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as TransactionSort)} className={compactFormInputClass}>
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
            </Select>
            <Select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} sm:w-32`}>
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
            </Select>
          </>
        )}
      >
        <div className="operational-x-scroll max-h-[420px] overflow-auto rounded-lg border border-border">
          <div className="min-w-[880px]">
            <div className="sticky top-0 z-10 grid grid-cols-[94px_minmax(0,2.4fr)_120px_130px_160px] items-center gap-3 border-b border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <div>Loại</div>
              <div>Nội dung</div>
              <div>SL x Đơn giá</div>
              <div className="text-right">Số tiền</div>
              <div className="text-right">Thời gian</div>
            </div>
            {visibleTransactions.map((item) => (
              <article key={item.id} className="grid grid-cols-[94px_minmax(0,2.4fr)_120px_130px_160px] items-center gap-3 border-b border-border px-3 py-3 text-sm">
                <TransactionBadge type={item.transactionType} adjustmentType={item.adjustmentType} />
                <div className="min-w-0">
                  <div className="break-words font-medium text-foreground">{item.title || item.category}</div>
                  <div className="break-words text-xs text-muted-foreground">{getCategoryLabel(item.category)} · {item.note || '-'}</div>
                </div>
                <div className="text-muted-foreground">{item.quantity} x {formatCurrency(item.unitPrice)}đ</div>
                <div className={`text-right font-mono font-semibold ${getSignedAmount(item.totalAmount, item.adjustmentType) >= 0 ? 'text-foreground' : 'text-warning'}`}>
                  {formatSignedCurrency(item.totalAmount, item.adjustmentType)}
                </div>
                <div className="text-right text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</div>
              </article>
            ))}
            {!isLoading && visibleTransactions.length === 0 ? (
              <EmptyState title="Chưa có giao dịch" description="Kỳ báo cáo đang chọn chưa có phiếu thu chi." className="m-3" />
            ) : null}
          </div>
        </div>
        <PaginationControls
          currentPage={Math.min(currentPage, totalPages)}
          totalPages={totalPages}
          totalItems={sortedTransactions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
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
