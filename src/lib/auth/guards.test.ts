import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentUserByToken: vi.fn(),
  getCurrentUserFromCookies: vi.fn(),
  getPermissionsForRole: vi.fn(),
  getControlClubFoundation: vi.fn(),
  evaluateClubFeature: vi.fn(),
  getEffectiveEntitlement: vi.fn(),
  logEntitlementDecision: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn()
}));

vi.mock('./session', () => ({
  getCurrentUserByToken: mocks.getCurrentUserByToken,
  getCurrentUserFromCookies: mocks.getCurrentUserFromCookies
}));

vi.mock('@/repositories/role-permissions-repository', () => ({
  getPermissionsForRole: mocks.getPermissionsForRole
}));

vi.mock('@/repositories/control-club-repository', () => ({
  getControlClubFoundation: mocks.getControlClubFoundation
}));

vi.mock('@/lib/entitlements', () => ({
  evaluateClubFeature: mocks.evaluateClubFeature,
  getEffectiveEntitlement: mocks.getEffectiveEntitlement,
  logEntitlementDecision: mocks.logEntitlementDecision
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound
}));

import {
  AuthError,
  authErrorResponse,
  getBearerlessCookie,
  requireApiPermission,
  requireApiUser,
  requirePageUser,
  requireTenantPageUser,
  redirectLegacyPage
} from './guards';

const activeOperator = {
  id: 'cc3f3cc5-e650-4650-93a1-cd440ef74061',
  clubId: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
  username: 'operator',
  email: 'operator@example.com',
  phone: null,
  displayName: 'Operator',
  role: 'OPERATOR' as const,
  status: 'ACTIVE' as const
};

describe('auth guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPermissionsForRole.mockResolvedValue(['dashboard.view', 'session.view', 'session.operate']);
    mocks.getControlClubFoundation.mockResolvedValue({
      id: activeOperator.clubId,
      code: 'tt-badminton',
      name: 'TT Badminton',
      status: 'ACTIVE',
      entitlementVersion: '1'
    });
    const entitlement = {
      clubId: activeOperator.clubId,
      clubStatus: 'ACTIVE',
      version: '1',
      enabledFeatures: ['dashboard', 'schedule', 'session.runtime', 'session.completion', 'finance', 'inventory', 'users', 'settings'],
      limits: {},
      validUntil: null,
      fetchedAt: new Date().toISOString(),
      source: 'CONTROL_PLANE'
    };
    mocks.evaluateClubFeature.mockResolvedValue({ allowed: true, reason: 'ENABLED', entitlement });
    mocks.getEffectiveEntitlement.mockResolvedValue(entitlement);
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    });
    mocks.notFound.mockImplementation(() => {
      throw new Error('NOT_FOUND');
    });
  });

  it('reads an encoded auth cookie without treating it as a bearer token', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'theme=dark; badmin_session=token%2Bvalue; sidebar=open' }
    });

    expect(getBearerlessCookie(request, 'badmin_session')).toBe('token+value');
    expect(getBearerlessCookie(request, 'missing')).toBeNull();
  });

  it('returns 401 for an unauthenticated API request', async () => {
    mocks.getCurrentUserByToken.mockResolvedValue(null);

    await expect(requireApiUser(new Request('http://localhost/api/test'))).rejects.toMatchObject({
      message: 'Vui lòng đăng nhập để tiếp tục.',
      status: 401
    });
  });

  it('enforces API role and permission checks after loading configured permissions', async () => {
    mocks.getCurrentUserByToken.mockResolvedValue(activeOperator);
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'badmin_session=valid-token' }
    });

    await expect(requireApiUser(request, ['OWNER'])).rejects.toMatchObject({ status: 403 });
    await expect(requireApiPermission(request, 'session.operate')).resolves.toMatchObject({
      id: activeOperator.id,
      permissions: ['dashboard.view', 'session.view', 'session.operate']
    });
    await expect(requireApiPermission(request, 'finance.manage')).rejects.toMatchObject({ status: 403 });
  });

  it('converts only AuthError instances to API responses', async () => {
    const response = authErrorResponse(new AuthError('Denied', 403));

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: 'Denied' });
    expect(authErrorResponse(new Error('Unexpected'))).toBeNull();
  });

  it('enforces entitlement after permission and returns a stable API error code', async () => {
    mocks.getCurrentUserByToken.mockResolvedValue(activeOperator);
    mocks.evaluateClubFeature.mockResolvedValueOnce({
      allowed: false,
      reason: 'FEATURE_DISABLED',
      entitlement: await mocks.getEffectiveEntitlement()
    });
    const request = new Request('http://localhost/api/test', {
      headers: { cookie: 'badmin_session=valid-token' }
    });

    const error = await requireApiPermission(request, 'session.operate').catch((caught) => caught);
    expect(error).toMatchObject({ status: 403, code: 'FEATURE_NOT_ENTITLED' });
    const response = authErrorResponse(error);
    await expect(response?.json()).resolves.toEqual({
      error: 'Tính năng này hiện không được kích hoạt cho CLB.',
      code: 'FEATURE_NOT_ENTITLED'
    });
  });

  it('redirects an unauthenticated page request to login with its return path', async () => {
    mocks.getCurrentUserFromCookies.mockResolvedValue(null);

    await expect(requirePageUser('/sessions/session 1')).rejects.toThrow(
      'REDIRECT:/login?next=%2Fsessions%2Fsession%201'
    );
  });

  it('redirects a page without its required permission and allows an authorized page', async () => {
    mocks.getCurrentUserFromCookies.mockResolvedValue(activeOperator);

    await expect(requirePageUser('/settings')).rejects.toThrow('REDIRECT:/dashboard');
    await expect(requirePageUser('/sessions/session-1')).resolves.toMatchObject({
      id: activeOperator.id,
      permissions: ['dashboard.view', 'session.view', 'session.operate']
    });
  });

  it('binds a tenant page to the authenticated club instead of trusting the URL', async () => {
    mocks.getCurrentUserFromCookies.mockResolvedValue(activeOperator);

    await expect(requireTenantPageUser('tt-badminton', '/sessions/session-1')).resolves.toMatchObject({
      clubId: activeOperator.clubId
    });
    await expect(requireTenantPageUser('foreign-club', '/sessions/session-1')).rejects.toThrow('NOT_FOUND');
  });

  it('normalizes tenant-prefixed permissions and keeps denial inside the tenant URL', async () => {
    mocks.getCurrentUserFromCookies.mockResolvedValue(activeOperator);

    await expect(requireTenantPageUser('tt-badminton', '/settings')).rejects.toThrow(
      'REDIRECT:/tt-badminton/dashboard'
    );
  });

  it('redirects legacy URLs to the club code resolved from the authenticated session', async () => {
    mocks.getCurrentUserFromCookies.mockResolvedValue(activeOperator);

    await expect(redirectLegacyPage('/schedule/date-1')).rejects.toThrow(
      'REDIRECT:/tt-badminton/schedule/date-1'
    );
  });
});
