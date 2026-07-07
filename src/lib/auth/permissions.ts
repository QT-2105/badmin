export const USER_ROLES = ['OWNER', 'MANAGER', 'OPERATOR', 'VIEWER'] as const;
export const USER_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  permissions?: PermissionKey[];
};

const ROLE_RANK: Record<UserRole, number> = {
  OWNER: 4,
  MANAGER: 3,
  OPERATOR: 2,
  VIEWER: 1
};

const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Chủ CLB',
  MANAGER: 'Quản lý',
  OPERATOR: 'Điều phối',
  VIEWER: 'Chỉ xem'
};

export function normalizeUserRole(value: unknown): UserRole {
  const raw = String(value ?? '').trim().toUpperCase();
  return USER_ROLES.includes(raw as UserRole) ? raw as UserRole : 'OPERATOR';
}

export function normalizeUserStatus(value: unknown): UserStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  return USER_STATUSES.includes(raw as UserStatus) ? raw as UserStatus : 'ACTIVE';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export const PERMISSION_DEFINITIONS = [
  { key: 'dashboard.view', label: 'Xem Dashboard', group: 'Dashboard' },
  { key: 'schedule.view', label: 'Xem lịch và ca chơi', group: 'Lịch chơi' },
  { key: 'schedule.manage', label: 'Tạo/sửa/xóa ngày chơi, ca chơi', group: 'Lịch chơi' },
  { key: 'session.view', label: 'Xem chi tiết ca', group: 'Ca chơi' },
  { key: 'session.operate', label: 'Điều phối ca, người chơi, runtime', group: 'Ca chơi' },
  { key: 'session.complete', label: 'Hoàn tất ca, chốt thu chi/kho', group: 'Ca chơi' },
  { key: 'finance.view', label: 'Xem thu chi', group: 'Thu chi' },
  { key: 'finance.manage', label: 'Tạo phiếu thu chi', group: 'Thu chi' },
  { key: 'inventory.view', label: 'Xem kho cầu', group: 'Kho cầu' },
  { key: 'inventory.manage', label: 'Tạo/sửa/xóa loại cầu, nhập/xuất kho', group: 'Kho cầu' },
  { key: 'settings.manage', label: 'Cài đặt app', group: 'Cài đặt' },
  { key: 'users.manage', label: 'Quản lý user và phân quyền', group: 'User' }
] as const;

export type PermissionKey = (typeof PERMISSION_DEFINITIONS)[number]['key'];

export const ALL_PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((item) => item.key) as PermissionKey[];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  OWNER: ALL_PERMISSION_KEYS,
  MANAGER: [
    'dashboard.view',
    'schedule.view',
    'schedule.manage',
    'session.view',
    'session.operate',
    'session.complete',
    'finance.view',
    'finance.manage',
    'inventory.view',
    'inventory.manage'
  ],
  OPERATOR: [
    'dashboard.view',
    'schedule.view',
    'session.view',
    'session.operate',
    'inventory.view'
  ],
  VIEWER: [
    'dashboard.view',
    'schedule.view',
    'session.view',
    'finance.view',
    'inventory.view'
  ]
};

export function normalizePermissionKeys(value: unknown): PermissionKey[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(ALL_PERMISSION_KEYS);
  return Array.from(new Set(value.map((item) => String(item)).filter((item): item is PermissionKey => allowed.has(item as PermissionKey))));
}

export function hasPermission(user: AuthUser | null, permission: PermissionKey): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  if (user.role === 'OWNER') return true;
  return Boolean(user.permissions?.includes(permission));
}

export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return roles.includes(user.role);
}

export function hasMinimumRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[role];
}

export const ROUTE_PERMISSION_RULES: Array<{ prefix: string; permission: PermissionKey }> = [
  { prefix: '/users', permission: 'users.manage' },
  { prefix: '/settings', permission: 'settings.manage' },
  { prefix: '/finance', permission: 'finance.view' },
  { prefix: '/inventory', permission: 'inventory.view' },
  { prefix: '/sessions', permission: 'session.view' },
  { prefix: '/schedule', permission: 'schedule.view' },
  { prefix: '/dashboard', permission: 'dashboard.view' }
];

export function getRoutePermission(pathname: string): PermissionKey {
  return ROUTE_PERMISSION_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))?.permission ?? 'dashboard.view';
}
