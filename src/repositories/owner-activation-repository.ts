import { prisma } from '@/lib/prisma';

export type OwnerActivationResult = { clubId: string; clubCode: string; userId: string };

export async function activateProvisionedOwner(input: {
  clubCode: string;
  activationTokenHash: string;
  passwordHash: string;
}): Promise<OwnerActivationResult | null> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    const rows = await tx.$queryRawUnsafe<Array<{
      club_id: string;
      club_code: string;
      user_id: string;
    }>>(
      'SELECT club_id::text, club_code, user_id::text FROM control.activate_club_owner($1, $2, $3)',
      input.clubCode,
      input.activationTokenHash,
      input.passwordHash
    );
    const row = rows[0];
    return row ? { clubId: row.club_id, clubCode: row.club_code, userId: row.user_id } : null;
  });
}
