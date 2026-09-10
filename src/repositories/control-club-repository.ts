import { AppError } from '@/lib/app-error';
import { prisma } from '@/lib/prisma';

export type ControlClubFoundation = {
  id: string;
  code: string;
  name: string;
  status: 'PROVISIONING' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'ARCHIVED';
  entitlementVersion: string;
};

export type LoginVisibleClub = {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'GRACE_PERIOD';
};

export type ControlClubEntitlementProjection = ControlClubFoundation & {
  features: unknown;
  limits: unknown;
  validUntil: Date | null;
  entitlementUpdatedAt: Date;
};

const CLUB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLUB_STATUSES = new Set<ControlClubFoundation['status']>([
  'PROVISIONING',
  'ACTIVE',
  'GRACE_PERIOD',
  'SUSPENDED',
  'ARCHIVED'
]);

export async function getControlClubFoundation(
  clubId = process.env.BADMIN_LEGACY_CLUB_ID?.trim()
): Promise<ControlClubFoundation | null> {
  if (!clubId || !CLUB_ID_PATTERN.test(clubId)) {
    throw new AppError('Legacy Club ID chưa được cấu hình hợp lệ.', 500);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    const rows = await tx.$queryRawUnsafe<Array<{
      id: string;
      code: string;
      name: string;
      status: string;
      entitlement_version: bigint;
    }>>(`
      SELECT
        c.id::text,
        c.code,
        c.name,
        c.status,
        e.version AS entitlement_version
      FROM control.clubs c
      JOIN control.club_entitlements e ON e.club_id = c.id
      WHERE c.id = $1::uuid
    `, clubId);

    const row = rows[0];
    if (!row) return null;
    if (!CLUB_STATUSES.has(row.status as ControlClubFoundation['status'])) {
      throw new AppError('Trạng thái Legacy Club không hợp lệ.', 500);
    }

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status as ControlClubFoundation['status'],
      entitlementVersion: row.entitlement_version.toString()
    };
  });
}

export async function getControlClubEntitlementProjection(clubId: string): Promise<ControlClubEntitlementProjection | null> {
  if (!clubId || !CLUB_ID_PATTERN.test(clubId)) throw new AppError('Club ID chưa được cấu hình hợp lệ.', 500);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    const rows = await tx.$queryRawUnsafe<Array<{
      id: string;
      code: string;
      name: string;
      status: string;
      entitlement_version: bigint;
      features: unknown;
      limits: unknown;
      valid_until: Date | null;
      entitlement_updated_at: Date;
    }>>(`
      SELECT
        c.id::text,
        c.code,
        c.name,
        c.status,
        e.version AS entitlement_version,
        e.features,
        e.limits,
        e.valid_until,
        e.updated_at AS entitlement_updated_at
      FROM control.clubs c
      JOIN control.club_entitlements e ON e.club_id = c.id
      WHERE c.id = $1::uuid
    `, clubId);

    const row = rows[0];
    if (!row) return null;
    if (!CLUB_STATUSES.has(row.status as ControlClubFoundation['status'])) {
      throw new AppError('Trạng thái CLB không hợp lệ.', 500);
    }
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      status: row.status as ControlClubFoundation['status'],
      entitlementVersion: row.entitlement_version.toString(),
      features: row.features,
      limits: row.limits,
      validUntil: row.valid_until,
      entitlementUpdatedAt: row.entitlement_updated_at
    };
  });
}

export async function findLoginClubByCode(code: string): Promise<LoginVisibleClub | null> {
  const normalized = code.normalize('NFKC').trim().toLowerCase();
  if (!normalized) return null;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    const rows = await tx.$queryRawUnsafe<Array<{
      id: string;
      code: string;
      name: string;
      status: 'ACTIVE' | 'GRACE_PERIOD';
    }>>(`
      SELECT id::text, code, name, status
      FROM control.clubs
      WHERE code = $1
        AND status IN ('ACTIVE', 'GRACE_PERIOD')
      LIMIT 1
    `, normalized);
    return rows[0] ?? null;
  });
}

export async function searchLoginVisibleClubs(query: string): Promise<LoginVisibleClub[]> {
  const normalized = query.normalize('NFKC').trim().toLowerCase().slice(0, 100);
  const legacyClubId = process.env.BADMIN_LEGACY_CLUB_ID?.trim();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE badmin_uat_app');
    if (!normalized) {
      if (!legacyClubId || !CLUB_ID_PATTERN.test(legacyClubId)) return [];
      return tx.$queryRawUnsafe<Array<LoginVisibleClub>>(`
        SELECT id::text, code, name, status
        FROM control.clubs
        WHERE id = $1::uuid AND status IN ('ACTIVE', 'GRACE_PERIOD')
        LIMIT 1
      `, legacyClubId);
    }
    return tx.$queryRawUnsafe<Array<LoginVisibleClub>>(`
      SELECT id::text, code, name, status
      FROM control.clubs
      WHERE status IN ('ACTIVE', 'GRACE_PERIOD')
        AND (position($1 in lower(code)) > 0 OR position($1 in lower(name)) > 0)
      ORDER BY
        CASE WHEN lower(code) = $1 THEN 0 WHEN lower(code) LIKE $1 || '%' THEN 1 WHEN lower(name) LIKE $1 || '%' THEN 2 ELSE 3 END,
        lower(name), code
      LIMIT 8
    `, normalized);
  });
}

export function isClubLoginRolloutAllowed(clubId: string): boolean {
  if (!CLUB_ID_PATTERN.test(clubId)) return false;
  const configured = [
    process.env.BADMIN_LEGACY_CLUB_ID,
    ...(process.env.BADMIN_LOGIN_CLUB_ALLOWLIST?.split(',') ?? [])
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value));
  return configured.some((allowedClubId) => CLUB_ID_PATTERN.test(allowedClubId) && allowedClubId === clubId);
}
