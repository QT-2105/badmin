export const EXPECTED_FINGERPRINT = 'c2f96ce9dcd6';
export const LEGACY_CLUB_ID = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';

export const PHASE6_TABLES = [
  { order: 1, group: 'independent_parent', table: 'play_dates', key: 'id', batchSize: 100, expectedRows: 21n },
  { order: 2, group: 'independent_parent', table: 'shuttlecock_products', key: 'id', batchSize: 100, expectedRows: 1n },
  { order: 3, group: 'independent_parent', table: 'payment_bank_accounts', key: 'id', batchSize: 100, expectedRows: 2n },
  { order: 4, group: 'independent_parent', table: 'app_users', key: 'id', batchSize: 100, expectedRows: 5n },
  { order: 5, group: 'independent_parent', table: 'app_role_permissions', key: 'role', batchSize: 100, expectedRows: 3n },
  { order: 6, group: 'independent_parent', table: 'app_settings', key: 'id', batchSize: 100, expectedRows: 1n },
  { order: 7, group: 'session', table: 'play_sessions', key: 'id', batchSize: 100, expectedRows: 21n },
  { order: 8, group: 'session', table: 'session_players', key: 'id', batchSize: 500, expectedRows: 437n },
  { order: 9, group: 'runtime_history', table: 'runtime_matches', key: 'id', batchSize: 250, expectedRows: 3n },
  { order: 10, group: 'runtime_history', table: 'match_histories', key: 'id', batchSize: 500, expectedRows: 530n },
  { order: 11, group: 'runtime_history', table: 'session_summaries', key: 'id', batchSize: 250, expectedRows: 21n },
  { order: 12, group: 'runtime_history', table: 'runtime_courts', key: 'id', batchSize: 250, expectedRows: 52n },
  { order: 13, group: 'runtime_history', table: 'match_history_players', key: 'id', batchSize: 500, expectedRows: 2120n },
  { order: 14, group: 'finance_inventory', table: 'session_transactions', key: 'id', batchSize: 250, expectedRows: 53n },
  { order: 15, group: 'finance_inventory', table: 'shuttlecock_inventory', key: 'id', batchSize: 100, expectedRows: 1n },
  { order: 16, group: 'finance_inventory', table: 'shuttlecock_movements', key: 'id', batchSize: 250, expectedRows: 29n },
  { order: 17, group: 'image_auth_child', table: 'session_player_images', key: 'id', batchSize: 250, expectedRows: 34n },
  { order: 18, group: 'image_auth_child', table: 'auth_sessions', key: 'id', batchSize: 250, expectedRows: 3n }
];

export const PHASE6_RELATIONS = [
  ['play_sessions', 'play_date_id', 'play_dates', 'id', false],
  ['play_sessions', 'shuttlecock_product_id', 'shuttlecock_products', 'id', true],
  ['session_players', 'session_id', 'play_sessions', 'id', false],
  ['runtime_matches', 'session_id', 'play_sessions', 'id', false],
  ['runtime_courts', 'session_id', 'play_sessions', 'id', false],
  ['runtime_courts', 'runtime_match_id', 'runtime_matches', 'id', true],
  ['match_histories', 'session_id', 'play_sessions', 'id', false],
  ['match_history_players', 'match_history_id', 'match_histories', 'id', false],
  ['match_history_players', 'session_player_id', 'session_players', 'id', false],
  ['session_summaries', 'session_id', 'play_sessions', 'id', false],
  ['session_transactions', 'session_id', 'play_sessions', 'id', true],
  ['shuttlecock_inventory', 'shuttlecock_product_id', 'shuttlecock_products', 'id', false],
  ['shuttlecock_movements', 'shuttlecock_product_id', 'shuttlecock_products', 'id', false],
  ['session_player_images', 'session_player_id', 'session_players', 'id', false],
  ['auth_sessions', 'user_id', 'app_users', 'id', false],
  ['app_settings', 'default_payment_bank_account_id', 'payment_bank_accounts', 'id', true]
];

export function parseTarget(value, label) {
  if (!value) throw new Error(`${label} chưa được cấu hình.`);
  const url = new URL(value);
  return {
    hostname: url.hostname.replace('-pooler.', '.'),
    database: url.pathname.replace(/^\//, ''),
    role: decodeURIComponent(url.username)
  };
}
