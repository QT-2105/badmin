import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissionKeys,
  type PermissionKey,
  type UserRole
} from '@/lib/auth/permissions';

export type RolePermissionSummary = {
  role: UserRole;
  permissions: PermissionKey[];
};

const CONFIGURABLE_ROLES: UserRole[] = ['MANAGER', 'OPERATOR', 'VIEWER'];

export async function listRolePermissions(): Promise<RolePermissionSummary[]> {
  const { clubId } = requireTenantContext('role_permissions.list');
  const rows = await prisma.app_role_permissions.findMany({ where: { club_id: clubId } });
  const rowByRole = new Map(rows.map((row) => [row.role, normalizePermissionKeys(row.permissions)]));

  return (['OWNER', ...CONFIGURABLE_ROLES] as UserRole[]).map((role) => ({
    role,
    permissions: role === 'OWNER'
      ? DEFAULT_ROLE_PERMISSIONS.OWNER
      : rowByRole.get(role) ?? DEFAULT_ROLE_PERMISSIONS[role]
  }));
}

export async function getPermissionsForRole(role: UserRole, requestedClubId?: string): Promise<PermissionKey[]> {
  if (role === 'OWNER') return DEFAULT_ROLE_PERMISSIONS.OWNER;
  const clubId = requestedClubId ?? requireTenantContext('role_permissions.get.compatibility').clubId;
  const row = await prisma.app_role_permissions.findFirst({ where: { role, club_id: clubId } });
  return row ? normalizePermissionKeys(row.permissions) : DEFAULT_ROLE_PERMISSIONS[role];
}

export async function updateRolePermissions(role: UserRole, permissions: PermissionKey[]): Promise<RolePermissionSummary> {
  if (role === 'OWNER') {
    return { role, permissions: DEFAULT_ROLE_PERMISSIONS.OWNER };
  }
  const { clubId } = requireTenantContext('role_permissions.upsert');
  const normalized = normalizePermissionKeys(permissions);
  const existing = await prisma.app_role_permissions.findFirst({ where: { role, club_id: clubId } });
  const row = existing
    ? await prisma.app_role_permissions.update({
      where: { club_id_role: { club_id: clubId, role: existing.role } },
      data: { permissions: normalized, updated_at: new Date() }
    })
    : await prisma.app_role_permissions.create({
      data: { club_id: clubId, role, permissions: normalized, updated_at: new Date() }
    });

  return { role: row.role as UserRole, permissions: normalizePermissionKeys(row.permissions) };
}
