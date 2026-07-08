import type { SessionTransactionSummary } from '@/types/domain';

export async function fetchTransactions(params?: {
  period?: 'MONTH' | 'YEAR';
  month?: string;
  year?: string;
}, signal?: AbortSignal): Promise<SessionTransactionSummary[]> {
  const searchParams = new URLSearchParams();
  if (params?.period) searchParams.set('period', params.period);
  if (params?.month) searchParams.set('month', params.month);
  if (params?.year) searchParams.set('year', params.year);
  const query = searchParams.toString();
  const res = await fetch(`/api/finance/transactions${query ? `?${query}` : ''}`, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load transactions');
  const data = (await res.json()) as { transactions: SessionTransactionSummary[] };
  return data.transactions;
}

export async function createTransaction(payload: {
  sessionId?: string | null;
  transactionType: string;
  adjustmentType?: string;
  category: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  note?: string;
}): Promise<SessionTransactionSummary> {
  const res = await fetch('/api/finance/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || 'Failed to create transaction');
  }
  const data = (await res.json()) as { transaction: SessionTransactionSummary };
  return data.transaction;
}
