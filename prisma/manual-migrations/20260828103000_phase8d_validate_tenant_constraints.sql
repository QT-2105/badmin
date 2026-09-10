-- Phase 8D - validate each constraint as its own transaction/statement.
-- The guarded runner applies lock_timeout=2s and statement_timeout=120s per item.

ALTER TABLE public."app_role_permissions" VALIDATE CONSTRAINT "fk_app_role_permissions_club";
ALTER TABLE public."app_settings" VALIDATE CONSTRAINT "fk_app_settings_club";
ALTER TABLE public."app_users" VALIDATE CONSTRAINT "fk_app_users_club";
ALTER TABLE public."auth_sessions" VALIDATE CONSTRAINT "fk_auth_sessions_club";
ALTER TABLE public."match_histories" VALIDATE CONSTRAINT "fk_match_histories_club";
ALTER TABLE public."match_history_players" VALIDATE CONSTRAINT "fk_match_history_players_club";
ALTER TABLE public."payment_bank_accounts" VALIDATE CONSTRAINT "fk_payment_bank_accounts_club";
ALTER TABLE public."play_dates" VALIDATE CONSTRAINT "fk_play_dates_club";
ALTER TABLE public."play_sessions" VALIDATE CONSTRAINT "fk_play_sessions_club";
ALTER TABLE public."runtime_courts" VALIDATE CONSTRAINT "fk_runtime_courts_club";
ALTER TABLE public."runtime_matches" VALIDATE CONSTRAINT "fk_runtime_matches_club";
ALTER TABLE public."session_player_images" VALIDATE CONSTRAINT "fk_session_player_images_club";
ALTER TABLE public."session_players" VALIDATE CONSTRAINT "fk_session_players_club";
ALTER TABLE public."session_summaries" VALIDATE CONSTRAINT "fk_session_summaries_club";
ALTER TABLE public."session_transactions" VALIDATE CONSTRAINT "fk_session_transactions_club";
ALTER TABLE public."shuttlecock_inventory" VALIDATE CONSTRAINT "fk_shuttlecock_inventory_club";
ALTER TABLE public."shuttlecock_movements" VALIDATE CONSTRAINT "fk_shuttlecock_movements_club";
ALTER TABLE public."shuttlecock_products" VALIDATE CONSTRAINT "fk_shuttlecock_products_club";

ALTER TABLE public."play_sessions" VALIDATE CONSTRAINT "fk_play_sessions_tenant_date";
ALTER TABLE public."play_sessions" VALIDATE CONSTRAINT "fk_play_sessions_tenant_product";
ALTER TABLE public."runtime_matches" VALIDATE CONSTRAINT "fk_runtime_matches_tenant_session";
ALTER TABLE public."runtime_courts" VALIDATE CONSTRAINT "fk_runtime_courts_tenant_session";
ALTER TABLE public."runtime_courts" VALIDATE CONSTRAINT "fk_runtime_courts_tenant_match";
ALTER TABLE public."session_players" VALIDATE CONSTRAINT "fk_session_players_tenant_session";
ALTER TABLE public."app_settings" VALIDATE CONSTRAINT "fk_app_settings_tenant_default_bank";
ALTER TABLE public."auth_sessions" VALIDATE CONSTRAINT "fk_auth_sessions_tenant_user";
ALTER TABLE public."session_player_images" VALIDATE CONSTRAINT "fk_player_images_tenant_player";
ALTER TABLE public."match_histories" VALIDATE CONSTRAINT "fk_match_histories_tenant_session";
ALTER TABLE public."match_history_players" VALIDATE CONSTRAINT "fk_history_players_tenant_history";
ALTER TABLE public."match_history_players" VALIDATE CONSTRAINT "fk_history_players_tenant_player";
ALTER TABLE public."session_summaries" VALIDATE CONSTRAINT "fk_session_summaries_tenant_session";
ALTER TABLE public."session_transactions" VALIDATE CONSTRAINT "fk_transactions_tenant_session";
ALTER TABLE public."shuttlecock_inventory" VALIDATE CONSTRAINT "fk_inventory_tenant_product";
ALTER TABLE public."shuttlecock_movements" VALIDATE CONSTRAINT "fk_movements_tenant_product";

ALTER TABLE public."app_role_permissions" VALIDATE CONSTRAINT "ck_app_role_permissions_club_id_nn";
ALTER TABLE public."app_settings" VALIDATE CONSTRAINT "ck_app_settings_club_id_nn";
ALTER TABLE public."app_users" VALIDATE CONSTRAINT "ck_app_users_club_id_nn";
ALTER TABLE public."auth_sessions" VALIDATE CONSTRAINT "ck_auth_sessions_club_id_nn";
ALTER TABLE public."match_histories" VALIDATE CONSTRAINT "ck_match_histories_club_id_nn";
ALTER TABLE public."match_history_players" VALIDATE CONSTRAINT "ck_match_history_players_club_id_nn";
ALTER TABLE public."payment_bank_accounts" VALIDATE CONSTRAINT "ck_payment_bank_accounts_club_id_nn";
ALTER TABLE public."play_dates" VALIDATE CONSTRAINT "ck_play_dates_club_id_nn";
ALTER TABLE public."play_sessions" VALIDATE CONSTRAINT "ck_play_sessions_club_id_nn";
ALTER TABLE public."runtime_courts" VALIDATE CONSTRAINT "ck_runtime_courts_club_id_nn";
ALTER TABLE public."runtime_matches" VALIDATE CONSTRAINT "ck_runtime_matches_club_id_nn";
ALTER TABLE public."session_player_images" VALIDATE CONSTRAINT "ck_session_player_images_club_id_nn";
ALTER TABLE public."session_players" VALIDATE CONSTRAINT "ck_session_players_club_id_nn";
ALTER TABLE public."session_summaries" VALIDATE CONSTRAINT "ck_session_summaries_club_id_nn";
ALTER TABLE public."session_transactions" VALIDATE CONSTRAINT "ck_session_transactions_club_id_nn";
ALTER TABLE public."shuttlecock_inventory" VALIDATE CONSTRAINT "ck_shuttlecock_inventory_club_id_nn";
ALTER TABLE public."shuttlecock_movements" VALIDATE CONSTRAINT "ck_shuttlecock_movements_club_id_nn";
ALTER TABLE public."shuttlecock_products" VALIDATE CONSTRAINT "ck_shuttlecock_products_club_id_nn";
