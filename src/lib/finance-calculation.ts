export type TransactionAdjustmentType = 'NORMAL' | 'DEDUCTION';

export type FinanceTransactionForTotals = {
  transactionType: string;
  adjustmentType?: string | null;
  totalAmount: number;
};

export function normalizeAdjustmentType(value: string | null | undefined): TransactionAdjustmentType {
  return value === 'DEDUCTION' ? 'DEDUCTION' : 'NORMAL';
}

export function getSignedAmount(totalAmount: unknown, adjustmentType?: string | null): number {
  const amount = Number(totalAmount ?? 0);
  return normalizeAdjustmentType(adjustmentType) === 'DEDUCTION' ? -amount : amount;
}

export function getFinanceTotals(transactions: FinanceTransactionForTotals[]): { income: number; expense: number } {
  return transactions.reduce(
    (acc, transaction) => {
      const signedAmount = getSignedAmount(transaction.totalAmount, transaction.adjustmentType);
      if (transaction.transactionType === 'INCOME') acc.income += signedAmount;
      if (transaction.transactionType === 'EXPENSE') acc.expense += signedAmount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
}
