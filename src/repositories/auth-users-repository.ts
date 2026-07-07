import { prisma } from '@/lib/prisma';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { normalizeUserRole, normalizeUserStatus, type AuthUser, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import { toAuthUser } from '@/lib/auth/session';
import { AppError } from '@/lib/app-error';

export type AuthUserSummary = AuthUser & {
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};

function mapUser(row: {
  id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
  last_login_at: Date | null;
}): AuthUserSummary {
  return {
    ...toAuthUser(row),
    createdAt: row.created_at?.toISOString() ?? null,
    updatedAt: row.updated_at?.toISOString() ?? null,
    lastLoginAt: row.last_login_at?.toISOString() ?? null
  };
}

export async function listAuthUsers(): Promise<AuthUserSummary[]> {
  const rows = await prisma.app_users.findMany({ orderBy: [{ role: 'asc' }, { created_at: 'asc' }] });
  return rows.map(mapUser);
}

export async function countAuthUsers(): Promise<number> {
  return prisma.app_users.count();
}

export async function countActiveOwners(): Promise<number> {
  return prisma.app_users.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
}

export async function getAuthUserById(userId: string) {
  return prisma.app_users.findUnique({ where: { id: userId } });
}

export async function getAuthUserByEmail(email: string) {
  return prisma.app_users.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export async function createAuthUser(input: {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}): Promise<AuthUserSummary> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new AppError('Vui lòng nhập tên đăng nhập.', 400);
  if (!input.displayName.trim()) throw new AppError('Vui lòng nhập tên hiển thị.', 400);
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new AppError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, 400);

  const row = await prisma.app_users.create({
    data: {
      email,
      display_name: input.displayName.trim(),
      password_hash: await hashPassword(input.password),
      role: normalizeUserRole(input.role),
      status: 'ACTIVE'
    }
  });
  return mapUser(row);
}

export async function updateAuthUser(userId: string, input: {
  email?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}): Promise<AuthUserSummary> {
  const data: {
    email?: string;
    display_name?: string;
    role?: UserRole;
    status?: UserStatus;
    password_hash?: string;
    updated_at: Date;
  } = { updated_at: new Date() };

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email) throw new AppError('Vui lòng nhập tên đăng nhập.', 400);
    data.email = email;
  }
  if (input.displayName !== undefined) {
    if (!input.displayName.trim()) throw new AppError('Vui lòng nhập tên hiển thị.', 400);
    data.display_name = input.displayName.trim();
  }
  if (input.role !== undefined) data.role = normalizeUserRole(input.role);
  if (input.status !== undefined) data.status = normalizeUserStatus(input.status);
  if (input.password !== undefined && input.password.length > 0) {
    if (input.password.length < MIN_PASSWORD_LENGTH) throw new AppError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, 400);
    data.password_hash = await hashPassword(input.password);
  }

  const row = await prisma.app_users.update({ where: { id: userId }, data });
  if (data.status === 'DISABLED') {
    await prisma.auth_sessions.deleteMany({ where: { user_id: userId } });
  }
  return mapUser(row);
}

export async function touchLastLogin(userId: string): Promise<void> {
  await prisma.app_users.update({
    where: { id: userId },
    data: { last_login_at: new Date(), updated_at: new Date() }
  });
}
