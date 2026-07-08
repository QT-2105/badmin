ALTER TABLE session_transactions
ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL';

UPDATE session_transactions
SET adjustment_type = 'NORMAL'
WHERE adjustment_type IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_transactions_adjustment_type_check'
  ) THEN
    ALTER TABLE session_transactions
    ADD CONSTRAINT session_transactions_adjustment_type_check
    CHECK (adjustment_type IN ('NORMAL', 'DEDUCTION'));
  END IF;
END $$;
