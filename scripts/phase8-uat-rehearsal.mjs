import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

import {
  DIRECT_CLUB_FKS,
  NOT_NULL_CHECKS,
  TENANT_INDEXES,
  TENANT_RELATIONS,
  TENANT_TABLES,
  TENANT_UNIQUES,
  assertPhase8Target,
  jsonReplacer
} from './phase8-contract.mjs';

const CONFIRMATION = 'APPLY_UAT_C2F96CE9DCD6';
const action = process.argv[2];
const requestedPhase = process.argv[3]?.toUpperCase();

if (!['apply', 'verify'].includes(action) || (action === 'apply' && !['8A', '8B', '8C', '8D', '8E'].includes(requestedPhase))) {
  throw new Error('Cách dùng: phase8-uat-rehearsal.mjs apply <8A|8B|8C|8D|8E> hoặc verify.');
}
if (action === 'apply' && process.env.BADMIN_PHASE8_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_PHASE8_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const directUrl = new URL(process.env.DATABASE_URL_UNPOOLED);
directUrl.searchParams.set('options', '-c lock_timeout=2s -c statement_timeout=120s');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
const timings = [];

function quotedColumns(value) {
  return value.split(',').map((column) => `"${column.trim()}"`).join(', ');
}

async function timed(name, operation) {
  const startedAt = performance.now();
  const result = await operation();
  timings.push({ name, durationMs: Math.round(performance.now() - startedAt) });
  return result;
}

async function indexState(name) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT i.indisvalid AS valid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname = '${name}'
  `);
  return rows[0] ?? null;
}

async function ensureIndex({ name, table, columns }, unique = false) {
  const current = await indexState(name);
  if (current?.valid) return 'existing-valid';
  if (current) {
    await timed(`drop-invalid:${name}`, () => prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY public."${name}"`));
  }
  await timed(`create:${name}`, () => prisma.$executeRawUnsafe(
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX CONCURRENTLY "${name}" ON public."${table}" (${columns})`
  ));
  return 'created';
}

async function constraintExists(name) {
  const rows = await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_constraint WHERE conname = '${name}'`);
  return rows.length > 0;
}

async function ensureNotValidConstraint(name, table, definition) {
  if (await constraintExists(name)) return 'existing';
  await timed(`add:${name}`, () => prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");
    await tx.$executeRawUnsafe(`ALTER TABLE public."${table}" ADD CONSTRAINT "${name}" ${definition} NOT VALID`);
  }));
  return 'created';
}

async function apply8A() {
  const results = [];
  for (const index of TENANT_INDEXES) results.push({ name: index.name, result: await ensureIndex(index) });
  return results;
}

async function apply8B() {
  const results = [];
  for (const index of TENANT_UNIQUES) results.push({ name: index.name, result: await ensureIndex(index, true) });
  return results;
}

async function apply8C() {
  const results = [];
  const [referencePrivilege] = await prisma.$queryRawUnsafe(`
    SELECT has_column_privilege(current_user, 'control.clubs', 'id', 'REFERENCES') AS allowed
  `);
  if (!referencePrivilege?.allowed) {
    await timed('grant:control.clubs.id:references', () => prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('GRANT badmin_schema_owner TO neondb_owner');
      await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_schema_owner');
      await tx.$executeRawUnsafe('GRANT REFERENCES (id) ON control.clubs TO neondb_owner');
      await tx.$executeRawUnsafe('SET LOCAL ROLE NONE');
      await tx.$executeRawUnsafe('REVOKE badmin_schema_owner FROM neondb_owner');
    }));
    results.push({ name: 'control.clubs.id REFERENCES grant', result: 'created' });
  } else {
    results.push({ name: 'control.clubs.id REFERENCES grant', result: 'existing' });
  }
  for (const relation of DIRECT_CLUB_FKS) {
    results.push({
      name: relation.name,
      result: await ensureNotValidConstraint(
        relation.name,
        relation.table,
        'FOREIGN KEY ("club_id") REFERENCES control.clubs("id") ON DELETE RESTRICT'
      )
    });
  }
  for (const relation of TENANT_RELATIONS) {
    results.push({
      name: relation.name,
      result: await ensureNotValidConstraint(
        relation.name,
        relation.table,
        `FOREIGN KEY (${quotedColumns(relation.columns)}) REFERENCES public."${relation.parentTable}" (${quotedColumns(relation.parentColumns)}) ON DELETE ${relation.onDelete}`
      )
    });
  }
  for (const check of NOT_NULL_CHECKS) {
    results.push({
      name: check.name,
      result: await ensureNotValidConstraint(check.name, check.table, 'CHECK ("club_id" IS NOT NULL)')
    });
  }
  return results;
}

