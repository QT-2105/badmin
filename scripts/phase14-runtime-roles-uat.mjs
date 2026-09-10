import { PrismaClient } from '@prisma/client';

import { assertPhase8Target } from './phase8-contract.mjs';

const CONFIRMATION = 'APPLY_UAT_C2F96CE9DCD6_RUNTIME_ROLES';
if (process.env.BADMIN_RUNTIME_ROLE_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_RUNTIME_ROLE_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } } });
const tables = [
  'app_role_permissions', 'app_settings', 'app_users', 'auth_sessions',
  'match_histories', 'match_history_players', 'payment_bank_accounts',
  'play_dates', 'play_sessions', 'runtime_courts', 'runtime_matches',
  'session_player_images', 'session_players', 'session_summaries',
  'session_transactions', 'shuttlecock_inventory', 'shuttlecock_movements',
  'shuttlecock_products'
];

try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '3s'");
    await tx.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO badmin_uat_app');
    await tx.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${tables.map((table) => `public.${table}`).join(', ')} TO badmin_uat_app`);
    await tx.$executeRawUnsafe('GRANT badmin_control_writer TO neondb_owner WITH SET TRUE');
    await tx.$executeRawUnsafe('GRANT badmin_uat_app TO neondb_owner WITH SET TRUE');
  });

  const [validation] = await prisma.$queryRawUnsafe(`
    SELECT
      count(*) FILTER (WHERE has_table_privilege('badmin_uat_app', format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE')) AS runtime_tables,
      count(*) AS expected_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `, tables);
  if (validation.runtime_tables !== 18n || validation.expected_tables !== 18n) {
    throw new Error('Runtime table grants are incomplete.');
  }
  console.log(JSON.stringify({ target, applied: true, runtimeTables: Number(validation.runtime_tables) }));
} finally {
  await prisma.$disconnect();
}
