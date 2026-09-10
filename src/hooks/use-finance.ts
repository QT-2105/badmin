import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTransaction, fetchTransactions } from '@/services/finance-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useTransactions(params?: {
  period?: 'MONTH' | 'YEAR';
  month?: string;
  year?: string;
}) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'finance', 'transactions', params),
    queryFn: ({ signal }) => fetchTransactions(params, signal)
  });
}

export function useFinanceMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  return {
    createTransaction: useMutation({
      mutationFn: createTransaction,
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'finance', 'transactions') }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'dashboard', 'summary') }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'schedule') })
        ]);
      }
    })
  };
}
