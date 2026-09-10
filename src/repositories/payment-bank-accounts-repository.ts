import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import { createTenantImageKey, deleteS3Object, uploadS3Object } from '@/lib/s3-storage';
import type { PaymentBankAccount } from '@/types/domain';
import { requireTenantContext } from '@/lib/tenant-context';

function mapPaymentBankAccount(row: {
  id: string;
  account_name: string;
  bank_name: string;
  qr_s3_key: string;
  qr_url: string;
  display_order: number;
  active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}): PaymentBankAccount {
  return {
    id: row.id,
    accountName: row.account_name,
    bankName: row.bank_name,
    qrS3Key: row.qr_s3_key,
    qrUrl: row.qr_url,
    displayOrder: row.display_order,
    active: row.active,
    createdAt: row.created_at?.toISOString() ?? null,
    updatedAt: row.updated_at?.toISOString() ?? null
  };
}

export async function listPaymentBankAccounts(options: { activeOnly?: boolean } = {}): Promise<PaymentBankAccount[]> {
  const { clubId } = requireTenantContext('payment_bank_account.list');
  const rows = await prisma.payment_bank_accounts.findMany({
    where: { club_id: clubId, ...(options.activeOnly ? { active: true } : {}) },
    orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }, { id: 'asc' }]
  });
  return rows.map(mapPaymentBankAccount);
}

export async function createPaymentBankAccount(input: {
  accountName: string;
  bankName: string;
  qrImage: { buffer: Buffer; contentType: string; fileName: string };
}): Promise<PaymentBankAccount> {
  const { clubId } = requireTenantContext('payment_bank_account.create');
  const accountName = input.accountName.trim();
  const bankName = input.bankName.trim();
  if (!accountName) throw new AppError('Vui lòng nhập tên tài khoản.');
  if (!bankName) throw new AppError('Vui lòng nhập tên ngân hàng.');

  const lastAccount = await prisma.payment_bank_accounts.findFirst({
    where: { club_id: clubId },
    orderBy: { display_order: 'desc' },
    select: { display_order: true }
  });
  const uploaded = await uploadS3Object({
    key: createTenantImageKey(clubId, 'config/payment-qr', input.qrImage.fileName),
    body: input.qrImage.buffer,
    contentType: input.qrImage.contentType
  });

  try {
    const row = await prisma.payment_bank_accounts.create({
      data: {
        club_id: clubId,
        account_name: accountName,
        bank_name: bankName,
        qr_s3_key: uploaded.key,
        qr_url: uploaded.publicUrl,
        display_order: (lastAccount?.display_order ?? 0) + 1
      }
    });
    const currentSettings = await prisma.app_settings.findFirst({ where: { club_id: clubId } });
    const settings = currentSettings ?? await prisma.app_settings.create({
      data: {
        id: clubId,
        club_id: clubId,
        club_name: 'Badmin',
        default_payment_bank_account_id: row.id
      }
    });
    if (!settings.default_payment_bank_account_id) {
      await prisma.app_settings.updateMany({
        where: { club_id: clubId },
        data: { default_payment_bank_account_id: row.id, updated_at: new Date() }
      });
    }
    return mapPaymentBankAccount(row);
  } catch (error) {
    await deleteS3Object(uploaded.key).catch(() => undefined);
    throw error;
  }
}

export async function deletePaymentBankAccount(accountId: string): Promise<void> {
  const { clubId } = requireTenantContext('payment_bank_account.delete');
  const row = await prisma.payment_bank_accounts.findFirst({ where: { id: accountId, club_id: clubId } });
  if (!row) throw new AppError('Không tìm thấy tài khoản thanh toán.', 404);
  await prisma.payment_bank_accounts.deleteMany({ where: { id: accountId, club_id: clubId } });
  await prisma.app_settings.updateMany({
    where: { club_id: clubId, default_payment_bank_account_id: accountId },
    data: { default_payment_bank_account_id: null, updated_at: new Date() }
  });
  await deleteS3Object(row.qr_s3_key).catch(() => undefined);
}
