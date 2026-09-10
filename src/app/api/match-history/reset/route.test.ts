import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiPermission: vi.fn(),
  authErrorResponse: vi.fn(),
  deleteAllMatchHistory: vi.fn()
}));

vi.mock('@/lib/auth/guards', () => ({
  requireApiPermission: mocks.requireApiPermission,
  authErrorResponse: mocks.authErrorResponse
}));
vi.mock('@/repositories/match-history-repository', () => ({
  deleteAllMatchHistory: mocks.deleteAllMatchHistory
}));

import { DELETE } from './route';

describe('DELETE /api/match-history/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiPermission.mockResolvedValue({ id: 'user-1' });
    mocks.authErrorResponse.mockReturnValue(null);
  });

  it('requires settings permission before deleting and returns deletion counts', async () => {
    mocks.deleteAllMatchHistory.mockResolvedValue({ deletedMatches: 2, deletedParticipants: 8 });
    const request = new Request('http://localhost/api/match-history/reset', { method: 'DELETE' });

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'settings.manage');
    expect(mocks.requireApiPermission.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteAllMatchHistory.mock.invocationCallOrder[0]
    );
    await expect(response.json()).resolves.toEqual({
      ok: true,
      deletedMatches: 2,
      deletedParticipants: 8
    });
  });
});
