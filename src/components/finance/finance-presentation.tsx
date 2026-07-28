'use client';

import type { FormEvent } from 'react';
import { ChevronDown, ChevronUp, CircleDollarSign, Loader2, Plus, TrendingDown, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn, type DataTableState } from '@/components/ui/data-table';
import { SuccessState, WarningState } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/form';
import { PageFeedbackStack, PageHeader, PageShell, PageSummaryGrid, SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/date-format';
import { getSignedAmount, normalizeAdjustmentType } from '@/lib/finance-calculation';
import type { SessionTransactionSummary } from '@/types/domain';

export type ReportPeriod = 'MONTH' | 'YEAR';
export type TransactionSort = 'NEWEST' | 'OLDEST';
export type FinanceTone = 'success' | 'danger' | 'neutral';

export type FinanceTransactionForm = {
  transactionType: string;
  adjustmentType: string;
  category: string;
  title: string;
  note: string;
  quantity: number;
  unitPrice: number;
};

type FinancePageViewProps = {
  canWriteFinance: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRefetch: () => void;
  reportPeriod: ReportPeriod;
  reportMonth: string;
  reportYear: string;
  onReportPeriodChange: (value: ReportPeriod) => void;
  onReportMonthChange: (value: string) => void;
  onReportYearChange: (value: string) => void;
  totals: {
    income: number;
    expense: number;
  };
  profit: number;
  profitTone: FinanceTone;
  summarySub: string;
  selectedPeriodLabel: string;
  isFormOpen: boolean;
  onFormOpenChange: (value: boolean) => void;
  form: FinanceTransactionForm;
  onFormChange: (patch: Partial<FinanceTransactionForm>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isCreatePending: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  titleError: boolean;
  sortBy: TransactionSort;
  onSortByChange: (value: TransactionSort) => void;
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  visibleTransactions: SessionTransactionSummary[];
  onPageChange: (page: number) => void;
};

const manualCategories = [
  { value: 'COURT_FEE', label: 'Sân' },
  { value: 'SHUTTLECOCK', label: 'Cầu' },
  { value: 'SESSION_FEE', label: 'Slot' },
  { value: 'OTHER', label: 'Khác' }
] as const;

const transactionColumns: DataTableColumn<SessionTransactionSummary>[] = [
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
      <span className="font-mono tabular-nums text-muted-foreground">
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
      <span className={`font-mono font-semibold tabular-nums ${getTransactionAmountClass(item.transactionType, item.totalAmount, item.adjustmentType)}`}>
        {formatSignedCurrency(item.totalAmount, item.adjustmentType)}
      </span>
    )
  },
  {
    key: 'createdAt',
    header: 'Thời gian',
    align: 'right',
    width: '170px',
    render: (item) => <span className="text-xs tabular-nums text-muted-foreground">{formatTransactionDate(item.createdAt)}</span>
  }
];

