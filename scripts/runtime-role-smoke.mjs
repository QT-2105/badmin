import { PrismaClient } from '@prisma/client';

import { LEGACY_CLUB_ID, assertPhase8Target, jsonReplacer } from './phase8-contract.mjs';

const target = assertPhase8Target();
const role = process.env.BADMIN_RUNTIME_DB_ROLE?.trim();
if (role !== 'badmin_uat_app') throw new Error('BADMIN_RUNTIME_DB_ROLE phải là badmin_uat_app trên UAT.');

const url = new URL(process.env.DATABASE_URL_UNPOOLED);
const currentOptions = url.searchParams.get('options')?.trim();
url.searchParams.set('options', [currentOptions, `-c role=${role}`].filter(Boolean).join(' '));
const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });

try {
  const [identity] = await prisma.$queryRawUnsafe(`
    SELECT current_user, session_user,
      (SELECT count(*) FROM public.app_settings WHERE club_id = $1::uuid) AS legacy_settings
  `, LEGACY_CLUB_ID);
  if (identity.current_user !== role || identity.legacy_settings !== 1n) {
    throw new Error('Runtime effective role smoke check failed.');
  }

  let controlMutationRejected = false;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SAVEPOINT control_mutation_probe');
    try {
      await tx.$executeRawUnsafe('UPDATE control.clubs SET updated_at = updated_at WHERE false');
    } catch {
      controlMutationRejected = true;
      await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT control_mutation_probe');
    }
    await tx.$executeRawUnsafe('RELEASE SAVEPOINT control_mutation_probe');
  });
  if (!controlMutationRejected) throw new Error('Runtime role can mutate Control Plane club rows.');

  console.log(JSON.stringify({
    target,
    effectiveRole: identity.current_user,
    loginRole: identity.session_user,
    legacySettingsReadable: identity.legacy_settings,
    controlMutationRejected
  }, jsonReplacer, 2));
} finally {
  await prisma.$disconnect();
}
