import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPaymentBankAccount,
  deletePaymentBankAccount,
  fetchPaymentBankAccounts
} from '@/services/payment-bank-accounts-service';

export function usePaymentBankAccounts() {
  return useQuery({
    queryKey: ['settings', 'payment-bank-accounts'],
    queryFn: ({ signal }) => fetchPaymentBankAccounts(signal)
  });
}

export function usePaymentBankAccountMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['settings', 'payment-bank-accounts'] });
    await queryClient.invalidateQueries({ queryKey: ['settings', 'app'] });
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
