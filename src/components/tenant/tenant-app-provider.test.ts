import { describe, expect, it } from 'vitest';

import { buildTenantHref, tenantQueryKey } from './tenant-app-provider';

describe('tenant route and cache identity', () => {
  it('builds tenant-prefixed application paths', () => {
    expect(buildTenantHref('tt-badminton', '/dashboard')).toBe('/tt-badminton/dashboard');
    expect(buildTenantHref('tt-badminton', `sessions/session-1`)).toBe('/tt-badminton/sessions/session-1');
  });

  it('places the immutable club id before every operational cache segment', () => {
    expect(tenantQueryKey('club-a', 'runtime', 'snapshot', 'session-1')).toEqual([
      'tenant',
      'club-a',
      'runtime',
      'snapshot',
      'session-1'
    ]);
    expect(tenantQueryKey('club-a', 'dashboard')).not.toEqual(tenantQueryKey('club-b', 'dashboard'));
  });
});
