import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyPassword: vi.fn(),
  assertLoginAllowed: vi.fn(),
  clearLoginAttempts: vi.fn(),
  getLoginRateLimitKey: vi.fn(),
  recordFailedLogin: vi.fn(),
  createAuthSession: vi.fn(),
  setAuthCookie: vi.fn(),
  getAuthUserByIdentifier: vi.fn(),
  touchLastLogin: vi.fn(),
  findLoginClubByCode: vi.fn(),
  getControlClubFoundation: vi.fn(),
  isClubLoginRolloutAllowed: vi.fn()
}));

vi.mock('@/lib/auth/password', () => ({ verifyPassword: mocks.verifyPassword }));
vi.mock('@/lib/auth/rate-limit', () => ({
  assertLoginAllowed: mocks.assertLoginAllowed,
  clearLoginAttempts: mocks.clearLoginAttempts,
  getLoginRateLimitKey: mocks.getLoginRateLimitKey,
  recordFailedLogin: mocks.recordFailedLogin
}));
vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>();
  return { ...actual, createAuthSession: mocks.createAuthSession, setAuthCookie: mocks.setAuthCookie };
});
vi.mock('@/repositories/auth-users-repository', () => ({
  getAuthUserByIdentifier: mocks.getAuthUserByIdentifier,
  touchLastLogin: mocks.touchLastLogin
}));
vi.mock('@/repositories/control-club-repository', () => ({
  findLoginClubByCode: mocks.findLoginClubByCode,
  getControlClubFoundation: mocks.getControlClubFoundation,
  isClubLoginRolloutAllowed: mocks.isClubLoginRolloutAllowed
}));

import { POST } from './route';

const club = {
  id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
  code: 'tt-badminton',
  name: 'TT Badminton',
  status: 'ACTIVE',
  entitlementVersion: '1'
};
const activeUserRow = {
  id: 'user-1',
  club_id: club.id,
  username: 'owner',
  email: 'owner@example.com',
  email_normalized: 'owner@example.com',
  phone: null,
  display_name: 'Owner',
  password_hash: 'stored-password-hash',
  role: 'OWNER',
  status: 'ACTIVE'
};

function loginRequest(payload: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(payload)
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLoginRateLimitKey.mockReturnValue('hashed-rate-limit-key');
    mocks.getControlClubFoundation.mockResolvedValue(club);
    mocks.findLoginClubByCode.mockResolvedValue(club);
    mocks.isClubLoginRolloutAllowed.mockReturnValue(true);
  });

  it('requires both identifier and password before club or user access', async () => {
    const response = await POST(loginRequest({ identifier: '', password: '' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    expect(mocks.findLoginClubByCode).not.toHaveBeenCalled();
    expect(mocks.getAuthUserByIdentifier).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    ['disabled', { ...activeUserRow, status: 'DISABLED' }]
  ])('uses the same tenant-scoped generic response for a %s user', async (_case, userRow) => {
    mocks.getAuthUserByIdentifier.mockResolvedValue(userRow);
    const response = await POST(loginRequest({
      clubCode: 'TT-BADMINTON', identifier: ' Owner ', password: 'password-1'
    }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Tài khoản đăng nhập không hợp lệ hoặc không thuộc CLB TT Badminton. Vui lòng kiểm tra lại.'
    });
    expect(mocks.findLoginClubByCode).toHaveBeenCalledWith('tt-badminton');
    expect(mocks.getAuthUserByIdentifier).toHaveBeenCalledWith(club.id, 'Owner');
    expect(mocks.recordFailedLogin).toHaveBeenCalledWith('hashed-rate-limit-key');
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('does not reveal whether a valid club is blocked by the rollout gate', async () => {
    mocks.isClubLoginRolloutAllowed.mockReturnValue(false);
    mocks.getAuthUserByIdentifier.mockResolvedValue(activeUserRow);
    const response = await POST(loginRequest({ clubCode: club.code, identifier: 'owner', password: 'password-1' }));
    expect(response.status).toBe(401);
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('maps a malformed identifier to the same generic tenant login error', async () => {
    const { AppError } = await import('@/lib/app-error');
    mocks.getAuthUserByIdentifier.mockRejectedValue(new AppError('Email không hợp lệ.', 400));
    const response = await POST(loginRequest({ clubCode: club.code, identifier: 'bad@email', password: 'password-1' }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Tài khoản đăng nhập không hợp lệ hoặc không thuộc CLB TT Badminton. Vui lòng kiểm tra lại.'
    });
    expect(mocks.recordFailedLogin).toHaveBeenCalledWith('hashed-rate-limit-key');
  });

  it('records a failed attempt and keeps the response generic for a wrong password', async () => {
    mocks.getAuthUserByIdentifier.mockResolvedValue(activeUserRow);
    mocks.verifyPassword.mockResolvedValue(false);
    const response = await POST(loginRequest({ clubCode: club.code, identifier: 'owner', password: 'wrong' }));
    expect(response.status).toBe(401);
    expect(mocks.recordFailedLogin).toHaveBeenCalledOnce();
    expect(mocks.createAuthSession).not.toHaveBeenCalled();
  });

  it('keeps legacy payload compatibility and binds the new session to Legacy Club', async () => {
    const expiresAt = new Date('2026-08-28T00:00:00.000Z');
    mocks.getAuthUserByIdentifier.mockResolvedValue(activeUserRow);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createAuthSession.mockResolvedValue({ token: 'raw-token', expiresAt });
    const response = await POST(loginRequest({ email: 'owner', password: 'correct-password' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 'user-1', clubId: club.id, username: 'owner', email: 'owner@example.com', phone: null,
        displayName: 'Owner', role: 'OWNER', status: 'ACTIVE'
      },
      club: { code: club.code, name: club.name }
    });
    expect(mocks.getControlClubFoundation).toHaveBeenCalled();
    expect(mocks.createAuthSession).toHaveBeenCalledWith('user-1', club.id);
    expect(mocks.touchLastLogin).toHaveBeenCalledWith('user-1', club.id);
    expect(mocks.clearLoginAttempts).toHaveBeenCalledWith('hashed-rate-limit-key');
    expect(mocks.setAuthCookie).toHaveBeenCalledWith(response, 'raw-token', expiresAt);
  });
});
