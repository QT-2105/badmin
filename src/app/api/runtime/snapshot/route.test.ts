import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiPermission: vi.fn(),
  authErrorResponse: vi.fn(),
  getRuntimeSnapshot: vi.fn(),
  syncRuntimeSnapshot: vi.fn()
}));

vi.mock('@/lib/auth/guards', () => ({
  requireApiPermission: mocks.requireApiPermission,
  authErrorResponse: mocks.authErrorResponse
}));
vi.mock('@/repositories/runtime-snapshot-repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/repositories/runtime-snapshot-repository')>();
  return {
    ...actual,
    getRuntimeSnapshot: mocks.getRuntimeSnapshot,
    syncRuntimeSnapshot: mocks.syncRuntimeSnapshot
  };
});

import { GET, POST } from './route';
import { RuntimeVersionConflictError } from '@/repositories/runtime-snapshot-repository';

describe('/api/runtime/snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiPermission.mockResolvedValue({ id: 'user-1' });
    mocks.authErrorResponse.mockReturnValue(null);
  });

  it('returns not found when an explicit session is outside the current tenant', async () => {
    mocks.getRuntimeSnapshot.mockResolvedValue({
      session: null, players: [], courts: [], matches: [], recentQuartets: [], version: 0
    });
    const request = new Request('http://localhost/api/runtime/snapshot?sessionId=session-1');

    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'session.view', {
      feature: 'session.runtime',
      activeSessionId: 'session-1',
      allowActiveSessionContinuation: true
    });
    expect(mocks.getRuntimeSnapshot).toHaveBeenCalledWith('session-1');
    await expect(response.json()).resolves.toMatchObject({ error: 'Không tìm thấy ca điều phối.' });
  });

  it('requires operate permission and returns the claimed revision after sync', async () => {
    const payload = {
      sessionId: 'session-1', expectedVersion: 3, players: [], courts: [], nextMatches: []
    };
    mocks.syncRuntimeSnapshot.mockResolvedValue(4);
    const request = new Request('http://localhost/api/runtime/snapshot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.requireApiPermission).toHaveBeenCalledWith(request, 'session.operate', {
      feature: 'session.runtime',
      activeSessionId: 'session-1',
      allowActiveSessionContinuation: true
    });
    expect(mocks.syncRuntimeSnapshot).toHaveBeenCalledWith(payload);
    await expect(response.json()).resolves.toEqual({ ok: true, version: 4 });
  });

  it('returns the current server revision in a version-conflict response', async () => {
    mocks.syncRuntimeSnapshot.mockRejectedValue(new RuntimeVersionConflictError(11));
    const request = new Request('http://localhost/api/runtime/snapshot', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-1', players: [], courts: [], nextMatches: [] })
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Điều phối đã thay đổi trên thiết bị khác. Vui lòng đồng bộ lại trước khi lưu.',
      currentVersion: 11
    });
  });
});
