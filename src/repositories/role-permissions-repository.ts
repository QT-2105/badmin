import { prisma } from '@/lib/prisma';
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
  const rows = await prisma.app_role_permissions.findMany();
  const rowByRole = new Map(rows.map((row) => [row.role, normalizePermissionKeys(row.permissions)]));

  return (['OWNER', ...CONFIGURABLE_ROLES] as UserRole[]).map((role) => ({
    role,
    permissions: role === 'OWNER'
      ? DEFAULT_ROLE_PERMISSIONS.OWNER
      : rowByRole.get(role) ?? DEFAULT_ROLE_PERMISSIONS[role]
  }));
}

export async function getPermissionsForRole(role: UserRole): Promise<PermissionKey[]> {
  if (role === 'OWNER') return DEFAULT_ROLE_PERMISSIONS.OWNER;
  const row = await prisma.app_role_permissions.findUnique({ where: { role } });
  return row ? normalizePermissionKeys(row.permissions) : DEFAULT_ROLE_PERMISSIONS[role];
}

export async function updateRolePermissions(role: UserRole, permissions: PermissionKey[]): Promise<RolePermissionSummary> {
  if (role === 'OWNER') {
    return { role, permissions: DEFAULT_ROLE_PERMISSIONS.OWNER };
  }
  const normalized = normalizePermissionKeys(permissions);
  const row = await prisma.app_role_permissions.upsert({
    where: { role },
    create: { role, permissions: normalized, updated_at: new Date() },
    update: { permissions: normalized, updated_at: new Date() }
  });

  return { role: row.role as UserRole, permissions: normalizePermissionKeys(row.permissions) };
}
