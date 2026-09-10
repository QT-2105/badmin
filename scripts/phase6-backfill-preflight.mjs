import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

import {
  EXPECTED_FINGERPRINT,
  LEGACY_CLUB_ID,
  PHASE6_TABLES,
  parseTarget
} from './phase6-backfill-contract.mjs';

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
    throw new Error('Phase 6 preflight target không khớp UAT đã duyệt.');
  }
  if (process.env.BADMIN_LEGACY_CLUB_ID?.trim() !== LEGACY_CLUB_ID) {
    throw new Error('BADMIN_LEGACY_CLUB_ID không khớp Legacy Club đã duyệt.');
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

    const [legacyClub] = await tx.$queryRawUnsafe(`
      SELECT id::text, code, status
      FROM control.clubs
      WHERE id = '${LEGACY_CLUB_ID}'::uuid
    `);
    const tables = [];
    for (const item of PHASE6_TABLES) {
      const [stats] = await tx.$queryRawUnsafe(`
        SELECT
          count(*) AS row_count,
          count(*) FILTER (WHERE club_id IS NULL) AS null_count,
          count(*) FILTER (WHERE club_id = '${LEGACY_CLUB_ID}'::uuid) AS legacy_count,
          count(*) FILTER (
            WHERE club_id IS NOT NULL AND club_id <> '${LEGACY_CLUB_ID}'::uuid
          ) AS unexpected_count,
          pg_total_relation_size('public.${item.table}'::regclass) AS total_bytes
        FROM public.${item.table}
      `);
      tables.push({
        ...item,
        ...stats,
        estimatedBatches: Number((stats.null_count + BigInt(item.batchSize) - 1n) / BigInt(item.batchSize)),
        rowCountMatchesBaseline: stats.row_count === item.expectedRows
      });
    }

    const activity = await tx.$queryRawUnsafe(`
      SELECT state, count(*)::bigint AS connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
      ORDER BY state
    `);
    const locks = await tx.$queryRawUnsafe(`
      SELECT granted, count(*)::bigint AS lock_count
      FROM pg_locks
      WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
      GROUP BY granted
      ORDER BY granted
    `);

    const allValid = legacyClub?.id === LEGACY_CLUB_ID
      && legacyClub?.code === 'tt-badminton'
      && legacyClub?.status === 'ACTIVE'
      && tables.every((item) => item.rowCountMatchesBaseline && item.unexpected_count === 0n);

    return {
      allValid,
      legacyClub,
      totalRows: tables.reduce((sum, item) => sum + item.row_count, 0n),
      totalNullRows: tables.reduce((sum, item) => sum + item.null_count, 0n),
      totalEstimatedBatches: tables.reduce((sum, item) => sum + item.estimatedBatches, 0),
      tables,
      currentDatabaseActivity: activity,
      currentDatabaseLocks: locks,
      riskAssessment: {
        lockRisk: 'LOW_AT_CURRENT_SCALE',
        retry: 'IDEMPOTENT_WHERE_CLUB_ID_IS_NULL',
        rollback: 'CLEAR_ONLY_LEGACY_CLUB_ID_AFTER_EXACT_ROW_AND_OWNER_ASSERTIONS',
        estimatedDuration: 'UNDER_15_SECONDS_PER_REHEARSAL_AT_CURRENT_SCALE'
      }
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
  if (!report.allValid) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
