import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  executeRawUnsafe: vi.fn(),
  queryRawUnsafe: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction }
}));

import { findLoginClubByCode, getControlClubEntitlementProjection, getControlClubFoundation, isClubLoginRolloutAllowed, searchLoginVisibleClubs } from './control-club-repository';

const clubId = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';

describe('control club read-only repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      $executeRawUnsafe: mocks.executeRawUnsafe,
      $queryRawUnsafe: mocks.queryRawUnsafe
    }));
  });

  it('requires a configured UUID before opening a transaction', async () => {
    await expect(getControlClubFoundation('')).rejects.toMatchObject({
      message: 'Legacy Club ID chưa được cấu hình hợp lệ.',
      status: 500
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('switches to the read-only control role and maps identity/status/version only', async () => {
    mocks.queryRawUnsafe.mockResolvedValue([{
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE',
      entitlement_version: 1n
    }]);

    await expect(getControlClubFoundation(clubId)).resolves.toEqual({
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE',
      entitlementVersion: '1'
    });
    expect(mocks.executeRawUnsafe).toHaveBeenCalledWith('SET LOCAL ROLE badmin_uat_app');
    expect(mocks.executeRawUnsafe.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.queryRawUnsafe.mock.invocationCallOrder[0]
    );
    expect(mocks.queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('e.version AS entitlement_version'), clubId);
  });

  it('returns null when the configured club projection is absent', async () => {
    mocks.queryRawUnsafe.mockResolvedValue([]);
    await expect(getControlClubFoundation(clubId)).resolves.toBeNull();
  });

  it('reads the complete effective entitlement projection without commercial plan fields', async () => {
    const updatedAt = new Date('2026-09-04T00:00:00.000Z');
    mocks.queryRawUnsafe.mockResolvedValue([{
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE',
      entitlement_version: 2n,
      features: { dashboard: true },
      limits: {},
      valid_until: null,
      entitlement_updated_at: updatedAt
    }]);

    await expect(getControlClubEntitlementProjection(clubId)).resolves.toEqual({
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE',
      entitlementVersion: '2',
      features: { dashboard: true },
      limits: {},
      validUntil: null,
      entitlementUpdatedAt: updatedAt
    });
    const sql = mocks.queryRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain('e.features');
    expect(sql).toContain('e.valid_until');
    expect(sql).not.toMatch(/plan|subscription|billing/i);
  });

  it('rejects an unknown lifecycle status from the control projection', async () => {
    mocks.queryRawUnsafe.mockResolvedValue([{
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'UNKNOWN',
      entitlement_version: 1n
    }]);
    await expect(getControlClubFoundation(clubId)).rejects.toMatchObject({
      message: 'Trạng thái Legacy Club không hợp lệ.',
      status: 500
    });
  });

  it('normalizes a club code and returns only a login-visible club', async () => {
    mocks.queryRawUnsafe.mockResolvedValue([{
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE'
    }]);
    await expect(findLoginClubByCode(' TT-BADMINTON ')).resolves.toEqual({
      id: clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE'
    });
    expect(mocks.queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining("status IN ('ACTIVE', 'GRACE_PERIOD')"), 'tt-badminton');
  });

  it('limits public search to active login-visible club fields', async () => {
    const rows = [{ id: clubId, code: 'tt-badminton', name: 'TT Badminton', status: 'ACTIVE' }];
    mocks.queryRawUnsafe.mockResolvedValue(rows);
    await expect(searchLoginVisibleClubs(' TT ')).resolves.toEqual(rows);
    expect(mocks.queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('LIMIT 8'), 'tt');
  });

  it('keeps login fail-closed outside the Legacy and explicit rollout allowlist', () => {
    const rolloutClubId = 'bb2f2bb4-d549-4598-a7f0-bc339de62f50';
    process.env.BADMIN_LOGIN_CLUB_ALLOWLIST = rolloutClubId;
    expect(isClubLoginRolloutAllowed(clubId)).toBe(true);
    expect(isClubLoginRolloutAllowed(rolloutClubId)).toBe(true);
    expect(isClubLoginRolloutAllowed('cc3f3cc5-e650-4650-93a1-cd440ef74061')).toBe(false);
    delete process.env.BADMIN_LOGIN_CLUB_ALLOWLIST;
  });
});
