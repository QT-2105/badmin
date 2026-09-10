import { PrismaClient } from '@prisma/client';

import { assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const target = assertPhase8Target();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } } });

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");

    const [users] = await tx.$queryRawUnsafe(`
      SELECT count(*) AS total,
        count(*) FILTER (WHERE btrim(email) = '') AS blank_email,
        count(*) FILTER (WHERE email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$') AS email_shaped,
        count(*) FILTER (WHERE lower(btrim(email)) <> email) AS not_normalized,
        count(DISTINCT club_id) AS club_count
      FROM public.app_users
    `);
    const [sessions] = await tx.$queryRawUnsafe(`
      SELECT count(*) AS total,
        count(*) FILTER (WHERE s.club_id <> u.club_id) AS tenant_mismatch,
        count(*) FILTER (WHERE s.expires_at <= now()) AS expired
      FROM public.auth_sessions s
      JOIN public.app_users u ON u.id = s.user_id
    `);
    const clubs = await tx.$queryRawUnsafe(`
      SELECT status, count(*) AS club_count
      FROM control.clubs GROUP BY status ORDER BY status
    `);
    const columns = await tx.$queryRawUnsafe(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_users'
      ORDER BY ordinal_position
    `);
    const provisioning = await tx.$queryRawUnsafe(`
      SELECT to_regclass('control.club_provisioning_receipts')::text AS receipt_table,
        to_regclass('control.club_owner_activations')::text AS activation_table,
        to_regprocedure('control.provision_club_tenant(uuid,jsonb)')::text AS provision_function,
        to_regprocedure('control.activate_club_owner(text,text,text)')::text AS activation_function
    `);
    const legacyGlobalEmail = await tx.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.app_users'::regclass
          AND conname = 'app_users_email_key'
      ) AS exists
    `);
    const waitingLocks = await tx.$queryRawUnsafe(`
      SELECT count(*) AS waiting_access_exclusive
      FROM pg_locks WHERE NOT granted AND mode = 'AccessExclusiveLock'
    `);

    return { users, sessions, clubs, columns, provisioning: provisioning[0], legacyGlobalEmail: legacyGlobalEmail[0], waitingLocks: waitingLocks[0] };
  }, { maxWait: 10_000, timeout: 60_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
