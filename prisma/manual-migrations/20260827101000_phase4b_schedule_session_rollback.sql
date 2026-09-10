-- Emergency manual rollback for Phase 4B. Do not apply after Phase 5 writes begin.
SET LOCAL lock_timeout = '2s';

-- statement-breakpoint
ALTER TABLE public.session_players DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.play_sessions DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.play_dates DROP COLUMN IF EXISTS club_id;
