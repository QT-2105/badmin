import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const EXPECTED_TABLES = [
  'app_role_permissions',
  'app_settings',
  'app_users',
  'auth_sessions',
  'match_histories',
  'match_history_players',
  'payment_bank_accounts',
  'play_dates',
  'play_sessions',
  'runtime_courts',
  'runtime_matches',
  'session_player_images',
  'session_players',
  'session_summaries',
  'session_transactions',
  'shuttlecock_inventory',
  'shuttlecock_movements',
  'shuttlecock_products'
];

function normalizeEndpoint(hostname) {
  return hostname.replace('-pooler.', '.');
}

function parseDatabaseTarget(value, label) {
  if (!value) throw new Error(`${label} chưa được cấu hình.`);

  const url = new URL(value);
  return {
    hostname: url.hostname,
    normalizedHostname: normalizeEndpoint(url.hostname),
    database: url.pathname.replace(/^\//, ''),
    role: decodeURIComponent(url.username),
    pooled: url.hostname.includes('-pooler.'),
    sslmode: url.searchParams.get('sslmode')
  };
}

function targetFingerprint(target) {
  return createHash('sha256')
    .update(`${target.normalizedHostname}|${target.database}|${target.role}`)
    .digest('hex')
    .slice(0, 12);
}

function validateTargetConfirmation() {
  const pooled = parseDatabaseTarget(process.env.DATABASE_URL, 'DATABASE_URL');
  const direct = parseDatabaseTarget(process.env.DATABASE_URL_UNPOOLED, 'DATABASE_URL_UNPOOLED');

  if (
    pooled.normalizedHostname !== direct.normalizedHostname
    || pooled.database !== direct.database
    || pooled.role !== direct.role
  ) {
    throw new Error('DATABASE_URL và DATABASE_URL_UNPOOLED không cùng endpoint/database/role. Dừng audit.');
  }

  if (!pooled.pooled || direct.pooled) {
    throw new Error('Cấu hình pooled/unpooled không đúng vai trò mong đợi. Dừng audit.');
  }

  const fingerprint = targetFingerprint(pooled);
  const confirmation = process.env.BADMIN_UAT_DB_TARGET_FINGERPRINT?.trim();
  if (confirmation !== fingerprint) {
    throw new Error(
      `Chưa xác nhận đúng UAT target. Xác minh Neon project/branch cho fingerprint ${fingerprint}, `
      + 'sau đó đặt BADMIN_UAT_DB_TARGET_FINGERPRINT bằng fingerprint này trong phiên audit.'
    );
  }

  return {
    fingerprint,
    provider: pooled.hostname.includes('neon.tech') ? 'neon' : 'other',
    database: pooled.database,
    role: pooled.role,
    pooledAndDirectMatch: true
  };
}

function jsonValue(_key, value) {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && typeof value.toJSON === 'function') return value.toJSON();
  return value;
}

function extractPlayerId(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  return value.player_id ?? value.playerId ?? value.id ?? value.session_player_id ?? value.sessionPlayerId ?? null;
}

function extractTeamIds(value) {
  const values = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray(value.players)
      ? value.players
      : [];

  return values.map(extractPlayerId).filter((value) => typeof value === 'string');
}

function inspectRuntimeRosters(matches, players) {
  const playerSession = new Map(players.map((player) => [player.id, player.session_id]));
  let malformedRosterCount = 0;
  let duplicatePlayerRosterCount = 0;
  let missingPlayerReferenceCount = 0;
  let crossSessionPlayerReferenceCount = 0;

  for (const match of matches) {
    const teamA = extractTeamIds(match.team_a);
    const teamB = extractTeamIds(match.team_b);
    const roster = [...teamA, ...teamB];
    if (roster.length !== 4) malformedRosterCount += 1;
    if (new Set(roster).size !== roster.length) duplicatePlayerRosterCount += 1;

    for (const playerId of roster) {
      const sessionId = playerSession.get(playerId);
      if (!sessionId) missingPlayerReferenceCount += 1;
      else if (sessionId !== match.session_id) crossSessionPlayerReferenceCount += 1;
    }
  }

  return {
    malformedRosterCount,
    duplicatePlayerRosterCount,
    missingPlayerReferenceCount,
    crossSessionPlayerReferenceCount
  };
}

