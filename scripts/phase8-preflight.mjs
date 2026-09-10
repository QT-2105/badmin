import { PrismaClient } from '@prisma/client';

import {
  EXPECTED_ROW_COUNTS,
  LEGACY_CLUB_ID,
  TENANT_RELATIONS,
  TENANT_TABLES,
  assertPhase8Target,
  jsonReplacer
} from './phase8-contract.mjs';

const target = assertPhase8Target();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } } });

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");

    const [legacyClub] = await tx.$queryRawUnsafe(`
      SELECT id::text, code, status FROM control.clubs
      WHERE id = '${LEGACY_CLUB_ID}'::uuid
    `);
    const tables = [];
    for (const table of TENANT_TABLES) {
      const [counts] = await tx.$queryRawUnsafe(`
        SELECT count(*) AS row_count,
          count(*) FILTER (WHERE club_id IS NULL) AS null_count,
          count(*) FILTER (WHERE club_id <> '${LEGACY_CLUB_ID}'::uuid) AS unexpected_count
        FROM public.${table}
      `);
      tables.push({ table, ...counts, rowCountMatchesBaseline: counts.row_count === EXPECTED_ROW_COUNTS[table] });
    }

    const relations = [];
    for (const relation of TENANT_RELATIONS) {
      const nullable = relation.columns.split(',').map((value) => value.trim()).slice(1);
      const childColumns = relation.columns.split(',').map((value) => value.trim());
      const parentColumns = relation.parentColumns.split(',').map((value) => value.trim());
      const joins = childColumns.map((column, index) => `child.${column} = parent.${parentColumns[index]}`).join(' AND ');
      const populated = nullable.map((column) => `child.${column} IS NOT NULL`).join(' AND ');
      const [counts] = await tx.$queryRawUnsafe(`
        SELECT count(*) AS mismatch_count
        FROM public.${relation.table} child
        LEFT JOIN public.${relation.parentTable} parent ON ${joins}
        WHERE ${populated || 'TRUE'} AND parent.${parentColumns.at(-1)} IS NULL
      `);
      relations.push({ name: relation.name, ...counts });
    }

    const duplicateChecks = await tx.$queryRawUnsafe(`
      SELECT 'play_dates_club_date' AS key, count(*) AS duplicate_groups FROM (
        SELECT club_id, play_date FROM public.play_dates GROUP BY club_id, play_date HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'role_permissions_club_role', count(*) FROM (
        SELECT club_id, role FROM public.app_role_permissions GROUP BY club_id, role HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'settings_club', count(*) FROM (
        SELECT club_id FROM public.app_settings GROUP BY club_id HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'users_club_email', count(*) FROM (
        SELECT club_id, email FROM public.app_users GROUP BY club_id, email HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'runtime_court_slot', count(*) FROM (
        SELECT club_id, session_id, court_number FROM public.runtime_courts GROUP BY club_id, session_id, court_number HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'runtime_queue_slot', count(*) FROM (
        SELECT club_id, session_id, queue_order FROM public.runtime_matches WHERE queue_order IS NOT NULL GROUP BY club_id, session_id, queue_order HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'runtime_match_court_slot', count(*) FROM (
        SELECT club_id, session_id, court_number FROM public.runtime_matches WHERE court_number IS NOT NULL GROUP BY club_id, session_id, court_number HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'history_participant', count(*) FROM (
        SELECT club_id, match_history_id, session_player_id FROM public.match_history_players GROUP BY club_id, match_history_id, session_player_id HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'summary_session', count(*) FROM (
        SELECT club_id, session_id FROM public.session_summaries GROUP BY club_id, session_id HAVING count(*) > 1
      ) value
      UNION ALL SELECT 'inventory_product', count(*) FROM (
        SELECT club_id, shuttlecock_product_id FROM public.shuttlecock_inventory GROUP BY club_id, shuttlecock_product_id HAVING count(*) > 1
      ) value
    `);

    const existingTenantConstraints = await tx.$queryRawUnsafe(`
      SELECT c.relname AS table_name, con.conname, con.contype, con.convalidated,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND pg_get_constraintdef(con.oid) ILIKE '%club_id%'
      ORDER BY c.relname, con.conname
    `);
    const existingTenantIndexes = await tx.$queryRawUnsafe(`
      SELECT tablename AS table_name, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexdef ILIKE '%club_id%'
      ORDER BY tablename, indexname
    `);
    const existingForeignKeys = await tx.$queryRawUnsafe(`
      SELECT child.relname AS table_name, con.conname,
        parent.relname AS parent_table,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
      WHERE con.contype = 'f'
        AND child_ns.nspname = 'public'
        AND parent_ns.nspname IN ('public', 'control')
      ORDER BY child.relname, con.conname
    `);
    const existingGlobalUniques = await tx.$queryRawUnsafe(`
      SELECT table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      ORDER BY table_name, constraint_name
    `);
    const waitingLocks = await tx.$queryRawUnsafe(`
      SELECT count(*) AS waiting_lock_count
      FROM pg_locks WHERE NOT granted AND mode = 'AccessExclusiveLock'
    `);

    const allValid = legacyClub?.id === LEGACY_CLUB_ID
      && legacyClub?.code === 'tt-badminton'
      && legacyClub?.status === 'ACTIVE'
      && tables.every((item) => item.rowCountMatchesBaseline && item.null_count === 0n && item.unexpected_count === 0n)
      && relations.every((item) => item.mismatch_count === 0n)
      && duplicateChecks.every((item) => item.duplicate_groups === 0n)
      && waitingLocks[0]?.waiting_lock_count === 0n;

    return {
      allValid,
      legacyClub,
      totalRows: tables.reduce((sum, item) => sum + item.row_count, 0n),
      totalNullRows: tables.reduce((sum, item) => sum + item.null_count, 0n),
      totalUnexpectedRows: tables.reduce((sum, item) => sum + item.unexpected_count, 0n),
      tables,
      relations,
      duplicateChecks,
      existingTenantConstraints,
      existingTenantIndexes,
      existingForeignKeys,
      existingGlobalUniques,
      waitingLocks
    };
  }, { maxWait: 10_000, timeout: 120_000 });

  console.log(JSON.stringify({ target, ...report }, jsonReplacer, 2));
  if (!report.allValid) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
