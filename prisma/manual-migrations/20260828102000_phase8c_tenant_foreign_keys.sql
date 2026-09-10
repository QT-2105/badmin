-- Phase 8C - direct club and tenant-composite FKs.
-- Apply one ALTER per short transaction with lock_timeout=2s. NOT VALID avoids a table scan here.

ALTER TABLE public."app_role_permissions" ADD CONSTRAINT "fk_app_role_permissions_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."app_settings" ADD CONSTRAINT "fk_app_settings_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."app_users" ADD CONSTRAINT "fk_app_users_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."auth_sessions" ADD CONSTRAINT "fk_auth_sessions_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."match_histories" ADD CONSTRAINT "fk_match_histories_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."match_history_players" ADD CONSTRAINT "fk_match_history_players_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."payment_bank_accounts" ADD CONSTRAINT "fk_payment_bank_accounts_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."play_dates" ADD CONSTRAINT "fk_play_dates_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."play_sessions" ADD CONSTRAINT "fk_play_sessions_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."runtime_courts" ADD CONSTRAINT "fk_runtime_courts_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."runtime_matches" ADD CONSTRAINT "fk_runtime_matches_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."session_player_images" ADD CONSTRAINT "fk_session_player_images_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."session_players" ADD CONSTRAINT "fk_session_players_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."session_summaries" ADD CONSTRAINT "fk_session_summaries_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."session_transactions" ADD CONSTRAINT "fk_session_transactions_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."shuttlecock_inventory" ADD CONSTRAINT "fk_shuttlecock_inventory_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."shuttlecock_movements" ADD CONSTRAINT "fk_shuttlecock_movements_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE public."shuttlecock_products" ADD CONSTRAINT "fk_shuttlecock_products_club" FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public."play_sessions" ADD CONSTRAINT "fk_play_sessions_tenant_date" FOREIGN KEY (club_id, play_date_id) REFERENCES public."play_dates" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."play_sessions" ADD CONSTRAINT "fk_play_sessions_tenant_product" FOREIGN KEY (club_id, shuttlecock_product_id) REFERENCES public."shuttlecock_products" (club_id, id) ON DELETE NO ACTION NOT VALID;
ALTER TABLE public."runtime_matches" ADD CONSTRAINT "fk_runtime_matches_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."runtime_courts" ADD CONSTRAINT "fk_runtime_courts_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."runtime_courts" ADD CONSTRAINT "fk_runtime_courts_tenant_match" FOREIGN KEY (club_id, session_id, runtime_match_id) REFERENCES public."runtime_matches" (club_id, session_id, id) ON DELETE NO ACTION NOT VALID;
ALTER TABLE public."session_players" ADD CONSTRAINT "fk_session_players_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."app_settings" ADD CONSTRAINT "fk_app_settings_tenant_default_bank" FOREIGN KEY (club_id, default_payment_bank_account_id) REFERENCES public."payment_bank_accounts" (club_id, id) ON DELETE NO ACTION NOT VALID;
ALTER TABLE public."auth_sessions" ADD CONSTRAINT "fk_auth_sessions_tenant_user" FOREIGN KEY (club_id, user_id) REFERENCES public."app_users" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."session_player_images" ADD CONSTRAINT "fk_player_images_tenant_player" FOREIGN KEY (club_id, session_player_id) REFERENCES public."session_players" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."match_histories" ADD CONSTRAINT "fk_match_histories_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."match_history_players" ADD CONSTRAINT "fk_history_players_tenant_history" FOREIGN KEY (club_id, match_history_id) REFERENCES public."match_histories" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."match_history_players" ADD CONSTRAINT "fk_history_players_tenant_player" FOREIGN KEY (club_id, session_player_id) REFERENCES public."session_players" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."session_summaries" ADD CONSTRAINT "fk_session_summaries_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."session_transactions" ADD CONSTRAINT "fk_transactions_tenant_session" FOREIGN KEY (club_id, session_id) REFERENCES public."play_sessions" (club_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public."shuttlecock_inventory" ADD CONSTRAINT "fk_inventory_tenant_product" FOREIGN KEY (club_id, shuttlecock_product_id) REFERENCES public."shuttlecock_products" (club_id, id) ON DELETE NO ACTION NOT VALID;
ALTER TABLE public."shuttlecock_movements" ADD CONSTRAINT "fk_movements_tenant_product" FOREIGN KEY (club_id, shuttlecock_product_id) REFERENCES public."shuttlecock_products" (club_id, id) ON DELETE NO ACTION NOT VALID;

ALTER TABLE public."app_role_permissions" ADD CONSTRAINT "ck_app_role_permissions_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."app_settings" ADD CONSTRAINT "ck_app_settings_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."app_users" ADD CONSTRAINT "ck_app_users_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."auth_sessions" ADD CONSTRAINT "ck_auth_sessions_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."match_histories" ADD CONSTRAINT "ck_match_histories_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."match_history_players" ADD CONSTRAINT "ck_match_history_players_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."payment_bank_accounts" ADD CONSTRAINT "ck_payment_bank_accounts_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."play_dates" ADD CONSTRAINT "ck_play_dates_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."play_sessions" ADD CONSTRAINT "ck_play_sessions_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."runtime_courts" ADD CONSTRAINT "ck_runtime_courts_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."runtime_matches" ADD CONSTRAINT "ck_runtime_matches_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."session_player_images" ADD CONSTRAINT "ck_session_player_images_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."session_players" ADD CONSTRAINT "ck_session_players_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."session_summaries" ADD CONSTRAINT "ck_session_summaries_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."session_transactions" ADD CONSTRAINT "ck_session_transactions_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."shuttlecock_inventory" ADD CONSTRAINT "ck_shuttlecock_inventory_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."shuttlecock_movements" ADD CONSTRAINT "ck_shuttlecock_movements_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
ALTER TABLE public."shuttlecock_products" ADD CONSTRAINT "ck_shuttlecock_products_club_id_nn" CHECK (club_id IS NOT NULL) NOT VALID;
