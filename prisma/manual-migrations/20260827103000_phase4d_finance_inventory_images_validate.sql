-- Read-only validation for Phase 4D.
SELECT
  table_name,
  data_type,
  is_nullable,
  column_default,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'club_id'
  AND table_name IN (
    'session_transactions', 'shuttlecock_products', 'shuttlecock_inventory',
    'shuttlecock_movements', 'session_player_images'
  )
ORDER BY table_name;

-- statement-breakpoint
SELECT 'session_transactions' AS table_name, count(*) AS row_count,
       count(club_id) AS populated_club_id_count FROM public.session_transactions
UNION ALL SELECT 'shuttlecock_products', count(*), count(club_id) FROM public.shuttlecock_products
UNION ALL SELECT 'shuttlecock_inventory', count(*), count(club_id) FROM public.shuttlecock_inventory
UNION ALL SELECT 'shuttlecock_movements', count(*), count(club_id) FROM public.shuttlecock_movements
UNION ALL SELECT 'session_player_images', count(*), count(club_id) FROM public.session_player_images
ORDER BY table_name;
