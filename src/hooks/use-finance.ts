import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTransaction, fetchTransactions } from '@/services/finance-service';

export function useTransactions(params?: {
  period?: 'MONTH' | 'YEAR';
  month?: string;
  year?: string;
}) {
  return useQuery({
    queryKey: ['finance', 'transactions', params],
    queryFn: ({ signal }) => fetchTransactions(params, signal)
  });
}

export function useFinanceMutations() {
  const queryClient = useQueryClient();
  return {
    createTransaction: useMutation({
      mutationFn: createTransaction,
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
          queryClient.invalidateQueries({ queryKey: ['schedule'] })
        ]);
      }
    })
  };
}
