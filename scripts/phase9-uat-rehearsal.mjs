import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

import { assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const CONFIRMATION = 'APPLY_UAT_C2F96CE9DCD6_PHASE9';
const action = process.argv[2];
const phase = process.argv[3]?.toUpperCase();
if (!['apply', 'verify'].includes(action) || (action === 'apply' && !['9A-EXPAND', '9A-INDEX', '9A-VALIDATE', '8F-EMAIL'].includes(phase))) {
  throw new Error('Cách dùng: phase9-uat-rehearsal.mjs apply <9A-EXPAND|9A-INDEX|9A-VALIDATE|8F-EMAIL> hoặc verify.');
}
if (action === 'apply' && process.env.BADMIN_PHASE9_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_PHASE9_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const directUrl = new URL(process.env.DATABASE_URL_UNPOOLED);
directUrl.searchParams.set('options', '-c lock_timeout=2s -c statement_timeout=120s');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
const timings = [];

async function timed(name, callback) {
  const startedAt = performance.now();
  const result = await callback();
  timings.push({ name, durationMs: Math.round(performance.now() - startedAt) });
  return result;
}

async function applyExpand() {
  return timed('phase9a-expand', () => prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS username varchar(80)');
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS username_normalized varchar(80)');
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS email_normalized varchar(320)');
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone varchar(32)');
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone_normalized varchar(20)');
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ALTER COLUMN email TYPE varchar(320)');
    const updated = await tx.$executeRawUnsafe(`
      UPDATE public.app_users
      SET username = CASE
            WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN username
            ELSE COALESCE(username, btrim(email))
          END,
          username_normalized = CASE
            WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN username_normalized
            ELSE COALESCE(username_normalized, lower(btrim(email)))
          END,
          email_normalized = CASE
            WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' THEN COALESCE(email_normalized, lower(btrim(email)))
            ELSE email_normalized
          END
      WHERE username_normalized IS NULL AND email_normalized IS NULL AND phone_normalized IS NULL
    `);
    await tx.$executeRawUnsafe('ALTER TABLE public.app_users ALTER COLUMN email DROP NOT NULL');
    const checks = [
      ['ck_app_users_identifier_required', 'username_normalized IS NOT NULL OR email_normalized IS NOT NULL OR phone_normalized IS NOT NULL'],
      ['ck_app_users_username_pair', '(username IS NULL) = (username_normalized IS NULL)'],
      ['ck_app_users_email_normalized_source', 'email_normalized IS NULL OR email IS NOT NULL'],
      ['ck_app_users_phone_pair', '(phone IS NULL) = (phone_normalized IS NULL)']
    ];
    for (const [name, expression] of checks) {
      const exists = await tx.$queryRawUnsafe(`SELECT 1 FROM pg_constraint WHERE conname = '${name}'`);
      if (exists.length === 0) {
        await tx.$executeRawUnsafe(`ALTER TABLE public.app_users ADD CONSTRAINT ${name} CHECK (${expression}) NOT VALID`);
      }
    }
    return { backfilledUsers: updated };
  }, { maxWait: 10_000, timeout: 120_000 }));
}

