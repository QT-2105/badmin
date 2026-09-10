-- Read-only validation for Phase 4C.
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
    'runtime_courts', 'runtime_matches', 'match_histories',
    'match_history_players', 'session_summaries'
  )
ORDER BY table_name;

-- statement-breakpoint
SELECT 'runtime_courts' AS table_name, count(*) AS row_count,
       count(club_id) AS populated_club_id_count FROM public.runtime_courts
UNION ALL SELECT 'runtime_matches', count(*), count(club_id) FROM public.runtime_matches
UNION ALL SELECT 'match_histories', count(*), count(club_id) FROM public.match_histories
UNION ALL SELECT 'match_history_players', count(*), count(club_id) FROM public.match_history_players
UNION ALL SELECT 'session_summaries', count(*), count(club_id) FROM public.session_summaries
ORDER BY table_name;
