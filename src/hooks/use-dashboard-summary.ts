import { useQuery } from '@tanstack/react-query';

import { fetchDashboardSummary } from '@/services/dashboard-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useDashboardSummary(params: { period?: 'MONTH' | 'YEAR'; month?: string; year?: string } = {}) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'dashboard', 'summary', params),
    queryFn: ({ signal }) => fetchDashboardSummary(params, signal)
  });
}