export function FinancePageView({
  canWriteFinance,
  isLoading,
  hasError,
  onRefetch,
  reportPeriod,
  reportMonth,
  reportYear,
  onReportPeriodChange,
  onReportMonthChange,
  onReportYearChange,
  totals,
  profit,
  profitTone,
  summarySub,
  selectedPeriodLabel,
  isFormOpen,
  onFormOpenChange,
  form,
  onFormChange,
  onSubmit,
  isCreatePending,
  actionError,
  actionSuccess,
  titleError,
  sortBy,
  onSortByChange,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  totalItems,
  visibleTransactions,
  onPageChange
}: FinancePageViewProps) {
  const transactionLoadingState: DataTableState = {
    title: 'Đang tải giao dịch',
    description: `Đang lấy dữ liệu thu chi cho ${selectedPeriodLabel}.`
  };
  const transactionErrorState: DataTableState = {
    title: 'Không thể tải dữ liệu thu chi',
    description: 'Vui lòng kiểm tra kết nối và thử tải lại danh sách.',
    action: (
      <Button type="button" variant="secondary" size="sm" onClick={onRefetch}>
        Tải lại
      </Button>
    )
  };
  const transactionEmptyState: DataTableState = {
    title: 'Không có dữ liệu trong kỳ báo cáo',
    description: `Chưa có phiếu thu chi nào được ghi nhận trong ${selectedPeriodLabel}.`
  };
  return (
    <PageShell className="gap-4 md:gap-5">
      <FinanceHeader />

      <FinanceReportFilter
        reportPeriod={reportPeriod}
        reportMonth={reportMonth}
        reportYear={reportYear}
        onReportPeriodChange={onReportPeriodChange}
        onReportMonthChange={onReportMonthChange}
        onReportYearChange={onReportYearChange}
      />

      <FinanceSummary
        isLoading={isLoading}
        totals={totals}
        profit={profit}
        profitTone={profitTone}
        summarySub={summarySub}
      />

      {canWriteFinance ? (
        <FinanceCreateSection
          isOpen={isFormOpen}
          onOpenChange={onFormOpenChange}
          form={form}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          isCreatePending={isCreatePending}
          titleError={titleError}
        />
      ) : null}

      <FinanceFeedback actionError={actionError} actionSuccess={actionSuccess} />

      <FinanceTransactionsSection
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        visibleTransactions={visibleTransactions}
        transactionColumns={transactionColumns}
        isLoading={isLoading}
        hasError={hasError}
        loadingState={transactionLoadingState}
        errorState={transactionErrorState}
        emptyState={transactionEmptyState}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </PageShell>
  );
}

function FinanceHeader() {
  return (
    <PageHeader
      eyebrow="Thu chi vận hành"
      title="Thu chi"
      description="Theo dõi thu, chi và lợi nhuận theo kỳ báo cáo; đối soát phiếu tự sinh từ ca và phiếu nhập tay."
    />
  );
}

function FinanceReportFilter({
  reportPeriod,
  reportMonth,
  reportYear,
  onReportPeriodChange,
  onReportMonthChange,
  onReportYearChange
}: Pick<FinancePageViewProps, 'reportPeriod' | 'reportMonth' | 'reportYear' | 'onReportPeriodChange' | 'onReportMonthChange' | 'onReportYearChange'>) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h2 className="text-card-title">Kỳ báo cáo</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{formatReportPeriodLabel(reportPeriod, reportMonth, reportYear)}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Select
            aria-label="Chọn kỳ báo cáo"
            value={reportPeriod}
            onChange={(event) => onReportPeriodChange(event.target.value as ReportPeriod)}
            className={`${compactFormInputClass} w-full sm:w-36`}
          >
            <option value="MONTH">Theo tháng</option>
            <option value="YEAR">Theo năm</option>
          </Select>
          {reportPeriod === 'MONTH' ? (
            <Input
              aria-label="Chọn tháng báo cáo"
              type="month"
              value={reportMonth}
              onChange={(event) => onReportMonthChange(event.target.value)}
              className={`${compactFormInputClass} w-full sm:w-40`}
            />
          ) : (
            <Input
              aria-label="Nhập năm báo cáo"
              type="number"
              min={2000}
              max={2100}
              value={reportYear}
              onChange={(event) => onReportYearChange(event.target.value)}
              className={`${compactFormInputClass} w-full sm:w-28`}
            />
          )}
      </div>
    </section>
  );
}

function formatReportPeriodLabel(reportPeriod: ReportPeriod, reportMonth: string, reportYear: string): string {
  if (reportPeriod === 'YEAR') return `Năm ${reportYear}`;

  const [year, month] = reportMonth.split('-');
  if (!year || !month) return 'Mặc định tháng hiện tại';

  return `Tháng ${month}/${year}`;
}

function FinanceSummary({
  isLoading,
  totals,
  profit,
  profitTone,
  summarySub
}: Pick<FinancePageViewProps, 'isLoading' | 'totals' | 'profit' | 'profitTone' | 'summarySub'>) {
  return (
    <PageSummaryGrid className="sm:grid-cols-2 lg:grid-cols-3" aria-busy={isLoading}>
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
        sub={`${summarySub} · chi phí vận hành`}
        tone="expense"
        density="compact"
      />
      <StatCard
        icon={CircleDollarSign}
        label="Lợi nhuận"
        value={`${formatCurrency(profit)}đ`}
        sub={summarySub}
        tone={profit > 0 ? 'primary' : profitTone}
        density="compact"
        className="sm:col-span-2 lg:col-span-1"
      />
    </PageSummaryGrid>
  );
}

