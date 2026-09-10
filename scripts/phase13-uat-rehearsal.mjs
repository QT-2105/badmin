import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

import { assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const CONFIRMATION = 'REHEARSE_UAT_C2F96CE9DCD6_PHASE13';
if (process.argv[2] !== 'verify' && process.argv[2] !== 'rehearse') {
  throw new Error('Cách dùng: phase13-uat-rehearsal.mjs <verify|rehearse>. Migration vẫn phải áp dụng thủ công.');
}
if (process.argv[2] === 'rehearse' && process.env.BADMIN_PHASE13_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_PHASE13_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const directUrl = new URL(process.env.DATABASE_URL_UNPOOLED);
directUrl.searchParams.set('options', '-c lock_timeout=2s -c statement_timeout=60s');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });

async function verify() {
  const functions = await prisma.$queryRawUnsafe(`
    SELECT p.proname, p.prosecdef
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'control'
      AND p.proname IN ('provision_club_tenant', 'activate_club_owner', 'reissue_club_owner_activation')
    ORDER BY p.proname
  `);
  const [roleKey] = await prisma.$queryRawUnsafe(`
    SELECT pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.app_role_permissions'::regclass
      AND conname = 'app_role_permissions_pkey'
  `);
  const [grants] = await prisma.$queryRawUnsafe(`
    SELECT
      has_function_privilege('badmin_control_writer', 'control.provision_club_tenant(uuid,jsonb)', 'EXECUTE') AS control_execute,
      has_function_privilege('badmin_uat_app', 'control.activate_club_owner(text,text,text)', 'EXECUTE') AS badmin_execute,
      has_function_privilege('badmin_control_writer', 'control.reissue_club_owner_activation(text,text,timestamp with time zone)', 'EXECUTE') AS control_reissue_execute,
      (has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'INSERT')
        OR has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'UPDATE')
        OR has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'DELETE')) AS badmin_direct_receipt_write,
      (has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'INSERT')
        OR has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'UPDATE')
        OR has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'DELETE')) AS badmin_direct_activation_write
  `);
  return { functions, roleKey, grants };
}

async function rehearse() {
  const idempotencyKey = randomUUID();
  const clubId = randomUUID();
  const ownerUserId = randomUUID();
  const clubCode = `phase13-probe-${clubId.slice(0, 8)}`;
  const token = randomUUID();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const request = {
    club_id: clubId,
    club_code: clubCode,
    club_name: 'Phase 13 rollback probe',
    owner_user_id: ownerUserId,
    owner_username: `owner-${clubId.slice(0, 8)}`,
    owner_username_normalized: `owner-${clubId.slice(0, 8)}`,
    owner_email: null,
    owner_email_normalized: null,
    owner_phone: null,
    owner_phone_normalized: null,
    owner_display_name: 'Phase 13 Owner',
    activation_token_hash: tokenHash,
    activation_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    features: { dashboard: true, schedule: true },
    limits: { maxUsers: 5 }
  };
  const sentinel = `phase13-probe-rollback:${clubId}`;
  let evidence;
  try {
    await prisma.$transaction(async (tx) => {
      const provision = () => tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, owner_user_id::text, provisioning_status FROM control.provision_club_tenant($1::uuid, $2::jsonb)',
        idempotencyKey,
        JSON.stringify(request)
      );
      const first = await provision();
      const retry = await provision();

      await tx.$executeRawUnsafe('SAVEPOINT phase13_mismatch_probe');
      let mismatchRejected = false;
      try {
        await tx.$queryRawUnsafe(
          'SELECT * FROM control.provision_club_tenant($1::uuid, $2::jsonb)',
          idempotencyKey,
          JSON.stringify({ ...request, club_name: 'Different payload' })
        );
      } catch {
        mismatchRejected = true;
        await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT phase13_mismatch_probe');
      }
      await tx.$executeRawUnsafe('RELEASE SAVEPOINT phase13_mismatch_probe');

      const passwordHash = `scrypt:${'a'.repeat(32)}:${'b'.repeat(128)}`;
      const activated = await tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, user_id::text FROM control.activate_club_owner($1, $2, $3)',
        clubCode, tokenHash, passwordHash
      );
      const activationRetry = await tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, user_id::text FROM control.activate_club_owner($1, $2, $3)',
        clubCode, tokenHash, passwordHash
      );
      const [counts] = await tx.$queryRawUnsafe(`
        SELECT
          (SELECT count(*) FROM control.clubs WHERE id = $1::uuid) AS clubs,
          (SELECT count(*) FROM control.club_entitlements WHERE club_id = $1::uuid) AS entitlements,
          (SELECT count(*) FROM public.app_settings WHERE club_id = $1::uuid) AS settings,
          (SELECT count(*) FROM public.app_role_permissions WHERE club_id = $1::uuid) AS roles,
          (SELECT count(*) FROM public.app_users WHERE club_id = $1::uuid AND role = 'OWNER') AS owners,
          (SELECT count(*) FROM control.club_provisioning_receipts WHERE club_id = $1::uuid) AS receipts,
          (SELECT count(*) FROM control.club_owner_activations WHERE club_id = $1::uuid) AS activations,
          (SELECT status FROM control.clubs WHERE id = $1::uuid) AS club_status,
          (SELECT status FROM public.app_users WHERE id = $2::uuid) AS owner_status
      `, clubId, ownerUserId);

      evidence = { first, retry, mismatchRejected, activated, activationRetry, counts };
      if (
        !mismatchRejected
        || JSON.stringify(first, jsonReplacer) !== JSON.stringify(retry, jsonReplacer)
        || JSON.stringify(activated, jsonReplacer) !== JSON.stringify(activationRetry, jsonReplacer)
        || ['clubs', 'entitlements', 'settings', 'owners', 'receipts', 'activations'].some((key) => counts[key] !== 1n)
        || counts.roles !== 3n
        || counts.club_status !== 'ACTIVE'
        || counts.owner_status !== 'ACTIVE'
      ) throw new Error('Phase 13 idempotency/activation acceptance failed.');
      throw new Error(sentinel);
    }, { maxWait: 10_000, timeout: 60_000 });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== sentinel) throw error;
  }
  const [residue] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM control.clubs WHERE id = $1::uuid) AS clubs,
      (SELECT count(*) FROM public.app_users WHERE id = $2::uuid) AS users,
      (SELECT count(*) FROM control.club_provisioning_receipts WHERE idempotency_key = $3::uuid) AS receipts
  `, clubId, ownerUserId, idempotencyKey);
  if (residue.clubs !== 0n || residue.users !== 0n || residue.receipts !== 0n) {
    throw new Error('Phase 13 rollback probe left residue.');
  }
  return { ...evidence, rolledBack: true, residue };
}

try {
  const action = process.argv[2];
  const result = action === 'verify' ? await verify() : await rehearse();
  console.log(JSON.stringify({ target, action, result }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
