import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const EXPECTED_FINGERPRINT = 'c2f96ce9dcd6';
const LEGACY_CLUB_ID = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';
const BASELINE_NULL_COUNTS = {
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
    throw new Error('Phase 5 monitor target không khớp UAT đã duyệt.');
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
    for (const [table, baselineNullCount] of Object.entries(BASELINE_NULL_COUNTS)) {
      const [counts] = await tx.$queryRawUnsafe(`
        SELECT
          count(*) AS row_count,
          count(*) FILTER (WHERE club_id IS NULL) AS null_count,
          count(*) FILTER (WHERE club_id = '${LEGACY_CLUB_ID}'::uuid) AS legacy_count,
          count(*) FILTER (
            WHERE club_id IS NOT NULL
              AND club_id <> '${LEGACY_CLUB_ID}'::uuid
          ) AS unexpected_club_count
        FROM public.${table}
      `);
      tables.push({
        table,
        baselineNullCount,
        ...counts,
        newNullDelta: counts.null_count - baselineNullCount,
        valid: counts.null_count <= baselineNullCount && counts.unexpected_club_count === 0n
      });
    }

    const allValid = legacyClub?.id === LEGACY_CLUB_ID
      && legacyClub?.code === 'tt-badminton'
      && legacyClub?.status === 'ACTIVE'
      && tables.every((item) => item.valid);

    return {
      allValid,
      legacyClub,
      tableCount: tables.length,
      totalNewNullDelta: tables.reduce((sum, item) => sum + item.newNullDelta, 0n),
      totalLegacyRows: tables.reduce((sum, item) => sum + item.legacy_count, 0n),
      tables
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
  if (!report.allValid) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
