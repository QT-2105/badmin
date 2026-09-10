import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiPermission: vi.fn(),
  authErrorResponse: vi.fn(),
  deleteAllPlayerImages: vi.fn()
}));

vi.mock('@/lib/auth/guards', () => ({
  requireApiPermission: mocks.requireApiPermission,
  authErrorResponse: mocks.authErrorResponse
}));
vi.mock('@/repositories/player-images-repository', () => ({
  deleteAllPlayerImages: mocks.deleteAllPlayerImages
}));

import { DELETE } from './route';

describe('DELETE /api/settings/player-images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiPermission.mockResolvedValue({ id: 'user-1' });
    mocks.authErrorResponse.mockReturnValue(null);
  });

  it('requires settings permission before deleting and returns the image count', async () => {
    mocks.deleteAllPlayerImages.mockResolvedValue({ deletedImages: 3 });
    const request = new Request('http://localhost/api/settings/player-images', { method: 'DELETE' });

    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'settings.manage');
    expect(mocks.requireApiPermission.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteAllPlayerImages.mock.invocationCallOrder[0]
    );
    await expect(response.json()).resolves.toEqual({ deletedImages: 3 });
  });
});
