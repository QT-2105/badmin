import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import type { SessionTransactionSummary } from '@/types/domain';

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function mapTransaction(row: {
  id: string;
  session_id: string | null;
  transaction_type: string;
  category: string;
  title: string | null;
  quantity: unknown;
  unit_price: unknown;
  total_amount: unknown;
  note: string | null;
  created_at: Date | null;
}): SessionTransactionSummary {
  return {
    id: row.id,
    sessionId: row.session_id,
    transactionType: row.transaction_type,
    category: row.category,
    title: row.title,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    totalAmount: toNumber(row.total_amount),
    note: row.note,
    createdAt: toIso(row.created_at)
  };
}

async function refreshSessionFinance(sessionId: string): Promise<void> {
  const rows = await prisma.session_transactions.findMany({ where: { session_id: sessionId } });
  const totals = rows.reduce(
    (acc, row) => {
      const amount = toNumber(row.total_amount);
      if (row.transaction_type === 'INCOME') acc.income += amount;
      if (row.transaction_type === 'EXPENSE') acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  await prisma.play_sessions.update({
    where: { id: sessionId },
    data: {
      total_income: totals.income,
      total_expense: totals.expense,
      total_profit: totals.income - totals.expense,
      updated_at: new Date()
    }
  });
}

export async function listSessionTransactions(options?: {
  sessionId?: string;
  from?: Date;
  to?: Date;
}): Promise<SessionTransactionSummary[]> {
  const rows = await prisma.session_transactions.findMany({
    where: {
      ...(options?.sessionId ? { session_id: options.sessionId } : {}),
      ...(options?.from || options?.to ? { created_at: { ...(options.from ? { gte: options.from } : {}), ...(options.to ? { lt: options.to } : {}) } } : {})
    },
    orderBy: [{ created_at: 'desc' }]
  });

  return rows.map(mapTransaction);
}

export async function createSessionTransaction(input: {
  sessionId?: string | null;
  transactionType: string;
  category: string;
  title?: string | null;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  note?: string | null;
}): Promise<SessionTransactionSummary> {
  const quantity = Number(input.quantity ?? 1);
  const unitPrice = Number(input.unitPrice ?? 0);
  const totalAmount = input.totalAmount === undefined ? quantity * unitPrice : Number(input.totalAmount);

  if (!['INCOME', 'EXPENSE'].includes(input.transactionType)) throw new AppError('Loại thu chi không hợp lệ.');
  if (!input.category?.trim()) throw new AppError('Vui lòng chọn phân loại thu chi.');
  if (!input.title?.trim()) throw new AppError('Vui lòng nhập tiêu đề phiếu thu chi.');
  if (!Number.isFinite(quantity) || quantity <= 0) throw new AppError('Số lượng phải lớn hơn 0.');
  if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new AppError('Đơn giá không được âm.');
  if (!Number.isFinite(totalAmount) || totalAmount < 0) throw new AppError('Tổng tiền không được âm.');

  const row = await prisma.session_transactions.create({
    data: {
      session_id: input.sessionId || null,
      transaction_type: input.transactionType,
      category: input.category,
      title: input.title?.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      note: input.note?.trim() || null
    }
  });

  if (input.sessionId) {
    await refreshSessionFinance(input.sessionId);
  }

  return mapTransaction(row);
}
