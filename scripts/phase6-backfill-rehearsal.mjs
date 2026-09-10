import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { PrismaClient } from '@prisma/client';

import {
  EXPECTED_FINGERPRINT,
  LEGACY_CLUB_ID,
  PHASE6_RELATIONS,
  PHASE6_TABLES,
  parseTarget
} from './phase6-backfill-contract.mjs';

const action = process.argv[2];
const confirmation = process.argv.find((value) => value.startsWith('--confirm='))?.slice('--confirm='.length);
if (!['apply', 'reset', 'validate'].includes(action)) {
  throw new Error('Dùng một action: apply, reset, validate.');
}
if (confirmation !== EXPECTED_FINGERPRINT) {
  throw new Error(`Thiếu --confirm=${EXPECTED_FINGERPRINT}. Dừng Phase 6.`);
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
    throw new Error('Phase 6 target không khớp UAT đã duyệt.');
  }
  if (process.env.BADMIN_LEGACY_CLUB_ID?.trim() !== LEGACY_CLUB_ID) {
    throw new Error('BADMIN_LEGACY_CLUB_ID không khớp Legacy Club đã duyệt.');
  }
  return { fingerprint: actual, database: pooled.database, role: pooled.role };
}

function jsonReplacer(_key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

async function databaseStats(prisma) {
  const [stats] = await prisma.$queryRawUnsafe(`
    SELECT xact_commit, xact_rollback, blks_read, blks_hit, temp_bytes, deadlocks
    FROM pg_stat_database
    WHERE datname = current_database()
  `);
  return stats;
}

function subtractStats(after, before) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - before[key]]));
}

async function tableSnapshot(client, item) {
  const [result] = await client.$queryRawUnsafe(`
    SELECT
      count(*) AS row_count,
      count(*) FILTER (WHERE club_id IS NULL) AS null_count,
      count(*) FILTER (WHERE club_id = '${LEGACY_CLUB_ID}'::uuid) AS legacy_count,
      count(*) FILTER (
        WHERE club_id IS NOT NULL AND club_id <> '${LEGACY_CLUB_ID}'::uuid
      ) AS unexpected_count,
      md5(COALESCE(
        string_agg((to_jsonb(t) - 'club_id')::text, '' ORDER BY ${item.key}::text),
        ''
      )) AS business_checksum
    FROM public.${item.table} t
  `);
  return { table: item.table, ...result };
}

async function snapshots(client) {
  const result = [];
  for (const item of PHASE6_TABLES) result.push(await tableSnapshot(client, item));
  return result;
}

function assertSafeState(rows, expectedState) {
  for (const item of PHASE6_TABLES) {
    const row = rows.find((candidate) => candidate.table === item.table);
    if (!row || row.row_count !== item.expectedRows || row.unexpected_count !== 0n) {
      throw new Error(`${item.table}: row count hoặc tenant owner lệch baseline.`);
    }
    if (expectedState === 'fully_backfilled' && (row.null_count !== 0n || row.legacy_count !== row.row_count)) {
      throw new Error(`${item.table}: chưa ở trạng thái backfill đầy đủ.`);
    }
    if (expectedState === 'fully_reset' && (row.null_count !== row.row_count || row.legacy_count !== 0n)) {
      throw new Error(`${item.table}: chưa reset ownership về baseline.`);
    }
  }
}

function assertBusinessChecksumsUnchanged(before, after) {
  for (const row of before) {
    const current = after.find((candidate) => candidate.table === row.table);
    if (current?.business_checksum !== row.business_checksum || current?.row_count !== row.row_count) {
      throw new Error(`${row.table}: dữ liệu nghiệp vụ hoặc row count đã thay đổi.`);
    }
  }
}

async function assertLegacyClub(prisma) {
  const [club] = await prisma.$queryRawUnsafe(`
    SELECT id::text, code, status
    FROM control.clubs
    WHERE id = '${LEGACY_CLUB_ID}'::uuid
  `);
  if (club?.id !== LEGACY_CLUB_ID || club?.code !== 'tt-badminton' || club?.status !== 'ACTIVE') {
    throw new Error('Legacy Club control record không đúng contract.');
  }
}

async function updateTableInBatches(prisma, item, mode) {
  let updatedRows = 0;
  let batches = 0;
  while (true) {
    const changed = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");
      if (mode === 'apply') {
        return tx.$executeRawUnsafe(`
          WITH batch AS (
            SELECT ${item.key}
            FROM public.${item.table}
            WHERE club_id IS NULL
            ORDER BY ${item.key}
            LIMIT ${item.batchSize}
            FOR UPDATE SKIP LOCKED
          )
          UPDATE public.${item.table} target
          SET club_id = '${LEGACY_CLUB_ID}'::uuid
          FROM batch
          WHERE target.${item.key} = batch.${item.key}
        `);
      }
      return tx.$executeRawUnsafe(`
        WITH batch AS (
          SELECT ${item.key}
          FROM public.${item.table}
          WHERE club_id = '${LEGACY_CLUB_ID}'::uuid
          ORDER BY ${item.key}
          LIMIT ${item.batchSize}
          FOR UPDATE SKIP LOCKED
        )
        UPDATE public.${item.table} target
        SET club_id = NULL
        FROM batch
        WHERE target.${item.key} = batch.${item.key}
      `);
    }, { maxWait: 10_000, timeout: 60_000 });
    if (changed === 0) break;
    updatedRows += changed;
    batches += 1;
  }
  return { table: item.table, batchSize: item.batchSize, batches, updatedRows };
}