async function apply8D() {
  const names = [...DIRECT_CLUB_FKS, ...TENANT_RELATIONS, ...NOT_NULL_CHECKS];
  const results = [];
  for (const item of names) {
    const [state] = await prisma.$queryRawUnsafe(`
      SELECT convalidated FROM pg_constraint WHERE conname = '${item.name}'
    `);
    if (!state) throw new Error(`Thiếu constraint ${item.name}; phải hoàn tất Phase 8C trước.`);
    if (state.convalidated) {
      results.push({ name: item.name, result: 'existing-valid' });
      continue;
    }
    await timed(`validate:${item.name}`, () => prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '120s'");
      await tx.$executeRawUnsafe(`ALTER TABLE public."${item.table}" VALIDATE CONSTRAINT "${item.name}"`);
    }));
    results.push({ name: item.name, result: 'validated' });
  }
  return results;
}

async function apply8E() {
  const results = [];
  for (const table of TENANT_TABLES) {
    const [column] = await prisma.$queryRawUnsafe(`
      SELECT attnotnull
      FROM pg_attribute
      WHERE attrelid = 'public.${table}'::regclass AND attname = 'club_id' AND NOT attisdropped
    `);
    if (!column) throw new Error(`Không tìm thấy ${table}.club_id.`);
    if (column.attnotnull) {
      results.push({ table, result: 'existing-not-null' });
      continue;
    }
    const checkName = `ck_${table}_club_id_nn`;
    const [check] = await prisma.$queryRawUnsafe(`
      SELECT convalidated FROM pg_constraint WHERE conname = '${checkName}'
    `);
    if (!check?.convalidated) throw new Error(`${checkName} chưa được validate; phải hoàn tất Phase 8D trước.`);
    await timed(`not-null:${table}`, () => prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '30s'");
      await tx.$executeRawUnsafe(`ALTER TABLE public."${table}" ALTER COLUMN "club_id" SET NOT NULL`);
      await tx.$executeRawUnsafe(`ALTER TABLE public."${table}" DROP CONSTRAINT "${checkName}"`);
    }));
    results.push({ table, result: 'set-not-null' });
  }
  return results;
}

