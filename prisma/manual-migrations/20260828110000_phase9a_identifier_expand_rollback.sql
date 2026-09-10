-- Compatibility rollback keeps normalized identifiers and ownership data.
-- Run the email-cutover rollback first when returning to the old app.
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ck_app_users_identifier_required;
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ck_app_users_username_pair;
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ck_app_users_email_normalized_source;
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ck_app_users_phone_pair;

DROP INDEX CONCURRENTLY IF EXISTS public.uq_app_users_club_username_normalized;
DROP INDEX CONCURRENTLY IF EXISTS public.uq_app_users_club_email_normalized;
DROP INDEX CONCURRENTLY IF EXISTS public.uq_app_users_club_phone_normalized;

-- Do not drop identifier columns automatically: new users may depend on them.
