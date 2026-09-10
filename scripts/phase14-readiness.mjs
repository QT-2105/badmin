import { PrismaClient } from '@prisma/client';

import {
  DIRECT_CLUB_FKS,
  EXPECTED_ROW_COUNTS,
  LEGACY_CLUB_ID,
  TENANT_RELATIONS,
  TENANT_TABLES,
  assertPhase8Target,
  jsonReplacer
} from './phase8-contract.mjs';

const target = assertPhase8Target();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_UNPOOLED } } });

function quoted(values) {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(',');
}

try {
  const report = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '60s'");

    const columns = await tx.$queryRawUnsafe(`
      SELECT c.relname AS table_name, a.attnotnull
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND a.attname = 'club_id' AND NOT a.attisdropped
        AND c.relname IN (${quoted(TENANT_TABLES)})
      ORDER BY c.relname
    `);
    const requiredConstraints = [...DIRECT_CLUB_FKS, ...TENANT_RELATIONS].map(({ name }) => name);
    const constraints = await tx.$queryRawUnsafe(`
      SELECT conname, convalidated
      FROM pg_constraint
      WHERE conname IN (${quoted(requiredConstraints)})
      ORDER BY conname
    `);
    const legacyKeys = await tx.$queryRawUnsafe(`
      SELECT name FROM (VALUES
        ('play_dates_play_date_key'),
        ('uq_match_history_player'),
        ('shuttlecock_inventory_product_id_key'),
        ('uq_runtime_courts_session_number'),
        ('uq_runtime_matches_session_queue'),
        ('uq_runtime_matches_session_court'),
        ('uq_app_settings_club')
      ) expected(name)
      WHERE to_regclass('public.' || name) IS NOT NULL
         OR EXISTS (SELECT 1 FROM pg_constraint WHERE conname = name)
      ORDER BY name
    `);
    const [settingsKey] = await tx.$queryRawUnsafe(`
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'public.app_settings'::regclass AND conname = 'app_settings_pkey'
    `);
    const [roleKey] = await tx.$queryRawUnsafe(`
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'public.app_role_permissions'::regclass AND conname = 'app_role_permissions_pkey'
    `);
    const [controlContract] = await tx.$queryRawUnsafe(`
      SELECT
        to_regclass('control.club_provisioning_receipts') IS NOT NULL AS receipt_table,
        to_regclass('control.club_owner_activations') IS NOT NULL AS activation_table,
        to_regprocedure('control.provision_club_tenant(uuid,jsonb)') IS NOT NULL AS provision_function,
        to_regprocedure('control.activate_club_owner(text,text,text)') IS NOT NULL AS activation_function,
        CASE
          WHEN to_regprocedure('control.provision_club_tenant(uuid,jsonb)') IS NULL THEN false
          ELSE has_function_privilege(
            'badmin_control_writer',
            to_regprocedure('control.provision_club_tenant(uuid,jsonb)'),
            'EXECUTE'
          )
        END AS control_execute,
        CASE
          WHEN to_regprocedure('control.activate_club_owner(text,text,text)') IS NULL THEN false
          ELSE has_function_privilege(
            'badmin_uat_app',
            to_regprocedure('control.activate_club_owner(text,text,text)'),
            'EXECUTE'
          )
        END AS badmin_execute,
        has_column_privilege('badmin_uat_app', 'control.club_entitlements', 'features', 'SELECT') AS feature_projection_read,
        has_column_privilege('badmin_uat_app', 'control.club_entitlements', 'limits', 'SELECT') AS limit_projection_read
    `);
    const controlPlaneRuntimeLogins = await tx.$queryRawUnsafe(`
      SELECT count(DISTINCT member.oid) AS login_members
      FROM pg_roles member
      JOIN pg_auth_members membership ON membership.member = member.oid
      JOIN pg_roles granted ON granted.oid = membership.roleid
      WHERE granted.rolname = 'badmin_control_writer' AND member.rolcanlogin
    `);
    const clubs = await tx.$queryRawUnsafe(`
      SELECT id::text, status
      FROM control.clubs
      ORDER BY id
    `);
    const ownership = [];
    for (const table of TENANT_TABLES) {
      const [row] = await tx.$queryRawUnsafe(`
        SELECT count(*) AS total,
          count(*) FILTER (WHERE club_id IS NULL) AS null_club,
          count(*) FILTER (WHERE club_id <> $1::uuid) AS non_legacy
        FROM public."${table}"
      `, LEGACY_CLUB_ID);
      ownership.push({ table, ...row, expectedLegacyRows: EXPECTED_ROW_COUNTS[table] });
    }
    const [authSessions] = await tx.$queryRawUnsafe(`
      SELECT count(*) FILTER (WHERE s.club_id <> u.club_id) AS tenant_mismatch
      FROM public.auth_sessions s JOIN public.app_users u ON u.id = s.user_id
    `);
    const [locks] = await tx.$queryRawUnsafe(`
      SELECT count(*) AS waiting_access_exclusive
      FROM pg_locks WHERE NOT granted AND mode = 'AccessExclusiveLock'
    `);
    return {
      columns,
      constraints,
      legacyKeys,
      settingsKey,
      roleKey,
      controlContract,
      controlPlaneRuntimeLogins: controlPlaneRuntimeLogins[0],
      clubs,
      ownership,
      authSessions,
      locks
    };
  }, { maxWait: 10_000, timeout: 90_000 });

  const blockers = [];
  if (process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK === 'true') blockers.push('legacy_tenant_fallback_enabled');
  if (report.columns.length !== TENANT_TABLES.length || report.columns.some(({ attnotnull }) => !attnotnull)) blockers.push('tenant_column_not_null_incomplete');
  if (report.constraints.length !== DIRECT_CLUB_FKS.length + TENANT_RELATIONS.length || report.constraints.some(({ convalidated }) => !convalidated)) blockers.push('tenant_constraint_validation_incomplete');
  if (report.legacyKeys.length) blockers.push('legacy_global_keys_remain');
  if (report.settingsKey?.definition !== 'PRIMARY KEY (club_id)') blockers.push('settings_primary_key_not_tenant_owned');
  if (report.roleKey?.definition !== 'PRIMARY KEY (club_id, role)') blockers.push('role_permission_primary_key_not_tenant_owned');
  if (Object.values(report.controlContract).some((value) => value !== true)) blockers.push('control_contract_or_grants_incomplete');
  if (report.controlPlaneRuntimeLogins.login_members < 1n) blockers.push('control_plane_runtime_login_not_bound');
  if (report.clubs.length !== 1 || report.clubs[0]?.id !== LEGACY_CLUB_ID || report.clubs[0]?.status !== 'ACTIVE') blockers.push('pre_shadow_club_state_invalid');
  if (report.ownership.some(({ total, null_club, non_legacy, expectedLegacyRows }) => total !== expectedLegacyRows || null_club !== 0n || non_legacy !== 0n)) blockers.push('legacy_baseline_or_ownership_mismatch');
  if (report.authSessions.tenant_mismatch !== 0n) blockers.push('auth_session_tenant_mismatch');
  if (report.locks.waiting_access_exclusive !== 0n) blockers.push('waiting_access_exclusive_lock');

  console.log(JSON.stringify({ target, ready: blockers.length === 0, blockers, report }, jsonReplacer, 2));
  if (blockers.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
