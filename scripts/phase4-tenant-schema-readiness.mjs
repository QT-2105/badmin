import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const EXPECTED_FINGERPRINT = 'c2f96ce9dcd6';
const PHASES = {
  '4A': [
    'app_users',
    'auth_sessions',
    'app_role_permissions',
    'app_settings',
    'payment_bank_accounts'
  ],
  '4B': ['play_dates', 'play_sessions', 'session_players'],
  '4C': [
    'runtime_courts',
    'runtime_matches',
    'match_histories',
    'match_history_players',
    'session_summaries'
  ],
  '4D': [
    'session_transactions',
    'shuttlecock_products',
    'shuttlecock_inventory',
    'shuttlecock_movements',
    'session_player_images'
  ]
};
const EXPECTED_ROW_COUNTS = {
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
const requestedPhase = process.argv[2]?.toUpperCase();
if (requestedPhase && !PHASES[requestedPhase]) {
  throw new Error(`Phase không hợp lệ: ${requestedPhase}`);
}
const SELECTED_PHASES = requestedPhase
  ? { [requestedPhase]: PHASES[requestedPhase] }
  : PHASES;
const TABLES = Object.values(SELECTED_PHASES).flat();
const TABLE_LIST_SQL = TABLES.map((table) => `'${table}'`).join(', ');

function parseTarget(value, label) {
  if (!value) throw new Error(`${label} chưa được cấu hình.`);
  const url = new URL(value);
  return {
    hostname: url.hostname.replace('-pooler.', '.'),
    database: url.pathname.replace(/^\//, ''),
    role: decodeURIComponent(url.username)
  };
}

function fingerprint(target) {
  return createHash('sha256')
    .update(`${target.hostname}|${target.database}|${target.role}`)
    .digest('hex')
    .slice(0, 12);
}

function assertTarget() {
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
  ) {
    throw new Error('Phase 4 diagnostic target không khớp UAT đã duyệt.');
  }
  return { fingerprint: actual, database: pooled.database, role: pooled.role };
}

function jsonReplacer(_key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

const target = assertTarget();
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } }
});

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");

    const metadata = await tx.$queryRawUnsafe(`
      SELECT
        table_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'club_id'
        AND table_name IN (${TABLE_LIST_SQL})
      ORDER BY table_name
    `);

    const rowCounts = [];
    for (const table of TABLES) {
      const [count] = await tx.$queryRawUnsafe(`
        SELECT count(*) AS row_count, count(club_id) AS populated_club_id_count
        FROM public.${table}
      `);
      rowCounts.push({ table, ...count });
    }

    const tenantConstraints = await tx.$queryRawUnsafe(`
      SELECT conrelid::regclass::text AS table_name, conname AS constraint_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
        AND pg_get_constraintdef(oid) ILIKE '%club_id%'
      ORDER BY table_name, constraint_name
    `);
    const tenantIndexes = await tx.$queryRawUnsafe(`
      SELECT tablename AS table_name, indexname AS index_name
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexdef ILIKE '%club_id%'
      ORDER BY table_name, index_name
    `);

    const metadataByTable = new Map(metadata.map((item) => [item.table_name, item]));
    const countsByTable = new Map(rowCounts.map((item) => [item.table, item]));
    const phases = Object.fromEntries(Object.entries(SELECTED_PHASES).map(([phase, tables]) => {
      const valid = tables.every((table) => {
        const column = metadataByTable.get(table);
        const counts = countsByTable.get(table);
        return column?.data_type === 'uuid'
          && column?.udt_name === 'uuid'
          && column?.is_nullable === 'YES'
          && column?.column_default === null
          && counts?.populated_club_id_count === 0n
          && counts?.row_count === EXPECTED_ROW_COUNTS[table];
      });
      return [phase, { valid, tables }];
    }));

    const allValid = metadata.length === TABLES.length
      && Object.values(phases).every((phase) => phase.valid)
      && tenantConstraints.length === 0
      && tenantIndexes.length === 0;

    return {
      allValid,
      phaseStatus: phases,
      columnCount: metadata.length,
      columns: metadata,
      rowCounts,
      tenantConstraintCount: tenantConstraints.length,
      tenantIndexCount: tenantIndexes.length
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
  if (!report.allValid) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
