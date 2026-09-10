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

export type LoginVisibleClub = { code: string; name: string };

export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { signal, cache: 'no-store' });
  if (res.status === 401) return null;
  const data = await readJson<{ user: AuthUser }>(res, 'Không thể tải tài khoản');
  return data.user;
}

export async function lookupLoginClubs(query: string, signal?: AbortSignal): Promise<LoginVisibleClub[]> {
  const res = await fetch(`/api/public/clubs?q=${encodeURIComponent(query)}`, { signal, cache: 'no-store' });
  const data = await readJson<{ clubs: LoginVisibleClub[] }>(res, 'Không thể tìm CLB');
  return data.clubs;
}

export async function login(clubCode: string, identifier: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clubCode, identifier, password })
  });
  const data = await readJson<{ user: AuthUser }>(res, 'Không thể đăng nhập');
  return data.user;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  await readJson<{ ok: true }>(res, 'Không thể đăng xuất');
}

export async function activateClubOwner(payload: { clubCode: string; token: string; password: string }): Promise<void> {
  const res = await fetch('/api/auth/activate-owner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await readJson<{ ok: true }>(res, 'Không thể kích hoạt tài khoản OWNER');
}

export async function fetchAuthUsers(signal?: AbortSignal): Promise<AuthUserSummary[]> {
  const res = await fetch('/api/auth/users', { signal, cache: 'no-store' });
  const data = await readJson<{ users: AuthUserSummary[] }>(res, 'Không thể tải danh sách tài khoản');
  return data.users;
}

export async function createAuthUser(payload: {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
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
  username?: string | null;
  email?: string | null;
  phone?: string | null;
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
