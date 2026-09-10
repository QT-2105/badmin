import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiPermission: vi.fn(),
  authErrorResponse: vi.fn(),
  listOptions: vi.fn(),
  listProducts: vi.fn(),
  createProduct: vi.fn()
}));

vi.mock('@/lib/auth/guards', () => ({
  requireApiPermission: mocks.requireApiPermission,
  authErrorResponse: mocks.authErrorResponse
}));

vi.mock('@/repositories/inventory-repository', () => ({
  listShuttlecockProductOptions: mocks.listOptions,
  listShuttlecockProducts: mocks.listProducts,
  createShuttlecockProduct: mocks.createProduct
}));

import { GET } from './route';

describe('/api/inventory/products entitlement dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiPermission.mockResolvedValue({ clubId: 'club-1' });
    mocks.listOptions.mockResolvedValue([]);
    mocks.listProducts.mockResolvedValue([]);
  });

  it('binds completion product options to the referenced active session policy', async () => {
    const request = new Request('http://localhost/api/inventory/products?view=options&sessionId=session-1');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'session.view', {
      feature: 'session.completion',
      activeSessionId: 'session-1',
      allowActiveSessionContinuation: true
    });
    expect(mocks.listOptions).toHaveBeenCalledOnce();
  });

  it('keeps the full inventory list behind the inventory feature', async () => {
    const request = new Request('http://localhost/api/inventory/products');
    await GET(request);

    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'inventory.view');
    expect(mocks.listProducts).toHaveBeenCalledOnce();
  });
});
