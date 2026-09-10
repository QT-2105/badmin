import { afterEach, describe, expect, it, vi } from 'vitest';

import { requireTenantContext, runWithTenantContext } from './tenant-context';

const originalClubId = process.env.BADMIN_LEGACY_CLUB_ID;
const originalFallback = process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK;
const clubA = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';
const clubB = 'bb2f2bb4-d549-4598-a7f0-bc339de62f50';

afterEach(() => {
  if (originalClubId === undefined) delete process.env.BADMIN_LEGACY_CLUB_ID;
  else process.env.BADMIN_LEGACY_CLUB_ID = originalClubId;
  if (originalFallback === undefined) delete process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK;
  else process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK = originalFallback;
  vi.restoreAllMocks();
});

describe('request-owned TenantContext', () => {
  it('returns the immutable authenticated request context', async () => {
    await runWithTenantContext({ clubId: clubA }, 'test.request', async () => {
      await Promise.resolve();
      const context = requireTenantContext('test.read');
      expect(context).toEqual({ clubId: clubA });
      expect(Object.isFrozen(context)).toBe(true);
    });
  });

  it('keeps concurrent tenant requests isolated', async () => {
    const [first, second] = await Promise.all([
      runWithTenantContext({ clubId: clubA }, 'test.a', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return requireTenantContext('test.a.read').clubId;
      }),
      runWithTenantContext({ clubId: clubB }, 'test.b', async () => {
        await Promise.resolve();
        return requireTenantContext('test.b.read').clubId;
      })
    ]);
    expect([first, second]).toEqual([clubA, clubB]);
  });

  it('fails closed without an authenticated context in normal runtime', () => {
    process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK = 'false';
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => requireTenantContext('test.write')).toThrow('TenantContext chưa được xác lập từ phiên đăng nhập.');
    expect(error).toHaveBeenCalledWith(JSON.stringify({ event: 'tenant_context_missing', operation: 'test.write', reason: 'missing' }));
  });

  it('allows the Legacy environment context only under the explicit compatibility flag', () => {
    process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK = 'true';
    process.env.BADMIN_LEGACY_CLUB_ID = clubA;
    expect(requireTenantContext('test.compatibility')).toEqual({ clubId: clubA });
  });
});