async function validationReport(prisma) {
  const tableRows = await snapshots(prisma);
  const relations = [];
  for (const [childTable, childKey, parentTable, parentKey, nullable] of PHASE6_RELATIONS) {
    const [result] = await prisma.$queryRawUnsafe(`
      SELECT
        count(*) FILTER (
          WHERE child.${childKey} IS NOT NULL AND parent.${parentKey} IS NULL
        ) AS orphan_count,
        count(*) FILTER (
          WHERE child.${childKey} IS NOT NULL
            AND parent.${parentKey} IS NOT NULL
            AND child.club_id IS DISTINCT FROM parent.club_id
        ) AS tenant_mismatch_count
      FROM public.${childTable} child
      LEFT JOIN public.${parentTable} parent ON parent.${parentKey} = child.${childKey}
    `);
    relations.push({ childTable, childKey, parentTable, nullable, ...result });
  }

  const [finance] = await prisma.$queryRawUnsafe(`
    SELECT
      count(*) AS transaction_count,
      COALESCE(sum(total_amount), 0)::text AS transaction_amount,
      count(*) FILTER (WHERE session_id IS NULL) AS manual_transaction_count
    FROM session_transactions
  `);
  const [sessions] = await prisma.$queryRawUnsafe(`
    SELECT
      count(*) AS session_count,
      COALESCE(sum(total_income), 0)::text AS total_income,
      COALESCE(sum(total_expense), 0)::text AS total_expense,
      COALESCE(sum(total_profit), 0)::text AS total_profit,
      count(*) FILTER (WHERE status = 'LIVE') AS live_count
    FROM play_sessions
  `);
  const [inventory] = await prisma.$queryRawUnsafe(`
    WITH movement AS (
      SELECT shuttlecock_product_id, COALESCE(sum(quantity_ball), 0)::bigint AS quantity
      FROM shuttlecock_movements
      GROUP BY shuttlecock_product_id
    )
    SELECT
      count(*) AS inventory_count,
      COALESCE(sum(i.quantity_ball), 0)::bigint AS stock_quantity,
      COALESCE(sum(m.quantity), 0)::bigint AS movement_quantity,
      count(*) FILTER (WHERE i.quantity_ball < 0) AS negative_stock_count,
      count(*) FILTER (WHERE i.quantity_ball IS DISTINCT FROM m.quantity) AS mismatch_count
    FROM shuttlecock_inventory i
    LEFT JOIN movement m ON m.shuttlecock_product_id = i.shuttlecock_product_id
  `);
  const [runtime] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM runtime_courts) AS court_count,
      (SELECT count(*) FROM runtime_matches) AS match_count,
      (SELECT count(*) FROM match_histories) AS history_count,
      (SELECT count(*) FROM match_history_players) AS history_player_count,
      (SELECT COALESCE(max(runtime_version), 0) FROM play_sessions) AS max_revision
  `);
  const [configuration] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM app_settings) AS settings_count,
      (SELECT count(*) FROM payment_bank_accounts) AS bank_count,
      (SELECT count(*) FROM app_role_permissions) AS permission_count,
      (SELECT count(*) FROM app_users) AS user_count,
      (SELECT count(*) FROM auth_sessions) AS auth_session_count
  `);
  const [schemaBoundary] = await prisma.$queryRawUnsafe(`
    SELECT
      count(*) FILTER (
        WHERE is_nullable = 'YES' AND column_default IS NULL
      ) AS nullable_no_default_column_count,
      count(*) AS club_id_column_count,
      (
        SELECT count(*)
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
          AND pg_get_constraintdef(oid) ILIKE '%club_id%'
      ) AS tenant_constraint_count,
      (
        SELECT count(*)
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexdef ILIKE '%club_id%'
      ) AS tenant_index_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'club_id'
  `);

  const valid = tableRows.every((row) => row.null_count === 0n
      && row.unexpected_count === 0n
      && row.legacy_count === row.row_count)
    && relations.every((row) => row.orphan_count === 0n && row.tenant_mismatch_count === 0n)
    && inventory.negative_stock_count === 0n
    && inventory.mismatch_count === 0n
    && schemaBoundary.club_id_column_count === 18n
    && schemaBoundary.nullable_no_default_column_count === 18n
    && schemaBoundary.tenant_constraint_count === 0n
    && schemaBoundary.tenant_index_count === 0n;

  return {
    valid,
    tables: tableRows,
    relations,
    finance,
    sessions,
    inventory,
    runtime,
    configuration,
    schemaBoundary
  };
}

const target = assertTarget();
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } }
});

try {
  await assertLegacyClub(prisma);
  const beforeStats = await databaseStats(prisma);
  const before = await snapshots(prisma);
  const startedAt = new Date();
  const start = performance.now();
  let operations = [];

  if (action === 'apply') {
    for (const item of PHASE6_TABLES) operations.push(await updateTableInBatches(prisma, item, 'apply'));
  } else if (action === 'reset') {
    assertSafeState(before, 'fully_backfilled');
    for (const item of [...PHASE6_TABLES].reverse()) {
      operations.push(await updateTableInBatches(prisma, item, 'reset'));
    }
  }

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  const after = await snapshots(prisma);
  assertBusinessChecksumsUnchanged(before, after);
  if (action === 'apply') assertSafeState(after, 'fully_backfilled');
  if (action === 'reset') assertSafeState(after, 'fully_reset');
  const reconciliation = action === 'reset' ? null : await validationReport(prisma);
  if (reconciliation && !reconciliation.valid) throw new Error('Phase 6 reconciliation không đạt.');
  const afterStats = await databaseStats(prisma);

  console.log(JSON.stringify({
    target,
    action,
    startedAt,
    durationMs,
    operations,
    databaseLoadDelta: subtractStats(afterStats, beforeStats),
    before,
    after,
    reconciliation
  }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
