import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  createAccount: vi.fn(),
  deleteAccountMany: vi.fn(),
  settingsFindFirst: vi.fn(),
  settingsCreate: vi.fn(),
  settingsUpdateMany: vi.fn(),
  createTenantImageKey: vi.fn(),
  uploadS3Object: vi.fn(),
  deleteS3Object: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment_bank_accounts: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
      create: mocks.createAccount,
      deleteMany: mocks.deleteAccountMany
    },
    app_settings: {
      findFirst: mocks.settingsFindFirst,
      create: mocks.settingsCreate,
      updateMany: mocks.settingsUpdateMany
    }
  }
}));
vi.mock('@/lib/s3-storage', () => ({
  createTenantImageKey: mocks.createTenantImageKey,
  uploadS3Object: mocks.uploadS3Object,
  deleteS3Object: mocks.deleteS3Object
}));

import {
  createPaymentBankAccount,
  deletePaymentBankAccount,
  listPaymentBankAccounts
} from './payment-bank-accounts-repository';

function accountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'account-1',
    account_name: 'CLB Badmin',
    bank_name: 'VCB',
    qr_s3_key: 'config/payment-qr/new.webp',
    qr_url: 'https://cdn.example/new.webp',
    display_order: 2,
    active: true,
    created_at: new Date('2099-01-01T00:00:00.000Z'),
    updated_at: null,
    ...overrides
  };
}

describe('payment bank accounts repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createTenantImageKey.mockReturnValue('config/payment-qr/new.webp');
    mocks.uploadS3Object.mockResolvedValue({
      key: 'config/payment-qr/new.webp', publicUrl: 'https://cdn.example/new.webp'
    });
    mocks.deleteS3Object.mockResolvedValue(undefined);
  });

  it('lists active accounts in configured display order', async () => {
    mocks.findMany.mockResolvedValue([accountRow()]);

    await expect(listPaymentBankAccounts({ activeOnly: true })).resolves.toEqual([
      expect.objectContaining({ id: 'account-1', accountName: 'CLB Badmin', displayOrder: 2 })
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f', active: true },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }, { id: 'asc' }]
    });
  });

  it('validates required account fields before uploading QR data', async () => {
    const image = { buffer: Buffer.from('qr'), contentType: 'image/webp', fileName: 'qr.webp' };
    await expect(createPaymentBankAccount({ accountName: ' ', bankName: 'VCB', qrImage: image })).rejects.toMatchObject({
      message: 'Vui lòng nhập tên tài khoản.'
    });
    await expect(createPaymentBankAccount({ accountName: 'CLB', bankName: ' ', qrImage: image })).rejects.toMatchObject({
      message: 'Vui lòng nhập tên ngân hàng.'
    });
    expect(mocks.uploadS3Object).not.toHaveBeenCalled();
  });

  it('uploads QR, appends display order, and initializes the default account', async () => {
    mocks.findFirst.mockResolvedValue({ display_order: 1 });
    mocks.createAccount.mockResolvedValue(accountRow());
    mocks.settingsFindFirst.mockResolvedValue({ id: 'default', default_payment_bank_account_id: null });

    await createPaymentBankAccount({
      accountName: '  CLB Badmin  ',
      bankName: '  VCB  ',
      qrImage: { buffer: Buffer.from('qr'), contentType: 'image/webp', fileName: 'qr.webp' }
    });

    expect(mocks.createTenantImageKey).toHaveBeenCalledWith(
      'aa1f1aa3-c438-4498-96e9-ab228cd51f4f', 'config/payment-qr', 'qr.webp'
    );

    expect(mocks.uploadS3Object).toHaveBeenCalledWith({
      key: 'config/payment-qr/new.webp',
      body: Buffer.from('qr'),
      contentType: 'image/webp'
    });
    expect(mocks.createAccount).toHaveBeenCalledWith({
      data: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        account_name: 'CLB Badmin',
        bank_name: 'VCB',
        qr_s3_key: 'config/payment-qr/new.webp',
        qr_url: 'https://cdn.example/new.webp',
        display_order: 2
      }
    });
    expect(mocks.settingsUpdateMany).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: { default_payment_bank_account_id: 'account-1', updated_at: expect.any(Date) }
    });
  });

  it('deletes an uploaded QR object when account persistence fails', async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.createAccount.mockRejectedValue(new Error('DB failed'));

    await expect(createPaymentBankAccount({
      accountName: 'CLB',
      bankName: 'VCB',
      qrImage: { buffer: Buffer.from('qr'), contentType: 'image/webp', fileName: 'qr.webp' }
    })).rejects.toThrow('DB failed');
    expect(mocks.deleteS3Object).toHaveBeenCalledWith('config/payment-qr/new.webp');
  });

  it('clears a deleted default account and treats QR cleanup as best effort', async () => {
    mocks.findFirst.mockResolvedValue(accountRow());
    mocks.deleteAccountMany.mockResolvedValue({ count: 1 });
    mocks.settingsUpdateMany.mockResolvedValue({ count: 1 });
    mocks.deleteS3Object.mockRejectedValue(new Error('S3 unavailable'));

    await expect(deletePaymentBankAccount('account-1')).resolves.toBeUndefined();
    expect(mocks.settingsUpdateMany).toHaveBeenCalledWith({
      where: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        default_payment_bank_account_id: 'account-1'
      },
      data: { default_payment_bank_account_id: null, updated_at: expect.any(Date) }
    });
    expect(mocks.deleteS3Object).toHaveBeenCalledWith('config/payment-qr/new.webp');
  });
});
