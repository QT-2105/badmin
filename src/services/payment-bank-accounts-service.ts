import type { PaymentBankAccount } from '@/types/domain';

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || fallback);
  }
  return (await response.json()) as T;
}

export async function fetchPaymentBankAccounts(signal?: AbortSignal): Promise<PaymentBankAccount[]> {
  const response = await fetch('/api/settings/payment-bank-accounts', { cache: 'no-store', signal });
  const payload = await readJson<{ accounts: PaymentBankAccount[] }>(response, 'Không thể tải tài khoản thanh toán');
  return payload.accounts;
}

export async function createPaymentBankAccount(input: {
  accountName: string;
  bankName: string;
  qrImage: File;
}): Promise<PaymentBankAccount> {
  const formData = new FormData();
  formData.set('accountName', input.accountName);
  formData.set('bankName', input.bankName);
  formData.set('qrImage', input.qrImage);

  const response = await fetch('/api/settings/payment-bank-accounts', {
    method: 'POST',
    body: formData
  });
  const payload = await readJson<{ account: PaymentBankAccount }>(response, 'Không thể thêm tài khoản thanh toán');
  return payload.account;
}

export async function deletePaymentBankAccount(accountId: string): Promise<void> {
  const response = await fetch(`/api/settings/payment-bank-accounts/${accountId}`, { method: 'DELETE' });
  await readJson<{ ok: true }>(response, 'Không thể xóa tài khoản thanh toán');
}
