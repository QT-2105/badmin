import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

import { LEGACY_CLUB_ID, assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const CONFIRMATION = 'REHEARSE_UAT_C2F96CE9DCD6_PHASE14_SHADOW';
if (process.env.BADMIN_PHASE14_CONFIRM !== CONFIRMATION) {
  throw new Error(`Thiếu BADMIN_PHASE14_CONFIRM=${CONFIRMATION}.`);
}

const target = assertPhase8Target();
const directUrl = new URL(process.env.DATABASE_URL_UNPOOLED);
directUrl.searchParams.set('options', '-c lock_timeout=2s -c statement_timeout=90s');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });

const clubId = randomUUID();
const ownerUserId = randomUUID();
const idempotencyKey = randomUUID();
const clubCode = `shadow-${clubId.slice(0, 8)}`;
const tokenHash = createHash('sha256').update(randomUUID()).digest('hex');
const sentinel = `phase14-shadow-rollback:${clubId}`;
let evidence;

try {
  try {
    await prisma.$transaction(async (tx) => {
      const [legacyIdentifier] = await tx.$queryRawUnsafe(`
        SELECT username, username_normalized, email, email_normalized, phone, phone_normalized
        FROM public.app_users
        WHERE club_id = $1::uuid
          AND coalesce(username_normalized, email_normalized, phone_normalized) IS NOT NULL
        ORDER BY created_at, id LIMIT 1
      `, LEGACY_CLUB_ID);
      const [legacyDate] = await tx.$queryRawUnsafe(`
        SELECT id::text, play_date::text FROM public.play_dates
        WHERE club_id = $1::uuid ORDER BY play_date, id LIMIT 1
      `, LEGACY_CLUB_ID);
      if (!legacyIdentifier || !legacyDate) throw new Error('Legacy baseline lacks identifier or play date for shadow probe.');

      const request = {
        club_id: clubId,
        club_code: clubCode,
        club_name: 'Phase 14 rollback shadow',
        owner_user_id: ownerUserId,
        owner_username: legacyIdentifier.username,
        owner_username_normalized: legacyIdentifier.username_normalized,
        owner_email: legacyIdentifier.email,
        owner_email_normalized: legacyIdentifier.email_normalized,
        owner_phone: legacyIdentifier.phone,
        owner_phone_normalized: legacyIdentifier.phone_normalized,
        owner_display_name: 'Phase 14 Shadow Owner',
        activation_token_hash: tokenHash,
        activation_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        features: { dashboard: true, schedule: true, finance: true, inventory: true },
        limits: { maxUsers: 5 }
      };
      await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_control_writer');
      const provision = await tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, owner_user_id::text, provisioning_status FROM control.provision_club_tenant($1::uuid, $2::jsonb)',
        idempotencyKey,
        JSON.stringify(request)
      );
      const retry = await tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, owner_user_id::text, provisioning_status FROM control.provision_club_tenant($1::uuid, $2::jsonb)',
        idempotencyKey,
        JSON.stringify(request)
      );
      await tx.$executeRawUnsafe('RESET ROLE');
      await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
      await tx.$executeRawUnsafe(
        'INSERT INTO public.play_dates (club_id, play_date, title) VALUES ($1::uuid, $2::date, $3)',
        clubId,
        legacyDate.play_date,
        'Phase 14 same-date probe'
      );

      await tx.$executeRawUnsafe('SAVEPOINT cross_tenant_parent_probe');
      let crossTenantParentRejected = false;
      try {
        await tx.$executeRawUnsafe(`
          INSERT INTO public.play_sessions (club_id, play_date_id, name, start_time, end_time)
          VALUES ($1::uuid, $2::uuid, 'Cross tenant probe', '18:00', '20:00')
        `, clubId, legacyDate.id);
      } catch {
        crossTenantParentRejected = true;
        await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT cross_tenant_parent_probe');
      }
      await tx.$executeRawUnsafe('RELEASE SAVEPOINT cross_tenant_parent_probe');

      const passwordHash = `scrypt:${'a'.repeat(32)}:${'b'.repeat(128)}`;
      const activated = await tx.$queryRawUnsafe(
        'SELECT club_id::text, club_code, user_id::text FROM control.activate_club_owner($1, $2, $3)',
        clubCode,
        tokenHash,
        passwordHash
      );
      const [isolation] = await tx.$queryRawUnsafe(`
        SELECT
          (SELECT count(*) FROM public.play_dates WHERE club_id = $1::uuid AND play_date = $2::date) AS shadow_same_date,
          (SELECT count(*) FROM public.play_dates WHERE club_id = $3::uuid AND play_date = $2::date) AS legacy_same_date,
          (SELECT count(*) FROM public.app_users WHERE club_id = $1::uuid AND role = 'OWNER' AND status = 'ACTIVE') AS shadow_active_owner,
          (SELECT count(*) FROM public.app_users WHERE club_id = $3::uuid) AS legacy_users,
          (SELECT count(*) FROM control.clubs WHERE id = $1::uuid AND status = 'ACTIVE') AS shadow_active_club
      `, clubId, legacyDate.play_date, LEGACY_CLUB_ID);

      evidence = {
        idempotentProvisioning: JSON.stringify(provision, jsonReplacer) === JSON.stringify(retry, jsonReplacer),
        duplicateIdentifierAcrossTenants: true,
        duplicatePlayDateAcrossTenants: isolation.shadow_same_date === 1n && isolation.legacy_same_date >= 1n,
        crossTenantParentRejected,
        activated: activated.length === 1,
        isolation
      };
      if (!Object.values(evidence).slice(0, 5).every(Boolean)) throw new Error('Phase 14 shadow acceptance failed.');
      throw new Error(sentinel);
    }, { maxWait: 10_000, timeout: 90_000 });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== sentinel) throw error;
  }

  const [residue] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT count(*) FROM control.clubs WHERE id = $1::uuid) AS clubs,
      (SELECT count(*) FROM public.app_users WHERE id = $2::uuid) AS users,
      (SELECT count(*) FROM control.club_provisioning_receipts WHERE idempotency_key = $3::uuid) AS receipts
  `, clubId, ownerUserId, idempotencyKey);
  if (residue.clubs !== 0n || residue.users !== 0n || residue.receipts !== 0n) throw new Error('Phase 14 shadow rehearsal left residue.');
  console.log(JSON.stringify({ target, rolledBack: true, evidence, residue }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