function FinanceCreateSection({
  isOpen,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isCreatePending,
  titleError
}: {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  form: FinanceTransactionForm;
  onFormChange: (patch: Partial<FinanceTransactionForm>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isCreatePending: boolean;
  titleError: boolean;
}) {
  return (
    <SectionCard
      title="Tạo phiếu thu chi"
      description="Nhập phiếu vận hành thủ công; hệ thống giữ nguyên loại, phân loại, số lượng và đơn giá khi ghi nhận."
      density="compact"
      actions={(
        <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(!isOpen)} className="h-10 w-full whitespace-nowrap sm:w-auto">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isOpen ? 'Thu gọn' : 'Mở rộng'}
        </Button>
      )}
    >
      {isOpen ? (
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-surface-muted p-3 md:p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_112px_164px_136px_92px_136px] lg:items-start">
            <label className="block md:col-span-2 lg:col-span-1">
              <span className={formLabelClass}>Tiêu đề</span>
              <Input
                required
                value={form.title}
                onChange={(event) => onFormChange({ title: event.target.value })}
                className={formInputClass}
                placeholder="VD: Thu slot vãng lai"
                aria-invalid={titleError || undefined}
                aria-describedby={titleError ? 'finance-action-error' : undefined}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>Loại</span>
              <Select value={form.transactionType} onChange={(event) => onFormChange({ transactionType: event.target.value })} className={formInputClass}>
                <option value="INCOME">Thu</option>
                <option value="EXPENSE">Chi</option>
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Kiểu ghi nhận</span>
              <Select value={form.adjustmentType} onChange={(event) => onFormChange({ adjustmentType: event.target.value })} className={formInputClass}>
                <option value="NORMAL">Ghi nhận thường</option>
                <option value="DEDUCTION">{form.transactionType === 'INCOME' ? 'Điều chỉnh giảm thu' : 'Điều chỉnh giảm chi'}</option>
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Phân Loại</span>
              <Select value={form.category} onChange={(event) => onFormChange({ category: event.target.value })} className={formInputClass}>
                {manualCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Số lượng</span>
              <Input type="number" min={1} inputMode="numeric" value={form.quantity} onChange={(event) => onFormChange({ quantity: Number(event.target.value) })} className={formInputClass} />
            </label>
            <label className="block">
              <span className={formLabelClass}>Đơn giá</span>
              <span className="relative block">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={form.unitPrice}
                  onChange={(event) => onFormChange({ unitPrice: Number(event.target.value) })}
                  className={`${formInputClass} pr-10`}
                  aria-label="Đơn giá, đơn vị Việt Nam đồng"
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-3 top-[53%] -translate-y-1/2 text-[11px] font-semibold leading-none text-muted-foreground">
                  .vnđ
                </span>
              </span>
            </label>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_150px] lg:items-end">
            <label className="block">
              <span className={formLabelClass}>Ghi chú</span>
              <Input value={form.note} onChange={(event) => onFormChange({ note: event.target.value })} className={formInputClass} placeholder="Thông tin đối soát nội bộ nếu có" />
            </label>
            <Button type="submit" disabled={isCreatePending} className="h-11 w-full whitespace-nowrap lg:w-[150px]">
              {isCreatePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ghi phiếu
            </Button>
          </div>
        </form>
      ) : null}
    </SectionCard>
  );
}

function FinanceFeedback({ actionError, actionSuccess }: Pick<FinancePageViewProps, 'actionError' | 'actionSuccess'>) {
  if (!actionError && !actionSuccess) return null;

  return (
    <PageFeedbackStack>
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
    </PageFeedbackStack>
  );
}

