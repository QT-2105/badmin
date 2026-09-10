-- Phase 8A - query-driven tenant indexes.
-- Target: reviewed UAT only. Run outside a transaction, one statement at a time.
-- The fingerprint-guarded runner is: npm run phase8:uat -- apply 8A

CREATE INDEX CONCURRENTLY "idx_app_users_club_role_status_created" ON public."app_users" (club_id, role, status, created_at);
CREATE INDEX CONCURRENTLY "idx_auth_sessions_club_user" ON public."auth_sessions" (club_id, user_id);
CREATE INDEX CONCURRENTLY "idx_auth_sessions_club_expires" ON public."auth_sessions" (club_id, expires_at);
CREATE INDEX CONCURRENTLY "idx_payment_banks_club_active_order" ON public."payment_bank_accounts" (club_id, active, display_order, created_at, id);
CREATE INDEX CONCURRENTLY "idx_play_sessions_club_date_start" ON public."play_sessions" (club_id, play_date_id, start_time, created_at);
CREATE INDEX CONCURRENTLY "idx_play_sessions_club_status_updated" ON public."play_sessions" (club_id, status, updated_at DESC);
CREATE INDEX CONCURRENTLY "idx_session_players_club_session_joined" ON public."session_players" (club_id, session_id, joined_at, full_name);
CREATE INDEX CONCURRENTLY "idx_session_players_club_session_couple" ON public."session_players" (club_id, session_id, couple_number);
CREATE INDEX CONCURRENTLY "idx_runtime_matches_club_session_status" ON public."runtime_matches" (club_id, session_id, status);
CREATE INDEX CONCURRENTLY "idx_match_histories_club_session_ended" ON public."match_histories" (club_id, session_id, ended_at DESC);
CREATE INDEX CONCURRENTLY "idx_match_histories_club_session_court" ON public."match_histories" (club_id, session_id, court_number);
CREATE INDEX CONCURRENTLY "idx_match_history_players_club_player" ON public."match_history_players" (club_id, session_player_id);
CREATE INDEX CONCURRENTLY "idx_session_transactions_club_created" ON public."session_transactions" (club_id, created_at DESC);
CREATE INDEX CONCURRENTLY "idx_session_transactions_club_session_created" ON public."session_transactions" (club_id, session_id, created_at DESC);
CREATE INDEX CONCURRENTLY "idx_products_club_created" ON public."shuttlecock_products" (club_id, created_at DESC);
CREATE INDEX CONCURRENTLY "idx_products_club_status_name" ON public."shuttlecock_products" (club_id, status, name);
CREATE INDEX CONCURRENTLY "idx_movements_club_created" ON public."shuttlecock_movements" (club_id, created_at DESC);
CREATE INDEX CONCURRENTLY "idx_movements_club_product_created" ON public."shuttlecock_movements" (club_id, shuttlecock_product_id, created_at DESC);
CREATE INDEX CONCURRENTLY "idx_player_images_club_player" ON public."session_player_images" (club_id, session_player_id);
CREATE INDEX CONCURRENTLY "idx_player_images_club_status" ON public."session_player_images" (club_id, status);
