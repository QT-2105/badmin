import { NextResponse } from 'next/server';

import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { getDashboardSummary } from '@/repositories/dashboard-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'dashboard.view');
    const { searchParams } = new URL(request.url);
    const summary = await getDashboardSummary({
      period: searchParams.get('period') === 'YEAR' ? 'YEAR' : 'MONTH',
      month: searchParams.get('month'),
      year: searchParams.get('year')
    });
    return NextResponse.json({ summary });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: 'Không thể tải dashboard' }, { status: 500 });
  }
}
