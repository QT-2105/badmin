-- Phase 14 UAT effective runtime-role deployment.
-- The authenticated Neon login remains neondb_owner on UAT, while application
-- connections assume badmin_uat_app and Control Plane rehearsals explicitly
-- assume badmin_control_writer. Production must use separate LOGIN roles.

BEGIN;
SET LOCAL lock_timeout = '3s';

GRANT USAGE ON SCHEMA public TO badmin_uat_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.app_role_permissions,
  public.app_settings,
  public.app_users,
  public.auth_sessions,
  public.match_histories,
  public.match_history_players,
  public.payment_bank_accounts,
  public.play_dates,
  public.play_sessions,
  public.runtime_courts,
  public.runtime_matches,
  public.session_player_images,
  public.session_players,
  public.session_summaries,
  public.session_transactions,
  public.shuttlecock_inventory,
  public.shuttlecock_movements,
  public.shuttlecock_products
TO badmin_uat_app;

GRANT badmin_control_writer TO neondb_owner WITH SET TRUE;
GRANT badmin_uat_app TO neondb_owner WITH SET TRUE;

COMMIT;
