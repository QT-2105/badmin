import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { createSessionTransaction, listSessionTransactions } from '@/repositories/finance-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = getReportRange(searchParams);
  const transactions = await listSessionTransactions({
    sessionId: searchParams.get('sessionId') ?? undefined,
    from: range.from,
    to: range.to
  });
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload?.transactionType || !payload?.category) {
      return NextResponse.json({ error: 'Vui lòng chọn loại thu chi và phân loại.' }, { status: 400 });
    }
    const transaction = await createSessionTransaction({
      sessionId: payload.sessionId || null,
      transactionType: payload.transactionType,
      category: payload.category,
      title: payload.title,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      totalAmount: payload.totalAmount,
      note: payload.note
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Không thể tạo phiếu thu chi');
  }
}

function getReportRange(searchParams: URLSearchParams): { from?: Date; to?: Date } {
  const period = searchParams.get('period');
  if (period === 'YEAR') {
    const year = Number(searchParams.get('year'));
    if (!Number.isFinite(year)) return {};
    return { from: new Date(year, 0, 1), to: new Date(year + 1, 0, 1) };
  }

  const month = searchParams.get('month');
  if (!month) return {};
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) return {};
  return { from: new Date(year, monthNumber - 1, 1), to: new Date(year, monthNumber, 1) };
}
