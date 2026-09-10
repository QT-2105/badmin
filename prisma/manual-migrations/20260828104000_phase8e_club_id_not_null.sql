-- Phase 8E - only after all ck_*_club_id_nn checks are validated.
-- Apply one table per short transaction. SET NOT NULL reuses the validated check.

ALTER TABLE public."app_role_permissions" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."app_role_permissions" DROP CONSTRAINT "ck_app_role_permissions_club_id_nn";
ALTER TABLE public."app_settings" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."app_settings" DROP CONSTRAINT "ck_app_settings_club_id_nn";
ALTER TABLE public."app_users" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."app_users" DROP CONSTRAINT "ck_app_users_club_id_nn";
ALTER TABLE public."auth_sessions" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."auth_sessions" DROP CONSTRAINT "ck_auth_sessions_club_id_nn";
ALTER TABLE public."match_histories" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."match_histories" DROP CONSTRAINT "ck_match_histories_club_id_nn";
ALTER TABLE public."match_history_players" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."match_history_players" DROP CONSTRAINT "ck_match_history_players_club_id_nn";
ALTER TABLE public."payment_bank_accounts" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."payment_bank_accounts" DROP CONSTRAINT "ck_payment_bank_accounts_club_id_nn";
ALTER TABLE public."play_dates" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."play_dates" DROP CONSTRAINT "ck_play_dates_club_id_nn";
ALTER TABLE public."play_sessions" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."play_sessions" DROP CONSTRAINT "ck_play_sessions_club_id_nn";
ALTER TABLE public."runtime_courts" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."runtime_courts" DROP CONSTRAINT "ck_runtime_courts_club_id_nn";
ALTER TABLE public."runtime_matches" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."runtime_matches" DROP CONSTRAINT "ck_runtime_matches_club_id_nn";
ALTER TABLE public."session_player_images" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."session_player_images" DROP CONSTRAINT "ck_session_player_images_club_id_nn";
ALTER TABLE public."session_players" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."session_players" DROP CONSTRAINT "ck_session_players_club_id_nn";
ALTER TABLE public."session_summaries" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."session_summaries" DROP CONSTRAINT "ck_session_summaries_club_id_nn";
ALTER TABLE public."session_transactions" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."session_transactions" DROP CONSTRAINT "ck_session_transactions_club_id_nn";
ALTER TABLE public."shuttlecock_inventory" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."shuttlecock_inventory" DROP CONSTRAINT "ck_shuttlecock_inventory_club_id_nn";
ALTER TABLE public."shuttlecock_movements" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."shuttlecock_movements" DROP CONSTRAINT "ck_shuttlecock_movements_club_id_nn";
ALTER TABLE public."shuttlecock_products" ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public."shuttlecock_products" DROP CONSTRAINT "ck_shuttlecock_products_club_id_nn";
