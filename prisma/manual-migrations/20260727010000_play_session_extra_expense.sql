ALTER TABLE "play_sessions"
  ADD COLUMN IF NOT EXISTS "extra_expense_title" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "extra_expense_amount" DECIMAL(12, 2) DEFAULT 0;
