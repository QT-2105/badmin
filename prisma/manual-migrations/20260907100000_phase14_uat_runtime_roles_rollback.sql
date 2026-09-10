-- UAT-only rollback. Remove the effective runtime grants but retain group roles.
BEGIN;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE
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
FROM badmin_uat_app;
REVOKE USAGE ON SCHEMA public FROM badmin_uat_app;
GRANT badmin_control_writer TO neondb_owner WITH SET FALSE;
COMMIT;
