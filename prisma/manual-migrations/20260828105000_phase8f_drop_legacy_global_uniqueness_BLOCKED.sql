-- PHASE 8F IS BLOCKED AND MUST NOT BE APPLIED YET.
-- Gate: Phase 9 tenant-aware auth/schema cutover must be complete and validated,
-- and this must execute before Tenant #2 is activated.
-- Current Prisma still models global email/role/settings identity, so dropping
-- these constraints now would create schema drift and unsafe authentication.

DO $blocked$
BEGIN
  RAISE EXCEPTION 'Phase 8F blocked: tenant-aware authentication and Prisma identity cutover are not complete';
END
$blocked$;

-- Reviewed post-Phase-9 operations (intentionally commented):
-- ALTER TABLE public.play_dates DROP CONSTRAINT play_dates_play_date_key;
-- ALTER TABLE public.app_users DROP CONSTRAINT app_users_email_key;
-- ALTER TABLE public.match_history_players DROP CONSTRAINT uq_match_history_player;
-- ALTER TABLE public.shuttlecock_inventory DROP CONSTRAINT shuttlecock_inventory_product_id_key;
-- DROP INDEX CONCURRENTLY public.uq_runtime_courts_session_number;
-- DROP INDEX CONCURRENTLY public.uq_runtime_matches_session_queue;
-- DROP INDEX CONCURRENTLY public.uq_runtime_matches_session_court;
-- app_role_permissions_pkey and app_settings_pkey require a separately reviewed
-- primary-key cutover; they are not dropped by Phase 8F without replacement.
