-- Phase 8B - tenant parent/domain uniqueness.
-- Run outside a transaction, one statement at a time.
-- Legacy global uniqueness remains in place until the Phase 8F auth cutover gate.

CREATE UNIQUE INDEX CONCURRENTLY "uq_play_dates_club_id_id" ON public."play_dates" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_play_sessions_club_id_id" ON public."play_sessions" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_products_club_id_id" ON public."shuttlecock_products" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_runtime_matches_club_id_id" ON public."runtime_matches" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_runtime_matches_club_session_id" ON public."runtime_matches" (club_id, session_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_session_players_club_id_id" ON public."session_players" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_payment_banks_club_id_id" ON public."payment_bank_accounts" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_app_users_club_id_id" ON public."app_users" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_auth_sessions_club_id_id" ON public."auth_sessions" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_player_images_club_id_id" ON public."session_player_images" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_match_histories_club_id_id" ON public."match_histories" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_transactions_club_id_id" ON public."session_transactions" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_movements_club_id_id" ON public."shuttlecock_movements" (club_id, id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_play_dates_club_date" ON public."play_dates" (club_id, play_date);
CREATE UNIQUE INDEX CONCURRENTLY "uq_runtime_courts_club_session_number" ON public."runtime_courts" (club_id, session_id, court_number);
CREATE UNIQUE INDEX CONCURRENTLY "uq_runtime_matches_club_session_queue" ON public."runtime_matches" (club_id, session_id, queue_order);
CREATE UNIQUE INDEX CONCURRENTLY "uq_runtime_matches_club_session_court" ON public."runtime_matches" (club_id, session_id, court_number);
CREATE UNIQUE INDEX CONCURRENTLY "uq_app_settings_club" ON public."app_settings" (club_id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_role_permissions_club_role" ON public."app_role_permissions" (club_id, role);
CREATE UNIQUE INDEX CONCURRENTLY "uq_history_players_club_history_player" ON public."match_history_players" (club_id, match_history_id, session_player_id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_session_summaries_club_session" ON public."session_summaries" (club_id, session_id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_inventory_club_product" ON public."shuttlecock_inventory" (club_id, shuttlecock_product_id);
CREATE UNIQUE INDEX CONCURRENTLY "uq_app_users_club_email" ON public."app_users" (club_id, email);
