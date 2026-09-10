-- Apply only after Phase 9 auth code, tenant-normalized indexes, and regressions pass.
-- This is the auth-specific part of the deferred Phase 8F cutover.
ALTER TABLE public.app_users DROP CONSTRAINT app_users_email_key;