async function ensureUniqueIndex(name, column) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT i.indisvalid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname = '${name}'
  `);
  if (rows[0]?.indisvalid) return 'existing-valid';
  if (rows.length > 0) await prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY public.${name}`);
  await timed(`create:${name}`, () => prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX CONCURRENTLY ${name} ON public.app_users (club_id, ${column})`
  ));
  return 'created';
}

async function applyIndexes() {
  const results = [];
  results.push(await ensureUniqueIndex('uq_app_users_club_username_normalized', 'username_normalized'));
  results.push(await ensureUniqueIndex('uq_app_users_club_email_normalized', 'email_normalized'));
  results.push(await ensureUniqueIndex('uq_app_users_club_phone_normalized', 'phone_normalized'));
  return results;
}

async function applyValidation() {
  const names = [
    'ck_app_users_identifier_required',
    'ck_app_users_username_pair',
    'ck_app_users_email_normalized_source',
    'ck_app_users_phone_pair'
  ];
  const results = [];
  for (const name of names) {
    const [state] = await prisma.$queryRawUnsafe(`SELECT convalidated FROM pg_constraint WHERE conname = '${name}'`);
    if (!state) throw new Error(`Thiếu constraint ${name}.`);
    if (!state.convalidated) {
      await timed(`validate:${name}`, () => prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
        await tx.$executeRawUnsafe(`ALTER TABLE public.app_users VALIDATE CONSTRAINT ${name}`);
      }));
    }
    results.push({ name, validated: true });
  }
  return results;
}

async function applyEmailCutover() {
  return timed('drop:app_users_email_key', () => prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
    const exists = await tx.$queryRawUnsafe(`
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.app_users'::regclass AND conname = 'app_users_email_key'
    `);
    if (exists.length > 0) await tx.$executeRawUnsafe('ALTER TABLE public.app_users DROP CONSTRAINT app_users_email_key');
    return { dropped: exists.length > 0 };
  }));
}

async function verify() {
  const [users] = await prisma.$queryRawUnsafe(`
    SELECT count(*) AS total,
      count(*) FILTER (WHERE username_normalized IS NULL AND email_normalized IS NULL AND phone_normalized IS NULL) AS missing_identifier,
      count(*) FILTER (WHERE club_id IS NULL) AS missing_club,
      count(*) FILTER (WHERE password_hash IS NULL OR password_hash = '') AS missing_password_hash
    FROM public.app_users
  `);
  const identifierColumns = await prisma.$queryRawUnsafe(`
    SELECT column_name, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_users'
      AND column_name IN ('username', 'username_normalized', 'email', 'email_normalized', 'phone', 'phone_normalized')
    ORDER BY ordinal_position
  `);
  const duplicates = await prisma.$queryRawUnsafe(`
    SELECT 'username' AS kind, count(*) AS duplicate_groups FROM (
      SELECT club_id, username_normalized FROM public.app_users WHERE username_normalized IS NOT NULL
      GROUP BY club_id, username_normalized HAVING count(*) > 1
    ) value
    UNION ALL SELECT 'email', count(*) FROM (
      SELECT club_id, email_normalized FROM public.app_users WHERE email_normalized IS NOT NULL
      GROUP BY club_id, email_normalized HAVING count(*) > 1
    ) value
    UNION ALL SELECT 'phone', count(*) FROM (
      SELECT club_id, phone_normalized FROM public.app_users WHERE phone_normalized IS NOT NULL
      GROUP BY club_id, phone_normalized HAVING count(*) > 1
    ) value
  `);
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS name, i.indisvalid, i.indisready
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname IN (
      'uq_app_users_club_username_normalized',
      'uq_app_users_club_email_normalized',
      'uq_app_users_club_phone_normalized'
    ) ORDER BY c.relname
  `);
  const checks = await prisma.$queryRawUnsafe(`
    SELECT conname, convalidated FROM pg_constraint
    WHERE conname IN (
      'ck_app_users_identifier_required', 'ck_app_users_username_pair',
      'ck_app_users_email_normalized_source', 'ck_app_users_phone_pair'
    ) ORDER BY conname
  `);
  const [emailCutover] = await prisma.$queryRawUnsafe(`
    SELECT NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.app_users'::regclass AND conname = 'app_users_email_key'
    ) AS global_email_removed
  `);
  const [sessions] = await prisma.$queryRawUnsafe(`
    SELECT count(*) AS total, count(*) FILTER (WHERE s.club_id <> u.club_id) AS tenant_mismatch
    FROM public.auth_sessions s JOIN public.app_users u ON u.id = s.user_id
  `);
  const [locks] = await prisma.$queryRawUnsafe(`
    SELECT count(*) AS waiting_access_exclusive FROM pg_locks
    WHERE NOT granted AND mode = 'AccessExclusiveLock'
  `);
  return { users, identifierColumns, duplicates, indexes, checks, emailCutover, sessions, locks };
}

async function sameEmailCrossClubProbe() {
  const probeClubId = randomUUID();
  const firstUserId = randomUUID();
  const secondUserId = randomUUID();
  const sentinel = `phase9-probe-rollback:${probeClubId}`;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('GRANT badmin_schema_owner TO neondb_owner');
      await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_schema_owner');
      await tx.$executeRawUnsafe(`
        INSERT INTO control.clubs (id, code, name, status)
        VALUES ('${probeClubId}'::uuid, 'phase9-probe-${probeClubId.slice(0, 8)}', 'Phase 9 probe', 'ACTIVE')
      `);
      await tx.$executeRawUnsafe('SET LOCAL ROLE NONE');
      await tx.$executeRawUnsafe(`
        INSERT INTO public.app_users (
          id, club_id, username, username_normalized, email, email_normalized,
          password_hash, display_name, role, status
        ) VALUES
          ('${firstUserId}'::uuid, '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid, 'phase9-probe-a', 'phase9-probe-a', 'same@example.test', 'same@example.test', 'probe', 'Probe A', 'VIEWER', 'ACTIVE'),
          ('${secondUserId}'::uuid, '${probeClubId}'::uuid, 'phase9-probe-b', 'phase9-probe-b', 'same@example.test', 'same@example.test', 'probe', 'Probe B', 'VIEWER', 'ACTIVE')
      `);
      await tx.$executeRawUnsafe('REVOKE badmin_schema_owner FROM neondb_owner');
      throw new Error(sentinel);
    });
  } catch (error) {
    if (error instanceof Error && error.message === sentinel) return { allowedAcrossClubs: true, rolledBack: true };
    throw error;
  }
  throw new Error('Phase 9 probe không rollback.');
}

try {
  let result;
  if (action === 'verify') {
    result = await verify();
    if (result.emailCutover.global_email_removed) result.sameEmailCrossClubProbe = await sameEmailCrossClubProbe();
  } else if (phase === '9A-EXPAND') result = await applyExpand();
  else if (phase === '9A-INDEX') result = await applyIndexes();
  else if (phase === '9A-VALIDATE') result = await applyValidation();
  else result = await applyEmailCutover();
  console.log(JSON.stringify({ target, action, phase: phase ?? null, result, timings }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
