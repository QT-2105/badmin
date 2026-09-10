import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  executeRawUnsafe: vi.fn(),
  queryRawUnsafe: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));

import { activateProvisionedOwner } from './owner-activation-repository';

describe('owner activation repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      $executeRawUnsafe: mocks.executeRawUnsafe,
      $queryRawUnsafe: mocks.queryRawUnsafe
    }));
    mocks.queryRawUnsafe.mockResolvedValue([{
      club_id: 'club-id', club_code: 'anh-duong', user_id: 'user-id'
    }]);
  });

  it('uses only the constrained control function through the runtime role', async () => {
    await expect(activateProvisionedOwner({
      clubCode: 'anh-duong',
      activationTokenHash: 'a'.repeat(64),
      passwordHash: 'scrypt:salt:hash'
    })).resolves.toEqual({ clubId: 'club-id', clubCode: 'anh-duong', userId: 'user-id' });

    expect(mocks.executeRawUnsafe).toHaveBeenCalledWith('SET LOCAL ROLE badmin_uat_app');
    expect(mocks.queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('control.activate_club_owner($1, $2, $3)'),
      'anh-duong', 'a'.repeat(64), 'scrypt:salt:hash'
    );
  });
});
