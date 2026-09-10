import { describe, expect, it } from 'vitest';

import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
  getRoutePermission,
  hasAnyRole,
  hasPermission,
  normalizePermissionKeys,
  normalizePermissionPathname,
  normalizeUserRole,
  normalizeUserStatus,
  type AuthUser
} from './permissions';

const activeOperator: AuthUser = {
  id: 'user-1',
  clubId: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
  username: 'operator',
  email: 'operator@example.com',
  phone: null,
  displayName: 'Operator',
  role: 'OPERATOR',
  status: 'ACTIVE',
  permissions: ['dashboard.view', 'session.operate']
};

describe('auth permissions', () => {
  it('normalizes persisted role and status values without broadening invalid values', () => {
    expect(normalizeUserRole(' manager ')).toBe('MANAGER');
    expect(normalizeUserRole('unexpected')).toBe('OPERATOR');
    expect(normalizeUserStatus(' disabled ')).toBe('DISABLED');
    expect(normalizeUserStatus('unexpected')).toBe('ACTIVE');
  });

  it('keeps only known permission keys and removes duplicates', () => {
    expect(normalizePermissionKeys([
      'session.view',
      'unknown.permission',
      'session.view',
      'finance.manage'
    ])).toEqual(['session.view', 'finance.manage']);
    expect(normalizePermissionKeys('session.view')).toEqual([]);
  });

  it('grants owners every current permission and evaluates explicit role permissions', () => {
    const owner: AuthUser = { ...activeOperator, role: 'OWNER', permissions: [] };

    expect(DEFAULT_ROLE_PERMISSIONS.OWNER).toEqual(ALL_PERMISSION_KEYS);
    expect(hasPermission(owner, 'users.manage')).toBe(true);
    expect(hasPermission(activeOperator, 'session.operate')).toBe(true);
    expect(hasPermission(activeOperator, 'finance.manage')).toBe(false);
  });

  it('denies permissions and roles for missing or disabled users', () => {
    const disabledUser: AuthUser = { ...activeOperator, status: 'DISABLED' };

    expect(hasPermission(null, 'dashboard.view')).toBe(false);
    expect(hasPermission(disabledUser, 'dashboard.view')).toBe(false);
    expect(hasAnyRole(disabledUser, ['OPERATOR'])).toBe(false);
    expect(hasAnyRole(activeOperator, ['OWNER', 'OPERATOR'])).toBe(true);
  });

  it('maps protected page prefixes and defaults unknown routes to dashboard access', () => {
    expect(getRoutePermission('/users')).toBe('users.manage');
    expect(getRoutePermission('/sessions/session-1/runtime')).toBe('session.view');
    expect(getRoutePermission('/settings/branding')).toBe('settings.manage');
    expect(getRoutePermission('/unknown')).toBe('dashboard.view');
    expect(normalizePermissionPathname('/tt-badminton/sessions/session-1/runtime?mode=full')).toBe('/sessions/session-1/runtime');
    expect(getRoutePermission('/tt-badminton/users')).toBe('users.manage');
    expect(getRoutePermission('/tt-badminton/finance')).toBe('finance.view');
  });
});
