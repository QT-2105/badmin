-- Guarded compatibility rollback. Run only with the matching old application.
DO $$
BEGIN
  IF EXISTS (SELECT play_date FROM public.play_dates GROUP BY play_date HAVING count(*) > 1)
    OR EXISTS (SELECT session_id, court_number FROM public.runtime_courts GROUP BY session_id, court_number HAVING count(*) > 1)
    OR EXISTS (SELECT session_id, queue_order FROM public.runtime_matches WHERE queue_order IS NOT NULL GROUP BY session_id, queue_order HAVING count(*) > 1)
    OR EXISTS (SELECT session_id, court_number FROM public.runtime_matches WHERE court_number IS NOT NULL GROUP BY session_id, court_number HAVING count(*) > 1)
    OR EXISTS (SELECT match_history_id, session_player_id FROM public.match_history_players GROUP BY match_history_id, session_player_id HAVING count(*) > 1)
    OR EXISTS (SELECT shuttlecock_product_id FROM public.shuttlecock_inventory GROUP BY shuttlecock_product_id HAVING count(*) > 1)
    OR EXISTS (SELECT id FROM public.app_settings GROUP BY id HAVING count(*) > 1)
  THEN
    RAISE EXCEPTION 'Global-key rollback is unsafe after cross-club duplicate values exist';
  END IF;
END $$;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_runtime_courts_session_number
  ON public.runtime_courts (session_id, court_number);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_runtime_matches_session_queue
  ON public.runtime_matches (session_id, queue_order);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_runtime_matches_session_court
  ON public.runtime_matches (session_id, court_number);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_app_settings_club
  ON public.app_settings (club_id);

BEGIN;
SET LOCAL lock_timeout = '3s';
ALTER TABLE public.play_dates ADD CONSTRAINT play_dates_play_date_key UNIQUE (play_date);
ALTER TABLE public.match_history_players ADD CONSTRAINT uq_match_history_player UNIQUE (match_history_id, session_player_id);
ALTER TABLE public.shuttlecock_inventory ADD CONSTRAINT shuttlecock_inventory_product_id_key UNIQUE (shuttlecock_product_id);
ALTER TABLE public.app_settings DROP CONSTRAINT app_settings_pkey;
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);
COMMIT;
