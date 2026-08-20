import { AppError } from '@/lib/app-error';
import { defaultAppSettings, normalizeMaxCourtCount, normalizeOptionalId, type AppSettings } from '@/lib/app-settings';
import { prisma } from '@/lib/prisma';

const DEFAULT_ID = 'default';

type AppSettingsRow = {
  max_court_count_per_session: number;
  auto_create_court_fee_transaction: boolean;
  auto_create_shuttlecock_usage_transaction: boolean;
  default_payment_bank_account_id: string | null;
};

function mapAppSettings(row: AppSettingsRow | null): AppSettings {
  return {
    autoCreateCourtFeeTransaction: row?.auto_create_court_fee_transaction ?? defaultAppSettings.autoCreateCourtFeeTransaction,
    autoCreateShuttlecockUsageTransaction: row?.auto_create_shuttlecock_usage_transaction ?? defaultAppSettings.autoCreateShuttlecockUsageTransaction,
    maxCourtCountPerSession: normalizeMaxCourtCount(row?.max_court_count_per_session ?? defaultAppSettings.maxCourtCountPerSession),
    defaultPaymentBankAccountId: normalizeOptionalId(row?.default_payment_bank_account_id)
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  const row = await prisma.app_settings.findUnique({ where: { id: DEFAULT_ID } });
  return mapAppSettings(row);
}

export async function updateAppSettings(input: Partial<AppSettings>): Promise<AppSettings> {
  const defaultPaymentBankAccountId = input.defaultPaymentBankAccountId === undefined
    ? undefined
    : normalizeOptionalId(input.defaultPaymentBankAccountId);

  if (defaultPaymentBankAccountId) {
    const account = await prisma.payment_bank_accounts.findFirst({
      where: { id: defaultPaymentBankAccountId, active: true },
      select: { id: true }
    });
    if (!account) throw new AppError('Tài khoản thanh toán mặc định không hợp lệ.');
  }

  const data = {
    ...(input.maxCourtCountPerSession !== undefined ? {
      max_court_count_per_session: normalizeMaxCourtCount(input.maxCourtCountPerSession)
    } : {}),
    ...(input.autoCreateCourtFeeTransaction !== undefined ? {
      auto_create_court_fee_transaction: Boolean(input.autoCreateCourtFeeTransaction)
    } : {}),
    ...(input.autoCreateShuttlecockUsageTransaction !== undefined ? {
      auto_create_shuttlecock_usage_transaction: Boolean(input.autoCreateShuttlecockUsageTransaction)
    } : {}),
    ...(defaultPaymentBankAccountId !== undefined ? {
      default_payment_bank_account_id: defaultPaymentBankAccountId
    } : {}),
    updated_at: new Date()
  };

  const row = await prisma.app_settings.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      club_name: 'Badmin',
      max_court_count_per_session: input.maxCourtCountPerSession === undefined
        ? defaultAppSettings.maxCourtCountPerSession
        : normalizeMaxCourtCount(input.maxCourtCountPerSession),
      auto_create_court_fee_transaction: input.autoCreateCourtFeeTransaction ?? defaultAppSettings.autoCreateCourtFeeTransaction,
      auto_create_shuttlecock_usage_transaction: input.autoCreateShuttlecockUsageTransaction ?? defaultAppSettings.autoCreateShuttlecockUsageTransaction,
      default_payment_bank_account_id: defaultPaymentBankAccountId ?? null
    },
    update: data
  });

  return mapAppSettings(row);
}
