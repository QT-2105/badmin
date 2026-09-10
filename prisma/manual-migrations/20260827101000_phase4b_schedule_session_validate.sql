-- Read-only validation for Phase 4B.
SELECT
  table_name,
  data_type,
  is_nullable,
  column_default,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'club_id'
  AND table_name IN ('play_dates', 'play_sessions', 'session_players')
ORDER BY table_name;

-- statement-breakpoint
SELECT 'play_dates' AS table_name, count(*) AS row_count,
       count(club_id) AS populated_club_id_count FROM public.play_dates
UNION ALL SELECT 'play_sessions', count(*), count(club_id) FROM public.play_sessions
UNION ALL SELECT 'session_players', count(*), count(club_id) FROM public.session_players
ORDER BY table_name;
