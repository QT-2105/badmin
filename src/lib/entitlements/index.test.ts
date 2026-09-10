import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProjection: vi.fn(),
  sessionFindFirst: vi.fn(),
  playerFindFirst: vi.fn()
}));

vi.mock('@/repositories/control-club-repository', () => ({
  getControlClubEntitlementProjection: mocks.getProjection
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    play_sessions: { findFirst: mocks.sessionFindFirst },
    session_players: { findFirst: mocks.playerFindFirst }
  }
}));

import {
  clearEntitlementCacheForTests,
  evaluateClubFeature,
  evaluateEntitlement,
  getEffectiveEntitlement
} from './index';
import { ENTITLEMENT_FEATURE_KEYS } from './types';

const clubId = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';

function projection(overrides: Record<string, unknown> = {}) {
  return {
    id: clubId,
    code: 'tt-badminton',
    name: 'TT Badminton',
    status: 'ACTIVE',
    entitlementVersion: '7',
    features: Object.fromEntries(ENTITLEMENT_FEATURE_KEYS.map((key) => [key, true])),
    limits: { max_demo: 3, invalid: -1 },
    validUntil: null,
    entitlementUpdatedAt: new Date('2026-09-04T00:00:00.000Z'),
    ...overrides
  };
}

describe('effective entitlement evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearEntitlementCacheForTests();
    mocks.getProjection.mockResolvedValue(projection());
    mocks.sessionFindFirst.mockResolvedValue(null);
    mocks.playerFindFirst.mockResolvedValue(null);
  });

  it('keeps every current Legacy Club capability and reads limits without enforcing them', async () => {
    const entitlement = await getEffectiveEntitlement(clubId, new Date('2026-09-04T01:00:00.000Z'));

    expect(entitlement.enabledFeatures).toEqual(ENTITLEMENT_FEATURE_KEYS);
    expect(entitlement.limits).toEqual({ max_demo: 3 });
    expect(entitlement.version).toBe('7');
    expect(entitlement.source).toBe('CONTROL_PLANE');
  });

  it('reuses the versioned projection only inside the short refresh interval', async () => {
    const first = new Date('2026-09-04T01:00:00.000Z');
    await getEffectiveEntitlement(clubId, first);
    await getEffectiveEntitlement(clubId, new Date(first.getTime() + 10_000));
    await getEffectiveEntitlement(clubId, new Date(first.getTime() + 16_000));

    expect(mocks.getProjection).toHaveBeenCalledTimes(2);
  });

  it('denies a disabled feature without changing its stored projection', async () => {
    mocks.getProjection.mockResolvedValue(projection({ features: { dashboard: true, finance: false } }));
    const entitlement = await getEffectiveEntitlement(clubId);

    expect(evaluateEntitlement(entitlement, 'dashboard')).toMatchObject({ allowed: true, reason: 'ENABLED' });
    expect(evaluateEntitlement(entitlement, 'finance')).toMatchObject({ allowed: false, reason: 'FEATURE_DISABLED' });
    expect(mocks.getProjection).toHaveBeenCalledTimes(1);
  });

  it('treats an expired projection and an inactive club as disabled', async () => {
    const expired = await getEffectiveEntitlement(clubId, new Date('2026-09-04T01:00:00.000Z'));
    expired.validUntil = '2026-09-04T00:59:59.000Z';
    expect(evaluateEntitlement(expired, 'schedule', new Date('2026-09-04T01:00:00.000Z'))).toMatchObject({
      allowed: false, reason: 'EXPIRED'
    });

    expired.validUntil = null;
    expired.clubStatus = 'SUSPENDED';
    expect(evaluateEntitlement(expired, 'schedule')).toMatchObject({ allowed: false, reason: 'CLUB_INACTIVE' });
  });

  it('allows only a tenant-owned LIVE session to continue after downgrade', async () => {
    mocks.getProjection.mockResolvedValue(projection({ features: { 'session.runtime': false } }));
    mocks.sessionFindFirst.mockResolvedValue({ id: 'session-1' });

    await expect(evaluateClubFeature(clubId, 'session.runtime', {
      activeSessionId: 'session-1', allowActiveSessionContinuation: true
    })).resolves.toMatchObject({ allowed: true, reason: 'ACTIVE_SESSION_CONTINUATION' });
    expect(mocks.sessionFindFirst).toHaveBeenCalledWith({
      where: { id: 'session-1', club_id: clubId, status: 'LIVE' },
      select: { id: true }
    });
  });

  it('uses the last versioned, unexpired projection only inside the bounded outage window', async () => {
    const first = new Date('2026-09-04T01:00:00.000Z');
    await getEffectiveEntitlement(clubId, first);
    mocks.getProjection.mockRejectedValue(new Error('control unavailable'));

    await expect(getEffectiveEntitlement(clubId, new Date(first.getTime() + 60_000))).resolves.toMatchObject({
      version: '7', source: 'STALE_CACHE'
    });
    await expect(getEffectiveEntitlement(clubId, new Date(first.getTime() + 121_000))).rejects.toThrow('control unavailable');
  });
});
