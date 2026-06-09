import { useQuery } from '@tanstack/react-query';

import { fetchDashboardSummary } from '@/services/dashboard-service';

export function useDashboardSummary(params: { period?: 'MONTH' | 'YEAR'; month?: string; year?: string } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'summary', params],
    queryFn: ({ signal }) => fetchDashboardSummary(params, signal)
  });
}
