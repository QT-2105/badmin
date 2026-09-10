-- Emergency manual rollback for Phase 4D. Do not apply after Phase 5 writes begin.
SET LOCAL lock_timeout = '2s';

-- statement-breakpoint
ALTER TABLE public.session_transactions DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_inventory DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_movements DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.shuttlecock_products DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.session_player_images DROP COLUMN IF EXISTS club_id;
