import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPaymentBankAccount,
  deletePaymentBankAccount,
  fetchPaymentBankAccounts
} from '@/services/payment-bank-accounts-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function usePaymentBankAccounts() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'settings', 'payment-bank-accounts'),
    queryFn: ({ signal }) => fetchPaymentBankAccounts(signal)
  });
}

export function usePaymentBankAccountMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'settings', 'payment-bank-accounts') });
    await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'settings', 'app') });
  };

  return {
    createAccount: useMutation({
      mutationFn: createPaymentBankAccount,
      onSuccess: invalidate
    }),
    deleteAccount: useMutation({
      mutationFn: deletePaymentBankAccount,
      onSuccess: invalidate
    })
  };
}
