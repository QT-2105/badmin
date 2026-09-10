import { createHash } from 'node:crypto';

export const EXPECTED_FINGERPRINT = 'c2f96ce9dcd6';
export const LEGACY_CLUB_ID = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';

export const TENANT_TABLES = [
  'app_role_permissions', 'app_settings', 'app_users', 'auth_sessions',
  'match_histories', 'match_history_players', 'payment_bank_accounts',
  'play_dates', 'play_sessions', 'runtime_courts', 'runtime_matches',
  'session_player_images', 'session_players', 'session_summaries',
  'session_transactions', 'shuttlecock_inventory', 'shuttlecock_movements',
  'shuttlecock_products'
];

export const EXPECTED_ROW_COUNTS = {
  app_role_permissions: 3n,
  app_settings: 1n,
  app_users: 5n,
  auth_sessions: 3n,
  match_histories: 530n,
  match_history_players: 2120n,
  payment_bank_accounts: 2n,
  play_dates: 21n,
  play_sessions: 21n,
  runtime_courts: 52n,
  runtime_matches: 3n,
  session_player_images: 34n,
  session_players: 437n,
  session_summaries: 21n,
  session_transactions: 53n,
  shuttlecock_inventory: 1n,
  shuttlecock_movements: 29n,
  shuttlecock_products: 1n
};

export const TENANT_INDEXES = [
  ['idx_app_users_club_role_status_created', 'app_users', 'club_id, role, status, created_at'],
  ['idx_auth_sessions_club_user', 'auth_sessions', 'club_id, user_id'],
  ['idx_auth_sessions_club_expires', 'auth_sessions', 'club_id, expires_at'],
  ['idx_payment_banks_club_active_order', 'payment_bank_accounts', 'club_id, active, display_order, created_at, id'],
  ['idx_play_sessions_club_date_start', 'play_sessions', 'club_id, play_date_id, start_time, created_at'],
  ['idx_play_sessions_club_status_updated', 'play_sessions', 'club_id, status, updated_at DESC'],
  ['idx_session_players_club_session_joined', 'session_players', 'club_id, session_id, joined_at, full_name'],
  ['idx_session_players_club_session_couple', 'session_players', 'club_id, session_id, couple_number'],
  ['idx_runtime_matches_club_session_status', 'runtime_matches', 'club_id, session_id, status'],
  ['idx_match_histories_club_session_ended', 'match_histories', 'club_id, session_id, ended_at DESC'],
  ['idx_match_histories_club_session_court', 'match_histories', 'club_id, session_id, court_number'],
  ['idx_match_history_players_club_player', 'match_history_players', 'club_id, session_player_id'],
  ['idx_session_transactions_club_created', 'session_transactions', 'club_id, created_at DESC'],
  ['idx_session_transactions_club_session_created', 'session_transactions', 'club_id, session_id, created_at DESC'],
  ['idx_products_club_created', 'shuttlecock_products', 'club_id, created_at DESC'],
  ['idx_products_club_status_name', 'shuttlecock_products', 'club_id, status, name'],
  ['idx_movements_club_created', 'shuttlecock_movements', 'club_id, created_at DESC'],
  ['idx_movements_club_product_created', 'shuttlecock_movements', 'club_id, shuttlecock_product_id, created_at DESC'],
  ['idx_player_images_club_player', 'session_player_images', 'club_id, session_player_id'],
  ['idx_player_images_club_status', 'session_player_images', 'club_id, status']
].map(([name, table, columns]) => ({ name, table, columns }));

export const TENANT_UNIQUES = [
  ['uq_play_dates_club_id_id', 'play_dates', 'club_id, id'],
  ['uq_play_sessions_club_id_id', 'play_sessions', 'club_id, id'],
  ['uq_products_club_id_id', 'shuttlecock_products', 'club_id, id'],
  ['uq_runtime_matches_club_id_id', 'runtime_matches', 'club_id, id'],
  ['uq_runtime_matches_club_session_id', 'runtime_matches', 'club_id, session_id, id'],
  ['uq_session_players_club_id_id', 'session_players', 'club_id, id'],
  ['uq_payment_banks_club_id_id', 'payment_bank_accounts', 'club_id, id'],
  ['uq_app_users_club_id_id', 'app_users', 'club_id, id'],
  ['uq_auth_sessions_club_id_id', 'auth_sessions', 'club_id, id'],
  ['uq_player_images_club_id_id', 'session_player_images', 'club_id, id'],
  ['uq_match_histories_club_id_id', 'match_histories', 'club_id, id'],
  ['uq_transactions_club_id_id', 'session_transactions', 'club_id, id'],
  ['uq_movements_club_id_id', 'shuttlecock_movements', 'club_id, id'],
  ['uq_play_dates_club_date', 'play_dates', 'club_id, play_date'],
  ['uq_runtime_courts_club_session_number', 'runtime_courts', 'club_id, session_id, court_number'],
  ['uq_runtime_matches_club_session_queue', 'runtime_matches', 'club_id, session_id, queue_order'],
  ['uq_runtime_matches_club_session_court', 'runtime_matches', 'club_id, session_id, court_number'],
  ['uq_role_permissions_club_role', 'app_role_permissions', 'club_id, role'],
  ['uq_history_players_club_history_player', 'match_history_players', 'club_id, match_history_id, session_player_id'],
  ['uq_session_summaries_club_session', 'session_summaries', 'club_id, session_id'],
  ['uq_inventory_club_product', 'shuttlecock_inventory', 'club_id, shuttlecock_product_id'],
  ['uq_app_users_club_email', 'app_users', 'club_id, email']
].map(([name, table, columns]) => ({ name, table, columns }));

