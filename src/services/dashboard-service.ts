import type { DashboardSummary } from '@/types/domain';

export async function fetchDashboardSummary(params: { period?: 'MONTH' | 'YEAR'; month?: string; year?: string } = {}, signal?: AbortSignal): Promise<DashboardSummary> {
  const query = new URLSearchParams();
  if (params.period) query.set('period', params.period);
  if (params.month) query.set('month', params.month);
  if (params.year) query.set('year', params.year);
  const res = await fetch(`/api/dashboard/summary${query.size ? `?${query}` : ''}`, { signal, cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load dashboard summary');
  }

  const data = (await res.json()) as { summary: DashboardSummary };
  return data.summary;
}
