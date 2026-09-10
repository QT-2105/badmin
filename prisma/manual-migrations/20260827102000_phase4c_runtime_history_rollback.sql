-- Emergency manual rollback for Phase 4C. Do not apply after Phase 5 writes begin.
SET LOCAL lock_timeout = '2s';

-- statement-breakpoint
ALTER TABLE public.runtime_courts DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.runtime_matches DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.match_history_players DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.match_histories DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.session_summaries DROP COLUMN IF EXISTS club_id;
