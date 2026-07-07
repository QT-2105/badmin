'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { useCurrentUser } from '@/hooks/use-auth';
import { useTransactions, useFinanceMutations } from '@/hooks/use-finance';
import { hasPermission } from '@/lib/auth/permissions';
import { formatCurrency } from '@/lib/date-format';

type ReportPeriod = 'MONTH' | 'YEAR';
type TransactionSort = 'NEWEST' | 'OLDEST';

const today = new Date();
const manualCategories = [
  { value: 'SHUTTLECOCK', label: 'Cầu' },
  { value: 'COURT_FEE', label: 'Sân' },
  { value: 'OTHER', label: 'Khác' }
] as const;

export function FinancePageClient() {
  const { data: currentUser } = useCurrentUser();
  const { createTransaction } = useFinanceMutations();
  const canWriteFinance = hasPermission(currentUser ?? null, 'finance.manage');
  const [transactionType, setTransactionType] = useState('INCOME');
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
      await createTransaction.mutateAsync({ transactionType, category, title, quantity, unitPrice, note });
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

  const totals = reportTransactions.reduce(
    (acc, item) => {
      if (item.transactionType === 'INCOME') acc.income += item.totalAmount;
      if (item.transactionType === 'EXPENSE') acc.expense += item.totalAmount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Operational finance</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Thu chi</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">Ghi nhận thu chi vận hành nhập tay. Giao dịch tự sinh từ hoàn tất ca vẫn được đối soát theo ca chơi.</p>
      </header>

      {canWriteFinance ? (
      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Kỳ báo cáo</div>
            <div className="text-xs text-slate-400">Mặc định tính theo tháng hiện tại.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              <option value="MONTH">Theo tháng</option>
              <option value="YEAR">Theo năm</option>
            </select>
            {reportPeriod === 'MONTH' ? (
              <input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            ) : (
              <input type="number" min={2000} max={2100} value={reportYear} onChange={(event) => setReportYear(event.target.value)} className="h-10 w-28 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            )}
          </div>
        </div>
      </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Doanh thu" value={`${formatCurrency(totals.income)}đ`} tone="text-emerald-300" />
        <Metric label="Chi phí" value={`${formatCurrency(totals.expense)}đ`} tone="text-rose-300" />
        <Metric label="Lợi nhuận" value={`${formatCurrency(totals.income - totals.expense)}đ`} tone="text-cyan-300" />
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Tạo phiếu thu chi</h2>
            <p className="text-xs text-slate-400">Dùng cho các khoản vận hành nhập tay: cầu, sân, khác. Không cần chọn ca chơi.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsFormOpen((open) => !open)}>
            {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isFormOpen ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        </div>

        {isFormOpen ? (
          <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg bg-white/[0.03] p-3 md:grid-cols-[1.6fr_110px_120px_90px_130px_auto] md:items-end">
            <label className="block md:col-span-1">
              <span className="text-xs text-slate-400">Tiêu đề</span>
              <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Loại</span>
              <select value={transactionType} onChange={(event) => setTransactionType(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
                <option value="INCOME">Thu</option>
                <option value="EXPENSE">Chi</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Phân Loại</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
                {manualCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">SL</span>
              <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Đơn giá</span>
              <input type="number" min={0} step={1} value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            </label>
            <label className="block md:col-span-5">
              <span className="text-xs text-slate-400">Ghi chú</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none" />
            </label>
            <Button type="submit" disabled={createTransaction.isPending} className="h-11">
              {createTransaction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi phiếu
            </Button>
          </form>
        ) : null}
      </section>

      {isLoading ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Đang tải giao dịch...</div> : null}
      {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error.message}</div> : null}
      {actionError ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">{actionError}</div> : null}

      <section className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-white">Danh sách thu chi</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as TransactionSort)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
            </select>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) as PageSize)} className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none">
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-white/10">
          {visibleTransactions.map((item) => (
            <article key={item.id} className="grid gap-2 border-b border-white/5 px-3 py-3 text-sm lg:grid-cols-[84px_minmax(0,2.4fr)_100px_110px_130px] lg:items-center">
              <TransactionBadge type={item.transactionType} />
              <div className="min-w-0">
                <div className="break-words text-white">{item.title || item.category}</div>
                <div className="break-words text-xs text-slate-500">{getCategoryLabel(item.category)} · {item.note || '-'}</div>
              </div>
              <div className="text-slate-300">{item.quantity} x {formatCurrency(item.unitPrice)}đ</div>
              <div className="text-right font-mono text-white">{formatCurrency(item.totalAmount)}đ</div>
              <div className="text-right text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </article>
          ))}
          {!isLoading && visibleTransactions.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-400">Chưa có giao dịch trong kỳ báo cáo đang chọn.</div>
          ) : null}
        </div>
        <PaginationControls
          currentPage={Math.min(currentPage, totalPages)}
          totalPages={totalPages}
          totalItems={sortedTransactions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}

function TransactionBadge({ type }: { type: string }) {
  const config = type === 'INCOME'
    ? { label: 'Thu', className: 'bg-emerald-500/10 text-emerald-200' }
    : { label: 'Chi', className: 'bg-rose-500/10 text-rose-200' };
  return <span className={`inline-flex w-fit rounded-lg px-2 py-1 text-xs font-medium ${config.className}`}>{config.label}</span>;
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

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl border p-4 ${getMetricSurfaceTone(label)}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function getMetricSurfaceTone(label: string): string {
  if (label.includes('Doanh thu')) return 'border-emerald-300/20 bg-emerald-400/[0.08]';
  if (label.includes('Chi phí')) return 'border-rose-300/20 bg-rose-400/[0.08]';
  if (label.includes('Lợi nhuận')) return 'border-cyan-300/20 bg-cyan-400/[0.08]';
  return 'border-white/10 bg-white/[0.04]';
}
