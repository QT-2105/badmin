DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname IN (
      'play_dates_play_date_key',
      'uq_match_history_player',
      'shuttlecock_inventory_product_id_key'
    )
  ) THEN
    RAISE EXCEPTION 'A legacy global unique constraint remains';
  END IF;
  IF to_regclass('public.uq_runtime_courts_session_number') IS NOT NULL
    OR to_regclass('public.uq_runtime_matches_session_queue') IS NOT NULL
    OR to_regclass('public.uq_runtime_matches_session_court') IS NOT NULL
    OR to_regclass('public.uq_app_settings_club') IS NOT NULL
  THEN
    RAISE EXCEPTION 'A redundant global/settings unique index remains';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_settings'::regclass
      AND conname = 'app_settings_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (club_id)'
  ) THEN
    RAISE EXCEPTION 'app_settings primary key is not tenant-owned';
  END IF;
  IF EXISTS (
    SELECT club_id FROM public.app_settings GROUP BY club_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate app_settings tenant singleton';
  END IF;
END $$;
