import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { classifyLoginIdentifier, normalizeAuthIdentifiers } from '@/lib/auth/identifiers';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { normalizeUserRole, normalizeUserStatus, type AuthUser, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import { toAuthUser } from '@/lib/auth/session';
import { AppError } from '@/lib/app-error';
import { requireTenantContext } from '@/lib/tenant-context';

export type AuthUserSummary = AuthUser & {
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};

function mapUser(row: {
  id: string;
  club_id: string;
  username: string | null;
  email: string | null;
  email_normalized: string | null;
  phone: string | null;
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
  const { clubId } = requireTenantContext('auth.user.list');
  const rows = await prisma.app_users.findMany({
    where: { club_id: clubId },
    orderBy: [{ role: 'asc' }, { created_at: 'asc' }]
  });
  return rows.map(mapUser);
}

export async function countAuthUsers(): Promise<number> {
  const { clubId } = requireTenantContext('auth.user.count');
  return prisma.app_users.count({ where: { club_id: clubId } });
}

export async function countActiveOwners(): Promise<number> {
  const { clubId } = requireTenantContext('auth.owner.count');
  return prisma.app_users.count({ where: { club_id: clubId, role: 'OWNER', status: 'ACTIVE' } });
}

export async function getAuthUserById(userId: string) {
  const { clubId } = requireTenantContext('auth.user.get');
  return prisma.app_users.findFirst({ where: { id: userId, club_id: clubId } });
}

export async function getAuthUserByEmail(email: string) {
  const { clubId } = requireTenantContext('auth.user.login_lookup');
  return prisma.app_users.findFirst({
    where: { club_id: clubId, email: email.trim().toLowerCase() }
  });
}

export async function getAuthUserByIdentifier(clubId: string, identifier: string) {
  const classified = classifyLoginIdentifier(identifier);
  const where = classified.kind === 'username'
    ? { username_normalized: classified.normalized }
    : classified.kind === 'email'
      ? { email_normalized: classified.normalized }
      : { phone_normalized: classified.normalized };
  return prisma.app_users.findFirst({ where: { club_id: clubId, ...where } });
}

export async function createAuthUser(input: {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  displayName: string;
  password: string;
  role: UserRole;
}): Promise<AuthUserSummary> {
  const { clubId } = requireTenantContext('auth.user.create');
  const legacyLogin = !input.username && !input.phone && input.email && !input.email.includes('@') ? input.email : undefined;
  const identifiers = normalizeAuthIdentifiers({
    username: input.username,
    email: legacyLogin ? undefined : input.email,
    phone: input.phone,
    legacyLogin
  });
  if (!input.displayName.trim()) throw new AppError('Vui lòng nhập tên hiển thị.', 400);
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new AppError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`, 400);

  try {
    const row = await prisma.app_users.create({
      data: {
        club_id: clubId,
        username: identifiers.username,
        username_normalized: identifiers.usernameNormalized,
        email: identifiers.email,
        email_normalized: identifiers.emailNormalized,
        phone: identifiers.phone,
        phone_normalized: identifiers.phoneNormalized,
        display_name: input.displayName.trim(),
        password_hash: await hashPassword(input.password),
        role: normalizeUserRole(input.role),
        status: 'ACTIVE'
      }
    });
    return mapUser(row);
  } catch (error) {
    throw mapIdentifierConflict(error);
  }
}

export async function updateAuthUser(userId: string, input: {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}): Promise<AuthUserSummary> {
  const { clubId } = requireTenantContext('auth.user.update');
  const existing = await prisma.app_users.findFirst({ where: { id: userId, club_id: clubId } });
  if (!existing) throw new AppError('Không tìm thấy tài khoản.', 404);
  const data: {
    username?: string | null;
    username_normalized?: string | null;
    email?: string | null;
    email_normalized?: string | null;
    phone?: string | null;
    phone_normalized?: string | null;
    display_name?: string;
    role?: UserRole;
    status?: UserStatus;
    password_hash?: string;
    updated_at: Date;
  } = { updated_at: new Date() };

  if (input.username !== undefined || input.email !== undefined || input.phone !== undefined) {
    const legacyLogin = input.username === undefined
      && input.phone === undefined
      && typeof input.email === 'string'
      && input.email.length > 0
      && !input.email.includes('@')
      ? input.email
      : undefined;
    const identifiers = normalizeAuthIdentifiers({
      username: legacyLogin ? legacyLogin : (input.username !== undefined ? input.username : existing.username),
      email: legacyLogin ? (existing.email_normalized ? existing.email : null) : (input.email !== undefined ? input.email : (existing.email_normalized ? existing.email : null)),
      phone: input.phone !== undefined ? input.phone : existing.phone
    });
    data.username = identifiers.username;
    data.username_normalized = identifiers.usernameNormalized;
    data.email = identifiers.email;
    data.email_normalized = identifiers.emailNormalized;
    data.phone = identifiers.phone;
    data.phone_normalized = identifiers.phoneNormalized;
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

  let changed;
  try {
    changed = await prisma.app_users.updateMany({ where: { id: userId, club_id: clubId }, data });
  } catch (error) {
    throw mapIdentifierConflict(error);
  }
  if (changed.count === 0) throw new AppError('Không tìm thấy tài khoản.', 404);
  if (data.status === 'DISABLED') {
    await prisma.auth_sessions.deleteMany({ where: { club_id: clubId, user_id: userId } });
  }
  const row = await prisma.app_users.findFirst({ where: { id: userId, club_id: clubId } });
  if (!row) throw new AppError('Không tìm thấy tài khoản.', 404);
  return mapUser(row);
}

function mapIdentifierConflict(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new AppError('Username, email hoặc số điện thoại đã được sử dụng trong CLB.', 409);
  }
  return error;
}

export async function touchLastLogin(userId: string, requestedClubId?: string): Promise<void> {
  const clubId = requestedClubId ?? requireTenantContext('auth.user.touch_login.compatibility').clubId;
  await prisma.app_users.updateMany({
    where: { id: userId, club_id: clubId },
    data: { last_login_at: new Date(), updated_at: new Date() }
  });
}
