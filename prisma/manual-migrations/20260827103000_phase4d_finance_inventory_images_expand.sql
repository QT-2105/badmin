-- Phase 4D: nullable tenant ownership expansion for finance/inventory/images.
-- Confirmed UAT fingerprint: c2f96ce9dcd6. Manual application only.
-- Additive only: no default, backfill, FK, unique replacement, or NOT NULL.

SET LOCAL lock_timeout = '2s';

-- statement-breakpoint
SET LOCAL statement_timeout = '30s';

-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM control.clubs
    WHERE id = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid
      AND code = 'tt-badminton'
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Phase 4D requires the reviewed Legacy Club foundation';
  END IF;
END $$;

-- statement-breakpoint
ALTER TABLE public.session_transactions ADD COLUMN IF NOT EXISTS club_id UUID;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_products ADD COLUMN IF NOT EXISTS club_id UUID;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_inventory ADD COLUMN IF NOT EXISTS club_id UUID;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_movements ADD COLUMN IF NOT EXISTS club_id UUID;

-- statement-breakpoint
ALTER TABLE public.session_player_images ADD COLUMN IF NOT EXISTS club_id UUID;

-- statement-breakpoint
DO $$
DECLARE
  target_table text;
  column_record record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'session_transactions', 'shuttlecock_products', 'shuttlecock_inventory',
    'shuttlecock_movements', 'session_player_images'
  ] LOOP
    SELECT data_type, is_nullable, column_default
    INTO column_record
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND information_schema.columns.table_name = target_table
      AND column_name = 'club_id';

    IF NOT FOUND
      OR column_record.data_type <> 'uuid'
      OR column_record.is_nullable <> 'YES'
      OR column_record.column_default IS NOT NULL
    THEN
      RAISE EXCEPTION 'Invalid %.club_id Phase 4D expansion', target_table;
    END IF;
  END LOOP;
END $$;
