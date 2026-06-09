import { NextResponse } from 'next/server';

import { getDashboardSummary } from '@/repositories/dashboard-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const summary = await getDashboardSummary({
    period: searchParams.get('period') === 'YEAR' ? 'YEAR' : 'MONTH',
    month: searchParams.get('month'),
    year: searchParams.get('year')
  });
  return NextResponse.json({ summary });
}
