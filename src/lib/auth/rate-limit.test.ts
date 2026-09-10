import { describe, expect, it } from 'vitest';

import { getLoginRateLimitKey } from './rate-limit';

function request(ip = '127.0.0.1') {
  return new Request('http://localhost/login', { headers: { 'x-forwarded-for': ip } });
}

describe('tenant login rate-limit key', () => {
  it('canonicalizes equivalent phone forms and never exposes the raw identifier', () => {
    const clubId = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f';
    const local = getLoginRateLimitKey(request(), clubId, '0912 345 678');
    const international = getLoginRateLimitKey(request(), clubId, '+84 912 345 678');
    expect(local).toBe(international);
    expect(local).not.toContain('0912');
    expect(local).not.toContain(clubId);
  });

  it('separates the same identifier by club and IP', () => {
    const base = getLoginRateLimitKey(request(), 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f', 'owner');
    expect(getLoginRateLimitKey(request(), 'bb1f1aa3-c438-4498-96e9-ab228cd51f4f', 'owner')).not.toBe(base);
    expect(getLoginRateLimitKey(request('127.0.0.2'), 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f', 'owner')).not.toBe(base);
  });
});
