'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import type { PageSize } from '@/components/ui/pagination-controls';
import { useCurrentUser } from '@/hooks/use-auth';
import { useTransactions, useFinanceMutations } from '@/hooks/use-finance';
import { hasPermission } from '@/lib/auth/permissions';
import { getFinanceTotals } from '@/lib/finance-calculation';

import {
  FinancePageView,
  type FinanceTone,
  type FinanceTransactionForm,
  type ReportPeriod,
  type TransactionSort
} from './finance-presentation';

const today = new Date();
const emptyTransactionForm: FinanceTransactionForm = {
  transactionType: 'INCOME',
  adjustmentType: 'NORMAL',
  category: 'SHUTTLECOCK',
  title: '',
  note: '',
  quantity: 1,
  unitPrice: 0
};

export function FinancePageClient() {
  const { data: currentUser } = useCurrentUser();
  const { createTransaction } = useFinanceMutations();
  const canWriteFinance = hasPermission(currentUser ?? null, 'finance.manage');
  const [transactionForm, setTransactionForm] = useState<FinanceTransactionForm>(emptyTransactionForm);
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!transactionForm.title.trim()) {
      setActionError('Vui lòng nhập tiêu đề phiếu thu chi.');
      return;
    }
    try {
      await createTransaction.mutateAsync({
        transactionType: transactionForm.transactionType,
        adjustmentType: transactionForm.adjustmentType,
        category: transactionForm.category,
        title: transactionForm.title,
        quantity: transactionForm.quantity,
        unitPrice: transactionForm.unitPrice,
        note: transactionForm.note
      });
      setTransactionForm((current) => ({
        ...current,
        title: '',
        note: '',
        unitPrice: 0
      }));
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
  const profitTone: FinanceTone = profit > 0 ? 'success' : profit < 0 ? 'danger' : 'neutral';
  const summarySub = isLoading ? 'Đang tải dữ liệu...' : `${reportTransactions.length} phiếu trong kỳ`;
  const selectedPeriodLabel = reportPeriod === 'MONTH' ? `tháng ${reportMonth}` : `năm ${reportYear}`;

  return (
    <FinancePageView
      canWriteFinance={canWriteFinance}
      isLoading={isLoading}
      hasError={Boolean(error)}
      onRefetch={() => void refetch()}
      reportPeriod={reportPeriod}
      reportMonth={reportMonth}
      reportYear={reportYear}
      onReportPeriodChange={setReportPeriod}
      onReportMonthChange={setReportMonth}
      onReportYearChange={setReportYear}
      totals={totals}
      profit={profit}
      profitTone={profitTone}
      summarySub={summarySub}
      selectedPeriodLabel={selectedPeriodLabel}
      isFormOpen={isFormOpen}
      onFormOpenChange={setIsFormOpen}
      form={transactionForm}
      onFormChange={(patch) => setTransactionForm((current) => ({ ...current, ...patch }))}
      onSubmit={submit}
      isCreatePending={createTransaction.isPending}
      actionError={actionError}
      actionSuccess={actionSuccess}
      titleError={titleError}
      sortBy={sortBy}
      onSortByChange={setSortBy}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={sortedTransactions.length}
      visibleTransactions={visibleTransactions}
      onPageChange={setCurrentPage}
    />
  );
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

function getFinanceActionErrorMessage(caught: unknown): string {
  if (!(caught instanceof Error)) return 'Không thể ghi phiếu thu chi. Vui lòng thử lại.';
  if (caught.message === 'Failed to create transaction') return 'Không thể ghi phiếu thu chi. Vui lòng thử lại.';
  return caught.message;
}