async function verify() {
  const expectedIndexNames = [...TENANT_INDEXES, ...TENANT_UNIQUES].map((item) => item.name);
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS index_name, i.indisvalid, i.indisready
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname = ANY (ARRAY[${expectedIndexNames.map((name) => `'${name}'`).join(',')}])
    ORDER BY c.relname
  `);
  const constraints = await prisma.$queryRawUnsafe(`
    SELECT con.conname, con.convalidated, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND con.conname = ANY (ARRAY[${[...DIRECT_CLUB_FKS, ...TENANT_RELATIONS].map((item) => `'${item.name}'`).join(',')}])
    ORDER BY con.conname
  `);
  const nullability = await prisma.$queryRawUnsafe(`
    SELECT c.relname AS table_name, a.attnotnull
    FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND a.attname = 'club_id'
      AND c.relname = ANY (ARRAY[${TENANT_TABLES.map((table) => `'${table}'`).join(',')}])
    ORDER BY c.relname
  `);
  const waitingLocks = await prisma.$queryRawUnsafe(`
    SELECT count(*) AS waiting_access_exclusive
    FROM pg_locks WHERE NOT granted AND mode = 'AccessExclusiveLock'
  `);
  const explainQueries = {
    playDates: `SELECT * FROM public.play_dates WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid ORDER BY play_date DESC LIMIT 20`,
    sessions: `SELECT * FROM public.play_sessions WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid AND play_date_id = (SELECT id FROM public.play_dates WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid LIMIT 1) ORDER BY start_time, created_at`,
    players: `SELECT * FROM public.session_players WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid AND session_id = (SELECT id FROM public.play_sessions WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid LIMIT 1) ORDER BY joined_at, full_name`,
    history: `SELECT * FROM public.match_histories WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid AND session_id = (SELECT id FROM public.play_sessions WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid LIMIT 1) ORDER BY ended_at DESC`,
    finance: `SELECT * FROM public.session_transactions WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid ORDER BY created_at DESC`,
    movements: `SELECT * FROM public.shuttlecock_movements WHERE club_id = '${process.env.BADMIN_LEGACY_CLUB_ID}'::uuid ORDER BY created_at DESC`
  };
  const queryPlans = {};
  for (const [name, query] of Object.entries(explainQueries)) {
    const rows = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON) ${query}`);
    const plan = rows[0]['QUERY PLAN'][0].Plan;
    queryPlans[name] = {
      nodeType: plan['Node Type'],
      relationName: plan['Relation Name'] ?? null,
      indexName: plan['Index Name'] ?? null,
      totalCost: plan['Total Cost'],
      planRows: plan['Plan Rows']
    };
  }
  return { indexes, constraints, nullability, waitingLocks, queryPlans };
}

async function crossTenantNegativeProbe() {
  const probeClubId = randomUUID();
  const sentinel = `phase8-probe-rollback:${probeClubId}`;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '2s'");
      await tx.$executeRawUnsafe('GRANT badmin_schema_owner TO neondb_owner');
      await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_schema_owner');
      await tx.$executeRawUnsafe(`
        INSERT INTO control.clubs (id, code, name, status)
        VALUES ('${probeClubId}'::uuid, 'phase8-probe-${probeClubId.slice(0, 8)}', 'Phase 8 isolation probe', 'ACTIVE')
      `);
      await tx.$executeRawUnsafe('SET LOCAL ROLE NONE');
      await tx.$executeRawUnsafe(`
        DO $probe$
        BEGIN
          UPDATE public.play_sessions
          SET club_id = '${probeClubId}'::uuid
          WHERE id = (SELECT id FROM public.play_sessions ORDER BY id LIMIT 1);
          RAISE EXCEPTION 'cross-tenant relation was accepted';
        EXCEPTION WHEN foreign_key_violation THEN
          NULL;
        END
        $probe$
      `);
      await tx.$executeRawUnsafe('REVOKE badmin_schema_owner FROM neondb_owner');
      throw new Error(sentinel);
    });
  } catch (error) {
    if (error instanceof Error && error.message === sentinel) return { rejected: true, rolledBack: true };
    throw error;
  }
  throw new Error('Isolation probe không rollback như dự kiến.');
}

try {
  let results;
  if (action === 'verify') {
    results = await verify();
    if (results.indexes.length === TENANT_INDEXES.length + TENANT_UNIQUES.length
      && results.indexes.every((index) => index.indisvalid && index.indisready)
      && results.constraints.length === DIRECT_CLUB_FKS.length + TENANT_RELATIONS.length
      && results.constraints.every((constraint) => constraint.convalidated)
      && results.nullability.length === TENANT_TABLES.length
      && results.nullability.every((column) => column.attnotnull)) {
      results.crossTenantNegativeProbe = await crossTenantNegativeProbe();
    }
  } else if (requestedPhase === '8A') results = await apply8A();
  else if (requestedPhase === '8B') results = await apply8B();
  else if (requestedPhase === '8C') results = await apply8C();
  else if (requestedPhase === '8D') results = await apply8D();
  else results = await apply8E();

  console.log(JSON.stringify({ target, action, phase: requestedPhase ?? null, results, timings }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
