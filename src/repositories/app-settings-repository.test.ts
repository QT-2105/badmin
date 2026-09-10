import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  settingsFindFirst: vi.fn(),
  settingsUpdate: vi.fn(),
  settingsCreate: vi.fn(),
  accountFindFirst: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    app_settings: {
      findFirst: mocks.settingsFindFirst,
      update: mocks.settingsUpdate,
      create: mocks.settingsCreate
    },
    payment_bank_accounts: { findFirst: mocks.accountFindFirst }
  }
}));

import { getAppSettings, updateAppSettings } from './app-settings-repository';

function settingsRow(overrides: Record<string, unknown> = {}) {
  return {
    max_court_count_per_session: 3,
    auto_create_court_fee_transaction: false,
    auto_create_shuttlecock_usage_transaction: true,
    default_payment_bank_account_id: null,
    ...overrides
  };
}

describe('app settings repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns operational defaults when the singleton row does not exist', async () => {
    mocks.settingsFindFirst.mockResolvedValue(null);

    await expect(getAppSettings()).resolves.toEqual({
      autoCreateCourtFeeTransaction: false,
      autoCreateShuttlecockUsageTransaction: true,
      maxCourtCountPerSession: 3,
      defaultPaymentBankAccountId: null
    });
    expect(mocks.settingsFindFirst).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
  });

  it('normalizes persisted max courts and optional account id', async () => {
    mocks.settingsFindFirst.mockResolvedValue(settingsRow({
      max_court_count_per_session: 99,
      default_payment_bank_account_id: ' account-1 '
    }));

    await expect(getAppSettings()).resolves.toMatchObject({
      maxCourtCountPerSession: 12,
      defaultPaymentBankAccountId: 'account-1'
    });
  });

  it('rejects an inactive or missing default payment account', async () => {
    mocks.accountFindFirst.mockResolvedValue(null);

    await expect(updateAppSettings({ defaultPaymentBankAccountId: 'account-missing' })).rejects.toMatchObject({
      message: 'Tài khoản thanh toán mặc định không hợp lệ.'
    });
    expect(mocks.accountFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'account-missing',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        active: true
      },
      select: { id: true }
    });
    expect(mocks.settingsUpdate).not.toHaveBeenCalled();
  });

  it('upserts normalized operational settings into the singleton row', async () => {
    mocks.accountFindFirst.mockResolvedValue({ id: 'account-1' });
    mocks.settingsFindFirst.mockResolvedValue({ id: 'default' });
    mocks.settingsUpdate.mockResolvedValue(settingsRow({
      max_court_count_per_session: 12,
      auto_create_court_fee_transaction: true,
      auto_create_shuttlecock_usage_transaction: false,
      default_payment_bank_account_id: 'account-1'
    }));

    await expect(updateAppSettings({
      maxCourtCountPerSession: 20,
      autoCreateCourtFeeTransaction: true,
      autoCreateShuttlecockUsageTransaction: false,
      defaultPaymentBankAccountId: ' account-1 '
    })).resolves.toEqual({
      maxCourtCountPerSession: 12,
      autoCreateCourtFeeTransaction: true,
      autoCreateShuttlecockUsageTransaction: false,
      defaultPaymentBankAccountId: 'account-1'
    });
    expect(mocks.settingsUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: expect.objectContaining({
        max_court_count_per_session: 12,
        default_payment_bank_account_id: 'account-1'
      })
    }));
  });
});
