ALTER TABLE "app_settings"
  ADD COLUMN IF NOT EXISTS "max_court_count_per_session" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "auto_create_court_fee_transaction" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "auto_create_shuttlecock_usage_transaction" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "default_payment_bank_account_id" UUID;
