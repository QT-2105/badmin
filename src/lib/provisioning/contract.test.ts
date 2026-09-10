import { describe, expect, it } from 'vitest';

import {
  buildRegistrationEmail,
  createClubCodeCandidates,
  hashActivationToken,
  provisioningFingerprint,
  validateProvisioningContract,
  type TenantProvisioningContract
} from './contract';

const baseContract: TenantProvisioningContract = {
  idempotencyKey: '11111111-1111-4111-8111-111111111111',
  clubId: '22222222-2222-4222-8222-222222222222',
  clubCode: 'Câu lạc bộ Ánh Dương',
  clubName: '  Câu lạc bộ   Ánh Dương  ',
  owner: {
    username: ' ChuCLB ',
    usernameNormalized: 'ignored-client-value',
    email: 'OWNER@EXAMPLE.COM',
    emailNormalized: 'ignored-client-value',
    phone: null,
    phoneNormalized: null,
    displayName: '  Chủ   CLB '
  },
  features: { dashboard: true, schedule: true },
  limits: { maxUsers: 10 },
  activationTokenHash: 'a'.repeat(64),
  activationExpiresAt: '2099-01-01T00:00:00.000Z'
};

describe('Phase 13 provisioning contract', () => {
  it('creates canonical code choices and keeps a deterministic collision suffix', () => {
    expect(createClubCodeCandidates('Câu lạc bộ Ánh Dương', 'Quận 7', 4721)).toEqual([
      'cau-lac-bo-anh-duong',
      'cau-lac-bo-anh-duong-quan-7',
      'cau-lac-bo-anh-duong-4721'
    ]);
  });

  it('normalizes owner identifiers itself instead of trusting supplied normalized values', () => {
    const value = validateProvisioningContract(baseContract);
    expect(value.clubCode).toBe('cau-lac-bo-anh-duong');
    expect(value.clubName).toBe('Câu lạc bộ Ánh Dương');
    expect(value.owner).toEqual({
      username: 'ChuCLB',
      usernameNormalized: 'chuclb',
      email: 'owner@example.com',
      emailNormalized: 'owner@example.com',
      phone: null,
      phoneNormalized: null,
      displayName: 'Chủ CLB'
    });
  });

  it('rejects unknown features and invalid limits instead of silently changing a package', () => {
    expect(() => validateProvisioningContract({
      ...baseContract,
      features: { ...baseContract.features, unknown: true } as TenantProvisioningContract['features']
    })).toThrow('Feature provisioning không hợp lệ');
    expect(() => validateProvisioningContract({ ...baseContract, limits: { maxUsers: -1 } }))
      .toThrow('Limit provisioning không hợp lệ');
  });

  it('has a stable request fingerprint and never uses a raw activation token as its hash', () => {
    expect(provisioningFingerprint(baseContract)).toBe(provisioningFingerprint({ ...baseContract }));
    expect(hashActivationToken('raw-activation-token')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashActivationToken('raw-activation-token')).not.toContain('raw-activation-token');
  });

  it('emphasizes the club code and places the activation secret in the URL fragment', () => {
    const email = buildRegistrationEmail({
      clubName: 'Ánh Dương',
      clubCode: 'anh-duong',
      activationBaseUrl: 'https://uat.example.test/activate-owner',
      activationToken: 'raw-token-value'
    });
    expect(email.text).toContain('*** MÃ CLB ĐĂNG NHẬP: anh-duong ***');
    expect(email.text).toContain('?club=anh-duong#token=raw-token-value');
    expect(email.html).toContain('<strong>MÃ CLB ĐĂNG NHẬP: anh-duong</strong>');
    expect(email.text.toLowerCase()).not.toContain('mật khẩu:');
  });
});
