import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  hashPassword: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { app_users: { create: mocks.create, findFirst: mocks.findFirst, updateMany: mocks.updateMany }, auth_sessions: { deleteMany: vi.fn() } }
}));
vi.mock('@/lib/auth/password', () => ({
  MIN_PASSWORD_LENGTH: 8,
  hashPassword: mocks.hashPassword
}));

import { createAuthUser, updateAuthUser } from './auth-users-repository';

describe('auth user compatibility writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue('password-hash');
    mocks.create.mockImplementation(async ({ data }) => ({
      id: 'user-1',
      ...data,
      last_login_at: null,
      created_at: new Date('2099-01-01T00:00:00.000Z'),
      updated_at: null
    }));
  });

  it('writes server-owned Legacy Club ID when creating an app user', async () => {
    await createAuthUser({
      email: ' owner@example.com ',
      displayName: ' Owner ',
      password: 'password-123',
      role: 'OWNER'
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        email: 'owner@example.com',
        password_hash: 'password-hash'
      })
    });
  });

  it('returns not found without updating a user from another tenant', async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(updateAuthUser('foreign-user', { displayName: 'Changed' })).rejects.toMatchObject({
      status: 404
    });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-user',
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
      }
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
