import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: { app_role_permissions: mocks }
}));

import { updateRolePermissions } from './role-permissions-repository';

describe('role permission compatibility writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ role: 'MANAGER', permissions: ['dashboard.view'] });
  });

  it('creates a tenant-owned permission row when this tenant has no role row', async () => {
    await updateRolePermissions('MANAGER', ['dashboard.view']);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { role: 'MANAGER', club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' }
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f',
        role: 'MANAGER'
      })
    });
  });
});
