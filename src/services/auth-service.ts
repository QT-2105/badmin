import type { AuthUser, PermissionKey, UserRole, UserStatus } from '@/lib/auth/permissions';

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }
  return (await res.json()) as T;
}

export type AuthUserSummary = AuthUser & {
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};

export type RolePermissionSummary = {
  role: UserRole;
  permissions: PermissionKey[];
};

export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { signal, cache: 'no-store' });
  if (res.status === 401) return null;
  const data = await readJson<{ user: AuthUser }>(res, 'Không thể tải tài khoản');
  return data.user;
}

export async function fetchBootstrapStatus(signal?: AbortSignal): Promise<boolean> {
  const res = await fetch('/api/auth/bootstrap', { signal, cache: 'no-store' });
  const data = await readJson<{ needsBootstrap: boolean }>(res, 'Không thể kiểm tra trạng thái khởi tạo');
  return data.needsBootstrap;
}

export async function bootstrapOwner(payload: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch('/api/auth/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ user: AuthUser }>(res, 'Không thể tạo tài khoản đầu tiên');
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await readJson<{ user: AuthUser }>(res, 'Không thể đăng nhập');
  return data.user;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  await readJson<{ ok: true }>(res, 'Không thể đăng xuất');
}

export async function fetchAuthUsers(signal?: AbortSignal): Promise<AuthUserSummary[]> {
  const res = await fetch('/api/auth/users', { signal, cache: 'no-store' });
  const data = await readJson<{ users: AuthUserSummary[] }>(res, 'Không thể tải danh sách tài khoản');
  return data.users;
}

export async function createAuthUser(payload: {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}): Promise<AuthUserSummary> {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ user: AuthUserSummary }>(res, 'Không thể tạo tài khoản');
  return data.user;
}

export async function updateAuthUser(userId: string, payload: {
  email?: string;
  displayName?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
}): Promise<AuthUserSummary> {
  const res = await fetch(`/api/auth/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ user: AuthUserSummary }>(res, 'Không thể cập nhật tài khoản');
  return data.user;
}

export async function fetchRolePermissions(signal?: AbortSignal): Promise<RolePermissionSummary[]> {
  const res = await fetch('/api/auth/role-permissions', { signal, cache: 'no-store' });
  const data = await readJson<{ roles: RolePermissionSummary[] }>(res, 'Không thể tải cấu hình phân quyền');
  return data.roles;
}

export async function updateRolePermissions(payload: {
  role: UserRole;
  permissions: PermissionKey[];
}): Promise<RolePermissionSummary> {
  const res = await fetch('/api/auth/role-permissions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ role: RolePermissionSummary }>(res, 'Không thể cập nhật phân quyền');
  return data.role;
}
