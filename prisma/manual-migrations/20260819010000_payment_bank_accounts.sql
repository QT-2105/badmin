CREATE TABLE IF NOT EXISTS "payment_bank_accounts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_name" VARCHAR(255) NOT NULL,
  "bank_name" VARCHAR(255) NOT NULL,
  "qr_s3_key" VARCHAR(500) NOT NULL,
  "qr_url" VARCHAR(1000) NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(6) DEFAULT now(),
  "updated_at" TIMESTAMP(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_payment_bank_accounts_active_order"
  ON "payment_bank_accounts"("active", "display_order");
