-- Emergency manual rollback for Phase 4A. Do not apply after Phase 5 writes begin.
SET LOCAL lock_timeout = '2s';

-- statement-breakpoint
ALTER TABLE public.auth_sessions DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.app_users DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.app_role_permissions DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.app_settings DROP COLUMN IF EXISTS club_id;

-- statement-breakpoint
ALTER TABLE public.payment_bank_accounts DROP COLUMN IF EXISTS club_id;
