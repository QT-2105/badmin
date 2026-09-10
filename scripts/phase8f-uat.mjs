import { PrismaClient } from '@prisma/client';

import { assertPhase8Target } from './phase8-contract.mjs';

const CONFIRMATION = 'APPLY_UAT_C2F96CE9DCD6_PHASE8F';
if (process.env.BADMIN_PHASE8F_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_PHASE8F_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const directUrl = new URL(process.env.DATABASE_URL_UNPOOLED);
directUrl.searchParams.set('options', '-c lock_timeout=3s -c statement_timeout=90s');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });

const preflight = `
DO $$
DECLARE
  missing_indexes TEXT[];
BEGIN
  SELECT array_agg(expected.name ORDER BY expected.name)
  INTO missing_indexes
  FROM (VALUES
    ('uq_play_dates_club_date'),
    ('uq_runtime_courts_club_session_number'),
    ('uq_runtime_matches_club_session_queue'),
    ('uq_runtime_matches_club_session_court'),
    ('uq_history_players_club_history_player'),
    ('uq_inventory_club_product'),
    ('uq_app_settings_club')
  ) AS expected(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname = expected.name
      AND i.indisvalid AND i.indisready AND i.indisunique
  );
  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'Missing valid tenant unique replacements: %', missing_indexes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_role_permissions'::regclass
      AND conname = 'app_role_permissions_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (club_id, role)'
  ) THEN
    RAISE EXCEPTION 'Phase 13 tenant role-permission primary key is required first';
  END IF;
END $$`;

const postflight = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname IN (
      'play_dates_play_date_key',
      'uq_match_history_player',
      'shuttlecock_inventory_product_id_key'
    )
  ) THEN
    RAISE EXCEPTION 'A legacy global unique constraint remains';
  END IF;
  IF to_regclass('public.uq_runtime_courts_session_number') IS NOT NULL
    OR to_regclass('public.uq_runtime_matches_session_queue') IS NOT NULL
    OR to_regclass('public.uq_runtime_matches_session_court') IS NOT NULL
    OR to_regclass('public.uq_app_settings_club') IS NOT NULL
  THEN
    RAISE EXCEPTION 'A redundant global/settings unique index remains';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_settings'::regclass
      AND conname = 'app_settings_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (club_id)'
  ) THEN
    RAISE EXCEPTION 'app_settings primary key is not tenant-owned';
  END IF;
  IF EXISTS (
    SELECT club_id FROM public.app_settings GROUP BY club_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate app_settings tenant singleton';
  END IF;
END $$`;

async function transaction(statements) {
  await prisma.$transaction(async (tx) => {
    for (const statement of statements) await tx.$executeRawUnsafe(statement);
  }, { maxWait: 10_000, timeout: 90_000 });
}

try {
  await prisma.$executeRawUnsafe(preflight);

  for (const index of [
    'uq_runtime_courts_session_number',
    'uq_runtime_matches_session_queue',
    'uq_runtime_matches_session_court'
  ]) {
    await prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY IF EXISTS public.${index}`);
  }

  await transaction(['ALTER TABLE public.play_dates DROP CONSTRAINT IF EXISTS play_dates_play_date_key']);
  await transaction(['ALTER TABLE public.match_history_players DROP CONSTRAINT IF EXISTS uq_match_history_player']);
  await transaction(['ALTER TABLE public.shuttlecock_inventory DROP CONSTRAINT IF EXISTS shuttlecock_inventory_product_id_key']);
  await transaction([
    'ALTER TABLE public.app_settings DROP CONSTRAINT app_settings_pkey',
    'ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (club_id)'
  ]);

  await prisma.$executeRawUnsafe('DROP INDEX CONCURRENTLY IF EXISTS public.uq_app_settings_club');
  await prisma.$executeRawUnsafe(postflight);
  console.log(JSON.stringify({ target, phase: '8F', applied: true }));
} finally {
  await prisma.$disconnect();
}