function FinanceTransactionsSection({
  sortBy,
  onSortByChange,
  pageSize,
  onPageSizeChange,
  visibleTransactions,
  transactionColumns,
  isLoading,
  hasError,
  loadingState,
  errorState,
  emptyState,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: {
  sortBy: TransactionSort;
  onSortByChange: (value: TransactionSort) => void;
  pageSize: PageSize;
  onPageSizeChange: (value: PageSize) => void;
  visibleTransactions: SessionTransactionSummary[];
  transactionColumns: DataTableColumn<SessionTransactionSummary>[];
  isLoading: boolean;
  hasError: boolean;
  loadingState: DataTableState;
  errorState: DataTableState;
  emptyState: DataTableState;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <SectionCard
      title="Danh sách thu chi"
      description="Danh sách đang hiển thị theo kỳ báo cáo đã chọn; dùng sắp xếp mới nhất hoặc cũ nhất để đối soát nhanh."
      density="compact"
      actions={(
        <>
          <Select value={sortBy} onChange={(event) => onSortByChange(event.target.value as TransactionSort)} className={`${compactFormInputClass} w-full sm:w-40`}>
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </Select>
          <Select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)} className={`${compactFormInputClass} w-full sm:w-32`}>
            {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </Select>
        </>
      )}
    >
      <DataTable
        aria-label="Danh sách thu chi"
        caption="Danh sách thu chi"
        rows={visibleTransactions}
        columns={transactionColumns}
        getRowKey={(item) => item.id}
        loading={isLoading}
        error={hasError}
        loadingState={loadingState}
        errorState={errorState}
        emptyState={emptyState}
        density="compact"
        minWidth="880px"
        mobileRenderer={(item) => (
          <FinanceTransactionMobileCard item={item} />
        )}
        pagination={(
          <PaginationControls
            currentPage={Math.min(currentPage, totalPages)}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            compact
          />
        )}
        responsiveMode="cards"
        rowLabel={(item) => `Phiếu thu chi ${item.title || item.category}`}
        stickyHeader
      />
    </SectionCard>
  );
}

function FinanceTransactionMobileCard({ item }: { item: SessionTransactionSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <TransactionBadge type={item.transactionType} adjustmentType={item.adjustmentType} />
        <span className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${getTransactionAmountClass(item.transactionType, item.totalAmount, item.adjustmentType)}`}>
          {formatSignedCurrency(item.totalAmount, item.adjustmentType)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="break-words font-semibold leading-5 text-foreground">{item.title || item.category}</div>
        <div className="mt-1 break-words text-xs leading-5 text-muted-foreground">{getCategoryLabel(item.category)} · {item.note || '-'}</div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">SL x Đơn giá</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-foreground">{item.quantity} x {formatCurrency(item.unitPrice)}đ</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-2">
          <dt className="text-muted-foreground">Thời gian</dt>
          <dd className="mt-1 text-right font-medium tabular-nums text-foreground">{formatTransactionDate(item.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

type TransactionVisualTone = 'success' | 'warning' | 'info' | 'expense';

function getTransactionVisualTone(type: string, adjustmentType?: string | null): TransactionVisualTone {
  const isDeduction = normalizeAdjustmentType(adjustmentType) === 'DEDUCTION';
  if (type === 'INCOME') return isDeduction ? 'warning' : 'success';
  return isDeduction ? 'info' : 'expense';
}

function TransactionBadge({ type, adjustmentType }: { type: string; adjustmentType?: string | null }) {
  const tone = getTransactionVisualTone(type, adjustmentType);
  const config = {
    success: { label: 'Thu', tone },
    warning: { label: 'Giảm thu', tone },
    info: { label: 'Giảm chi', tone },
    expense: { label: 'Chi', tone }
  }[tone];
  return <StatusBadge tone={config.tone} className="w-fit rounded-lg">{config.label}</StatusBadge>;
}

function getTransactionAmountClass(type: string, amount: number, adjustmentType?: string | null): string {
  const signedAmount = getSignedAmount(amount, adjustmentType);
  if (signedAmount === 0) return 'text-muted-foreground';

  const tone = getTransactionVisualTone(type, adjustmentType);
  if (tone === 'success') return 'text-success-foreground';
  if (tone === 'warning') return 'text-warning-foreground';
  if (tone === 'info') return 'text-info-foreground';
  return 'text-danger-foreground';
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

function formatTransactionDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}
