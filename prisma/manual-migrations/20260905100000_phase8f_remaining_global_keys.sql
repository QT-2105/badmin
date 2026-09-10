-- Phase 8F final cutover. Apply manually only after Phase 13 role-key migration.
-- Exact target confirmation, current backup/recovery approval, and an application
-- release using the tenant-only Prisma schema are required.

DO $$
DECLARE
  missing_indexes TEXT[];
BEGIN
  SELECT array_agg(expected.name ORDER BY expected.name)
  INTO missing_indexes
  FROM (VALUES
    ('uq_play_dates_club_date'),
    ('uq_runtime_courts_club_session_number'),
    ('uq_runtime_matches_club_session_queue'),
    ('uq_runtime_matches_club_session_court'),
    ('uq_history_players_club_history_player'),
    ('uq_inventory_club_product'),
    ('uq_app_settings_club')
  ) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname = expected.name
      AND i.indisvalid AND i.indisready AND i.indisunique
  );
  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'Missing valid tenant unique replacements: %', missing_indexes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_role_permissions'::regclass
      AND conname = 'app_role_permissions_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (club_id, role)'
  ) THEN
    RAISE EXCEPTION 'Phase 13 tenant role-permission primary key is required first';
  END IF;
END $$;

-- Concurrent index drops cannot run inside a transaction.
DROP INDEX CONCURRENTLY IF EXISTS public.uq_runtime_courts_session_number;
DROP INDEX CONCURRENTLY IF EXISTS public.uq_runtime_matches_session_queue;
DROP INDEX CONCURRENTLY IF EXISTS public.uq_runtime_matches_session_court;

BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.play_dates DROP CONSTRAINT IF EXISTS play_dates_play_date_key;
COMMIT;

BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.match_history_players DROP CONSTRAINT IF EXISTS uq_match_history_player;
COMMIT;

BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.shuttlecock_inventory DROP CONSTRAINT IF EXISTS shuttlecock_inventory_product_id_key;
COMMIT;

BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.app_settings DROP CONSTRAINT app_settings_pkey;
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (club_id);
COMMIT;

DROP INDEX CONCURRENTLY IF EXISTS public.uq_app_settings_club;