const target = validateTargetConfirmation();
const prisma = new PrismaClient({ log: ['error'] });

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");

    const [environment] = await tx.$queryRawUnsafe(`
      SELECT
        current_database() AS database,
        current_user AS role,
        current_schema() AS schema,
        current_setting('transaction_read_only') AS transaction_read_only,
        pg_is_in_recovery() AS server_in_recovery,
        now() AS captured_at
    `);

    const tables = await tx.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const constraints = await tx.$queryRawUnsafe(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
    `);

    const indexes = await tx.$queryRawUnsafe(`
      SELECT tablename AS table_name, indexname AS index_name
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const rowCounts = await tx.$queryRawUnsafe(`
      SELECT 'app_role_permissions' AS table_name, COUNT(*)::bigint AS row_count FROM app_role_permissions
      UNION ALL SELECT 'app_settings', COUNT(*)::bigint FROM app_settings
      UNION ALL SELECT 'app_users', COUNT(*)::bigint FROM app_users
      UNION ALL SELECT 'auth_sessions', COUNT(*)::bigint FROM auth_sessions
      UNION ALL SELECT 'match_histories', COUNT(*)::bigint FROM match_histories
      UNION ALL SELECT 'match_history_players', COUNT(*)::bigint FROM match_history_players
      UNION ALL SELECT 'payment_bank_accounts', COUNT(*)::bigint FROM payment_bank_accounts
      UNION ALL SELECT 'play_dates', COUNT(*)::bigint FROM play_dates
      UNION ALL SELECT 'play_sessions', COUNT(*)::bigint FROM play_sessions
      UNION ALL SELECT 'runtime_courts', COUNT(*)::bigint FROM runtime_courts
      UNION ALL SELECT 'runtime_matches', COUNT(*)::bigint FROM runtime_matches
      UNION ALL SELECT 'session_player_images', COUNT(*)::bigint FROM session_player_images
      UNION ALL SELECT 'session_players', COUNT(*)::bigint FROM session_players
      UNION ALL SELECT 'session_summaries', COUNT(*)::bigint FROM session_summaries
      UNION ALL SELECT 'session_transactions', COUNT(*)::bigint FROM session_transactions
      UNION ALL SELECT 'shuttlecock_inventory', COUNT(*)::bigint FROM shuttlecock_inventory
      UNION ALL SELECT 'shuttlecock_movements', COUNT(*)::bigint FROM shuttlecock_movements
      UNION ALL SELECT 'shuttlecock_products', COUNT(*)::bigint FROM shuttlecock_products
      ORDER BY table_name
    `);

    const usersByRoleStatus = await tx.$queryRawUnsafe(`
      SELECT role, status, COUNT(*)::bigint AS user_count
      FROM app_users
      GROUP BY role, status
      ORDER BY role, status
    `);

    const authSessionSummary = await tx.$queryRawUnsafe(`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE expires_at <= now())::bigint AS expired,
        COUNT(*) FILTER (WHERE expires_at > now())::bigint AS unexpired
      FROM auth_sessions
    `);

    const sessionsByStatus = await tx.$queryRawUnsafe(`
      SELECT status, COUNT(*)::bigint AS session_count
      FROM play_sessions
      GROUP BY status
      ORDER BY status
    `);

    const sessionFinancialTotals = await tx.$queryRawUnsafe(`
      SELECT
        COALESCE(SUM(total_income), 0)::text AS total_income,
        COALESCE(SUM(total_expense), 0)::text AS total_expense,
        COALESCE(SUM(total_profit), 0)::text AS total_profit
      FROM play_sessions
    `);

    const transactionTotals = await tx.$queryRawUnsafe(`
      SELECT
        transaction_type,
        adjustment_type,
        COUNT(*)::bigint AS transaction_count,
        COALESCE(SUM(total_amount), 0)::text AS total_amount
      FROM session_transactions
      GROUP BY transaction_type, adjustment_type
      ORDER BY transaction_type, adjustment_type
    `);

    const movementTotals = await tx.$queryRawUnsafe(`
      SELECT
        movement_type,
        COUNT(*)::bigint AS movement_count,
        COALESCE(SUM(quantity_ball), 0)::bigint AS quantity_ball
      FROM shuttlecock_movements
      GROUP BY movement_type
      ORDER BY movement_type
    `);

    const inventoryReconciliation = await tx.$queryRawUnsafe(`
      WITH movement_totals AS (
        SELECT shuttlecock_product_id, SUM(quantity_ball)::bigint AS movement_quantity
        FROM shuttlecock_movements
        GROUP BY shuttlecock_product_id
      )
      SELECT
        COUNT(p.id)::bigint AS product_count,
        COUNT(i.id)::bigint AS inventory_row_count,
        COUNT(*) FILTER (WHERE i.quantity_ball < 0)::bigint AS negative_inventory_count,
        COUNT(*) FILTER (
          WHERE i.id IS NOT NULL
            AND i.quantity_ball::bigint <> COALESCE(m.movement_quantity, 0)
        )::bigint AS product_mismatch_count,
        COALESCE(SUM(i.quantity_ball), 0)::bigint AS inventory_quantity,
        COALESCE(SUM(m.movement_quantity), 0)::bigint AS movement_quantity
      FROM shuttlecock_products p
      LEFT JOIN shuttlecock_inventory i ON i.shuttlecock_product_id = p.id
      LEFT JOIN movement_totals m ON m.shuttlecock_product_id = p.id
    `);

    const runtimeCounts = await tx.$queryRawUnsafe(`
      SELECT 'court:' || status AS category, COUNT(*)::bigint AS item_count
      FROM runtime_courts GROUP BY status
      UNION ALL
      SELECT 'match:' || status, COUNT(*)::bigint
      FROM runtime_matches GROUP BY status
      UNION ALL
      SELECT 'history', COUNT(*)::bigint FROM match_histories
      UNION ALL
      SELECT 'history_player', COUNT(*)::bigint FROM match_history_players
      ORDER BY category
    `);

    const settingsSnapshot = await tx.$queryRawUnsafe(`
      SELECT
        COUNT(*)::bigint AS settings_row_count,
        COUNT(*) FILTER (WHERE logo_s3_key IS NOT NULL)::bigint AS configured_logo_count,
        COUNT(*) FILTER (WHERE default_payment_bank_account_id IS NOT NULL)::bigint AS configured_default_account_count,
        MIN(max_court_count_per_session) AS min_max_court_count,
        MAX(max_court_count_per_session) AS max_max_court_count,
        COUNT(*) FILTER (WHERE auto_create_court_fee_transaction)::bigint AS auto_court_fee_enabled_count,
        COUNT(*) FILTER (WHERE auto_create_shuttlecock_usage_transaction)::bigint AS auto_shuttlecock_enabled_count
      FROM app_settings
    `);

    const permissionSnapshot = await tx.$queryRawUnsafe(`
      SELECT role, jsonb_array_length(permissions::jsonb)::bigint AS permission_count
      FROM app_role_permissions
      ORDER BY role
    `);

    const storageReferenceCounts = await tx.$queryRawUnsafe(`
      SELECT
        (SELECT COUNT(*) FROM session_players WHERE avatar_s3_key IS NOT NULL)::bigint AS player_avatar_count,
        (SELECT COUNT(*) FROM session_player_images)::bigint AS player_image_row_count,
        (SELECT COUNT(DISTINCT s3_key) FROM session_player_images)::bigint AS unique_player_image_key_count,
        (SELECT COUNT(*) FROM payment_bank_accounts WHERE qr_s3_key IS NOT NULL)::bigint AS payment_qr_count,
        (SELECT COUNT(*) FROM app_settings WHERE logo_s3_key IS NOT NULL)::bigint AS branding_logo_count
    `);

    const orphanCounts = await tx.$queryRawUnsafe(`
      SELECT 'play_sessions_without_play_date' AS anomaly, COUNT(*)::bigint AS item_count
      FROM play_sessions c LEFT JOIN play_dates p ON p.id = c.play_date_id WHERE p.id IS NULL
      UNION ALL SELECT 'session_players_without_session', COUNT(*)::bigint
      FROM session_players c LEFT JOIN play_sessions p ON p.id = c.session_id WHERE p.id IS NULL
      UNION ALL SELECT 'runtime_courts_without_session', COUNT(*)::bigint
      FROM runtime_courts c LEFT JOIN play_sessions p ON p.id = c.session_id WHERE p.id IS NULL
      UNION ALL SELECT 'runtime_matches_without_session', COUNT(*)::bigint
      FROM runtime_matches c LEFT JOIN play_sessions p ON p.id = c.session_id WHERE p.id IS NULL
      UNION ALL SELECT 'match_histories_without_session', COUNT(*)::bigint
      FROM match_histories c LEFT JOIN play_sessions p ON p.id = c.session_id WHERE p.id IS NULL
      UNION ALL SELECT 'history_players_without_history', COUNT(*)::bigint
      FROM match_history_players c LEFT JOIN match_histories p ON p.id = c.match_history_id WHERE p.id IS NULL
      UNION ALL SELECT 'history_players_without_session_player', COUNT(*)::bigint
      FROM match_history_players c LEFT JOIN session_players p ON p.id = c.session_player_id WHERE p.id IS NULL
      UNION ALL SELECT 'history_players_cross_session', COUNT(*)::bigint
      FROM match_history_players hp
      JOIN match_histories h ON h.id = hp.match_history_id
      JOIN session_players sp ON sp.id = hp.session_player_id
      WHERE h.session_id <> sp.session_id
      UNION ALL SELECT 'session_summaries_without_session', COUNT(*)::bigint
      FROM session_summaries c LEFT JOIN play_sessions p ON p.id = c.session_id WHERE p.id IS NULL
      UNION ALL SELECT 'transactions_without_referenced_session', COUNT(*)::bigint
      FROM session_transactions c LEFT JOIN play_sessions p ON p.id = c.session_id
      WHERE c.session_id IS NOT NULL AND p.id IS NULL
      UNION ALL SELECT 'inventory_without_product', COUNT(*)::bigint
      FROM shuttlecock_inventory c LEFT JOIN shuttlecock_products p ON p.id = c.shuttlecock_product_id WHERE p.id IS NULL
      UNION ALL SELECT 'movements_without_product', COUNT(*)::bigint
      FROM shuttlecock_movements c LEFT JOIN shuttlecock_products p ON p.id = c.shuttlecock_product_id WHERE p.id IS NULL
      UNION ALL SELECT 'images_without_session_player', COUNT(*)::bigint
      FROM session_player_images c LEFT JOIN session_players p ON p.id = c.session_player_id WHERE p.id IS NULL
      UNION ALL SELECT 'settings_missing_default_account', COUNT(*)::bigint
      FROM app_settings s LEFT JOIN payment_bank_accounts a ON a.id = s.default_payment_bank_account_id
      WHERE s.default_payment_bank_account_id IS NOT NULL AND a.id IS NULL
      ORDER BY anomaly
    `);

    const [runtimeMatches, sessionPlayers] = await Promise.all([
      tx.runtime_matches.findMany({ select: { session_id: true, team_a: true, team_b: true } }),
      tx.session_players.findMany({ select: { id: true, session_id: true } })
    ]);

    const tableNames = tables.map((row) => row.table_name);
    const missingExpectedTables = EXPECTED_TABLES.filter((table) => !tableNames.includes(table));
    const unexpectedPublicTables = tableNames.filter((table) => !EXPECTED_TABLES.includes(table) && table !== '_prisma_migrations');

    return {
      reportVersion: '2026-08-26',
      target,
      environment,
      schemaInventory: {
        expectedTableCount: EXPECTED_TABLES.length,
        actualTableCount: tableNames.length,
        missingExpectedTables,
        unexpectedPublicTables,
        constraintCount: constraints.length,
        indexCount: indexes.length,
        constraintNames: constraints,
        indexNames: indexes
      },
      baseline: {
        rowCounts,
        usersByRoleStatus,
        authSessionSummary,
        sessionsByStatus,
        sessionFinancialTotals,
        transactionTotals,
        movementTotals,
        inventoryReconciliation,
        runtimeCounts,
        settingsSnapshot,
        permissionSnapshot,
        storageReferenceCounts
      },
      anomalies: {
        orphanCounts,
        runtimeRosters: inspectRuntimeRosters(runtimeMatches, sessionPlayers)
      },
      privacy: {
        rawPiiIncluded: false,
        rawTokensOrHashesIncluded: false,
        objectKeysOrUrlsIncluded: false
      }
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify(report, jsonValue, 2));
} finally {
  await prisma.$disconnect();
}