export const TENANT_RELATIONS = [
  ['fk_play_sessions_tenant_date', 'play_sessions', 'club_id, play_date_id', 'play_dates', 'club_id, id', 'CASCADE'],
  ['fk_play_sessions_tenant_product', 'play_sessions', 'club_id, shuttlecock_product_id', 'shuttlecock_products', 'club_id, id', 'NO ACTION'],
  ['fk_runtime_matches_tenant_session', 'runtime_matches', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_runtime_courts_tenant_session', 'runtime_courts', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_runtime_courts_tenant_match', 'runtime_courts', 'club_id, session_id, runtime_match_id', 'runtime_matches', 'club_id, session_id, id', 'NO ACTION'],
  ['fk_session_players_tenant_session', 'session_players', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_app_settings_tenant_default_bank', 'app_settings', 'club_id, default_payment_bank_account_id', 'payment_bank_accounts', 'club_id, id', 'NO ACTION'],
  ['fk_auth_sessions_tenant_user', 'auth_sessions', 'club_id, user_id', 'app_users', 'club_id, id', 'CASCADE'],
  ['fk_player_images_tenant_player', 'session_player_images', 'club_id, session_player_id', 'session_players', 'club_id, id', 'CASCADE'],
  ['fk_match_histories_tenant_session', 'match_histories', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_history_players_tenant_history', 'match_history_players', 'club_id, match_history_id', 'match_histories', 'club_id, id', 'CASCADE'],
  ['fk_history_players_tenant_player', 'match_history_players', 'club_id, session_player_id', 'session_players', 'club_id, id', 'CASCADE'],
  ['fk_session_summaries_tenant_session', 'session_summaries', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_transactions_tenant_session', 'session_transactions', 'club_id, session_id', 'play_sessions', 'club_id, id', 'CASCADE'],
  ['fk_inventory_tenant_product', 'shuttlecock_inventory', 'club_id, shuttlecock_product_id', 'shuttlecock_products', 'club_id, id', 'NO ACTION'],
  ['fk_movements_tenant_product', 'shuttlecock_movements', 'club_id, shuttlecock_product_id', 'shuttlecock_products', 'club_id, id', 'NO ACTION']
].map(([name, table, columns, parentTable, parentColumns, onDelete]) => ({
  name, table, columns, parentTable, parentColumns, onDelete
}));

export const DIRECT_CLUB_FKS = TENANT_TABLES.map((table) => ({
  name: `fk_${table}_club`,
  table
}));

export const NOT_NULL_CHECKS = TENANT_TABLES.map((table) => ({
  name: `ck_${table}_club_id_nn`,
  table
}));

export function parseTarget(value, label) {
  if (!value) throw new Error(`${label} chưa được cấu hình.`);
  const url = new URL(value);
  return {
    hostname: url.hostname.replace('-pooler.', '.'),
    database: url.pathname.replace(/^\//, ''),
    role: decodeURIComponent(url.username)
  };
}

export function fingerprint(target) {
  return createHash('sha256')
    .update(`${target.hostname}|${target.database}|${target.role}`)
    .digest('hex')
    .slice(0, 12);
}

export function assertPhase8Target() {
  const pooled = parseTarget(process.env.DATABASE_URL, 'DATABASE_URL');
  const direct = parseTarget(process.env.DATABASE_URL_UNPOOLED, 'DATABASE_URL_UNPOOLED');
  const actual = fingerprint(pooled);
  if (
    pooled.hostname !== direct.hostname
    || pooled.database !== direct.database
    || pooled.role !== direct.role
    || pooled.database !== 'neondb'
    || pooled.role !== 'neondb_owner'
    || actual !== EXPECTED_FINGERPRINT
  ) throw new Error('Phase 8 target không khớp UAT đã duyệt.');
  if (process.env.BADMIN_LEGACY_CLUB_ID?.trim() !== LEGACY_CLUB_ID) {
    throw new Error('BADMIN_LEGACY_CLUB_ID không khớp Legacy Club đã duyệt.');
  }
  return { fingerprint: actual, database: pooled.database, role: pooled.role };
}

export function jsonReplacer(_key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}
