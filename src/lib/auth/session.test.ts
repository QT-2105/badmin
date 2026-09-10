import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  deleteSessionMany: vi.fn(),
  cleanupExpired: vi.fn(),
  create: vi.fn(),
  userFindFirst: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auth_sessions: {
      findFirst: prismaMocks.findFirst,
      deleteMany: prismaMocks.deleteSessionMany
    },
    $transaction: prismaMocks.transaction
  }
}));

import {
  SESSION_MAX_AGE_SECONDS,
  createAuthSession,
  getCurrentUserByToken,
  tokenHash
} from './session';

const activeUserRow = {
  id: 'user-1',
  username: 'owner',
  email: 'owner@example.com',
  email_normalized: 'owner@example.com',
  phone: null,
  display_name: 'Owner',
  role: 'OWNER',
  status: 'ACTIVE',
  club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'
};

describe('auth session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not query persistence when the cookie token is missing', async () => {
    await expect(getCurrentUserByToken(null)).resolves.toBeNull();
    expect(prismaMocks.findFirst).not.toHaveBeenCalled();
  });

  it('looks up only the token hash and returns an active user', async () => {
    const token = 'raw-session-token';
    prismaMocks.findFirst.mockResolvedValue({
      id: 'session-1',
      club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      expires_at: new Date(Date.now() + 60_000),
      app_users: activeUserRow
    });

    await expect(getCurrentUserByToken(token)).resolves.toEqual({
      id: 'user-1',
      clubId: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      username: 'owner',
      email: 'owner@example.com',
      phone: null,
      displayName: 'Owner',
      role: 'OWNER',
      status: 'ACTIVE'
    });
    expect(prismaMocks.findFirst).toHaveBeenCalledWith({
      where: {
        token_hash: tokenHash(token)
      },
      include: { app_users: true }
    });
    expect(tokenHash(token)).not.toBe(token);
  });

  it('expires and removes an elapsed session', async () => {
    prismaMocks.findFirst.mockResolvedValue({
      id: 'session-expired',
      club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      expires_at: new Date(Date.now() - 1_000),
      app_users: activeUserRow
    });
    prismaMocks.deleteSessionMany.mockResolvedValue({ count: 1 });

    await expect(getCurrentUserByToken('expired-token')).resolves.toBeNull();
    expect(prismaMocks.deleteSessionMany).toHaveBeenCalledWith({
      where: { id: 'session-expired', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
  });

  it('rejects a disabled user even when the session has not expired', async () => {
    prismaMocks.findFirst.mockResolvedValue({
      id: 'session-disabled',
      club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      expires_at: new Date(Date.now() + 60_000),
      app_users: { ...activeUserRow, status: 'DISABLED' }
    });

    await expect(getCurrentUserByToken('disabled-token')).resolves.toBeNull();
    expect(prismaMocks.deleteSessionMany).not.toHaveBeenCalled();
  });

  it('creates a fixed-lifetime session and persists only its hash', async () => {
    const tx = {
      auth_sessions: {
        deleteMany: prismaMocks.cleanupExpired,
        create: prismaMocks.create
      },
      app_users: { findFirst: prismaMocks.userFindFirst }
    };
    prismaMocks.transaction.mockImplementation(async (callback) => callback(tx));
    prismaMocks.userFindFirst.mockResolvedValue({ id: 'user-1' });
    prismaMocks.cleanupExpired.mockResolvedValue({ count: 0 });
    prismaMocks.create.mockResolvedValue({});

    const before = Date.now();
    const result = await createAuthSession('user-1');
    const after = Date.now();
    const createInput = prismaMocks.create.mock.calls[0]?.[0];

    expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_MAX_AGE_SECONDS * 1_000);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_MAX_AGE_SECONDS * 1_000);
    expect(createInput.data.user_id).toBe('user-1');
    expect(createInput.data.club_id).toBe('aa1f1aa3-c438-4498-96e9-ab228cd51f4f');
    expect(createInput.data.token_hash).toBe(tokenHash(result.token));
    expect(createInput.data.token_hash).not.toBe(result.token);
    expect(prismaMocks.cleanupExpired).toHaveBeenCalledWith({
      where: {
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        expires_at: { lte: expect.any(Date) }
      }
    });
  });
});
