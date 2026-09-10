import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

const EXPECTED_FINGERPRINT = 'c2f96ce9dcd6';
const EXPECTED_CLUB_ID = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';
const EXPECTED_FEATURE_KEYS = [
  'dashboard',
  'finance',
  'inventory',
  'schedule',
  'session.completion',
  'session.runtime',
  'settings',
  'users'
];

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
    || actual !== EXPECTED_FINGERPRINT
  ) {
    throw new Error('Control foundation diagnostic target không khớp UAT đã duyệt.');
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

    const [club] = await tx.$queryRawUnsafe(`
      SELECT id::text, code, name, status
      FROM control.clubs
      WHERE id = '${EXPECTED_CLUB_ID}'::uuid
    `);
    const [entitlement] = await tx.$queryRawUnsafe(`
      SELECT
        club_id::text,
        version,
        features,
        limits,
        valid_until,
        (SELECT count(*) FROM jsonb_object_keys(features)) AS feature_count
      FROM control.club_entitlements
      WHERE club_id = '${EXPECTED_CLUB_ID}'::uuid
    `);
    const ownership = await tx.$queryRawUnsafe(`
      SELECT 'schema' AS object_type, nspname AS object_name, pg_get_userbyid(nspowner) AS owner
      FROM pg_namespace WHERE nspname = 'control'
      UNION ALL
      SELECT 'table', schemaname || '.' || tablename, tableowner
      FROM pg_tables WHERE schemaname = 'control'
      UNION ALL
      SELECT 'function', n.nspname || '.' || p.proname, pg_get_userbyid(p.proowner)
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'control'
      ORDER BY object_type, object_name
    `);
    const [privileges] = await tx.$queryRawUnsafe(`
      SELECT
        has_schema_privilege('badmin_uat_app', 'control', 'USAGE') AS reader_schema_usage,
        has_column_privilege('badmin_uat_app', 'control.clubs', 'id', 'SELECT') AS reader_club_id,
        has_column_privilege('badmin_uat_app', 'control.clubs', 'status', 'SELECT') AS reader_club_status,
        has_column_privilege('badmin_uat_app', 'control.club_entitlements', 'version', 'SELECT') AS reader_entitlement_version,
        (
          has_table_privilege('badmin_uat_app', 'control.clubs', 'INSERT')
          OR has_table_privilege('badmin_uat_app', 'control.clubs', 'UPDATE')
          OR has_table_privilege('badmin_uat_app', 'control.clubs', 'DELETE')
          OR has_table_privilege('badmin_uat_app', 'control.clubs', 'TRUNCATE')
        ) AS reader_club_mutation,
        (
          has_table_privilege('badmin_uat_app', 'control.club_entitlements', 'INSERT')
          OR has_table_privilege('badmin_uat_app', 'control.club_entitlements', 'UPDATE')
          OR has_table_privilege('badmin_uat_app', 'control.club_entitlements', 'DELETE')
          OR has_table_privilege('badmin_uat_app', 'control.club_entitlements', 'TRUNCATE')
        ) AS reader_entitlement_mutation,
        has_schema_privilege('public', 'control', 'USAGE') AS public_schema_usage
    `);

    const featureKeys = Object.keys(entitlement?.features ?? {}).sort();
    const foundationValid = Boolean(
      club
      && club.id === EXPECTED_CLUB_ID
      && club.code === 'tt-badminton'
      && club.name === 'TT Badminton'
      && club.status === 'ACTIVE'
      && entitlement
      && entitlement.club_id === EXPECTED_CLUB_ID
      && entitlement.version === 1n
      && JSON.stringify(featureKeys) === JSON.stringify(EXPECTED_FEATURE_KEYS)
      && featureKeys.every((key) => entitlement.features[key] === true)
      && Object.keys(entitlement.limits ?? {}).length === 0
      && entitlement.valid_until === null
      && ownership.every((item) => item.owner === 'badmin_schema_owner')
      && privileges.reader_schema_usage === true
      && privileges.reader_club_id === true
      && privileges.reader_club_status === true
      && privileges.reader_entitlement_version === true
      && privileges.reader_club_mutation === false
      && privileges.reader_entitlement_mutation === false
      && privileges.public_schema_usage === false
    );

    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    const [readerProjection] = await tx.$queryRawUnsafe(`
      SELECT c.id::text, c.code, c.name, c.status, e.version
      FROM control.clubs c
      JOIN control.club_entitlements e ON e.club_id = c.id
      WHERE c.id = '${EXPECTED_CLUB_ID}'::uuid
    `);
    await tx.$executeRawUnsafe('RESET ROLE');

    return {
      foundationValid,
      club,
      entitlement: {
        clubId: entitlement?.club_id ?? null,
        version: entitlement?.version ?? null,
        featureCount: entitlement?.feature_count ?? null,
        allExpectedFeaturesEnabled: featureKeys.length === EXPECTED_FEATURE_KEYS.length
          && featureKeys.every((key) => entitlement.features[key] === true),
        limitCount: Object.keys(entitlement?.limits ?? {}).length,
        validUntil: entitlement?.valid_until ?? null
      },
      ownership,
      privileges,
      readerProjection
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
  if (!report.foundationValid) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
