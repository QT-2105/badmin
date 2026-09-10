import { describe, expect, it } from 'vitest';

import { createTenantImageKey } from './s3-storage';

describe('tenant S3 namespace', () => {
  it('creates new image keys under the canonical club UUID', () => {
    const key = createTenantImageKey(
      'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
      'config/logo',
      'Club Logo.PNG'
    );
    expect(key).toMatch(/^clubs\/aa1f1aa3-c438-4498-96e9-ab228cd51f4f\/config\/logo\/[0-9a-f-]+\.png$/);
  });

  it('rejects an invalid club or traversal folder', () => {
    expect(() => createTenantImageKey('not-a-club', 'config/logo', 'logo.webp')).toThrow('Namespace lưu trữ theo CLB không hợp lệ.');
    expect(() => createTenantImageKey('aa1f1aa3-c438-4498-96e9-ab228cd51f4f', '../foreign', 'logo.webp')).toThrow('Namespace lưu trữ theo CLB không hợp lệ.');
  });
});
