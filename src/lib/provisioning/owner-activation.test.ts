import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  activateProvisionedOwner: vi.fn()
}));

vi.mock('@/lib/auth/password', () => ({
  MIN_PASSWORD_LENGTH: 8,
  hashPassword: mocks.hashPassword
}));
vi.mock('@/repositories/owner-activation-repository', () => ({
  activateProvisionedOwner: mocks.activateProvisionedOwner
}));

import { hashActivationToken } from './contract';
import { activateOwner } from './owner-activation';

describe('OWNER activation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue('scrypt:salt:derivedhash');
    mocks.activateProvisionedOwner.mockResolvedValue({
      clubId: '22222222-2222-4222-8222-222222222222',
      clubCode: 'anh-duong',
      userId: '33333333-3333-4333-8333-333333333333'
    });
  });

  it('passes only token and password hashes to persistence', async () => {
    await activateOwner({ clubCode: 'Ánh Dương', token: 'raw-token', password: 'plain-secret' });

    expect(mocks.hashPassword).toHaveBeenCalledWith('plain-secret');
    expect(mocks.activateProvisionedOwner).toHaveBeenCalledWith({
      clubCode: 'anh-duong',
      activationTokenHash: hashActivationToken('raw-token'),
      passwordHash: 'scrypt:salt:derivedhash'
    });
    expect(JSON.stringify(mocks.activateProvisionedOwner.mock.calls)).not.toContain('plain-secret');
    expect(JSON.stringify(mocks.activateProvisionedOwner.mock.calls)).not.toContain('raw-token');
  });

  it('keeps activation failures generic', async () => {
    mocks.activateProvisionedOwner.mockRejectedValue(new Error('token row not found'));
    await expect(activateOwner({ clubCode: 'anh-duong', token: 'bad-token', password: 'long-enough' }))
      .rejects.toMatchObject({ message: 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.', status: 400 });
  });

  it('rejects a short password before persistence', async () => {
    await expect(activateOwner({ clubCode: 'anh-duong', token: 'token', password: 'short' }))
      .rejects.toMatchObject({ status: 400 });
    expect(mocks.activateProvisionedOwner).not.toHaveBeenCalled();
  });
});
