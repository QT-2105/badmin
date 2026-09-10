import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RuntimeSnapshot, RuntimeSyncPayload } from '@/types/runtime';

const originalFetch = globalThis.fetch;

function snapshot(version: number): RuntimeSnapshot {
  return {
    session: {
      id: 'session-1', name: 'Ca', startTime: 'start', endTime: 'end', courtCount: 1,
      status: 'LIVE', runtimeVersion: version
    },
    players: [], courts: [], matches: [], recentQuartets: [], version
  };
}

function payload(overrides: Partial<RuntimeSyncPayload> = {}): RuntimeSyncPayload {
  return {
    sessionId: 'session-1', expectedVersion: 0, players: [], courts: [], nextMatches: [], ...overrides
  };
}

describe('runtime snapshot service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches without browser cache and sends the caller-owned mandatory revision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot(5)), { status: 200 }));
    globalThis.fetch = fetchMock;
    const service = await import('./runtime-snapshot-service');

    await expect(service.fetchRuntimeSnapshot('session-1')).resolves.toMatchObject({ version: 5 });
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: 6 }), { status: 200 }));
    await service.syncRuntimeSnapshot(payload({ expectedVersion: 5 }));

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/runtime/snapshot?sessionId=session-1', {
      signal: undefined,
      cache: 'no-store'
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      sessionId: 'session-1', expectedVersion: 5
    });
  });

  it('preserves an explicitly supplied expected revision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, version: 10 }), { status: 200 }));
    globalThis.fetch = fetchMock;
    const service = await import('./runtime-snapshot-service');

    await service.syncRuntimeSnapshot(payload({ expectedVersion: 9 }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ expectedVersion: 9 });
  });

  it('maps a 409 response to a revision conflict with the server version', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'Runtime conflict', currentVersion: 12
    }), { status: 409 }));
    const service = await import('./runtime-snapshot-service');

    const error = await service.syncRuntimeSnapshot(payload({ expectedVersion: 11 })).catch((caught) => caught);

    expect(error).toBeInstanceOf(service.RuntimeSyncConflictError);
    expect(error).toMatchObject({ message: 'Runtime conflict', currentVersion: 12 });
  });

  it('serializes consecutive writes for the same session', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstResponse = new Promise<Response>((resolve) => {
      releaseFirst = () => resolve(new Response(JSON.stringify({ ok: true, version: 1 }), { status: 200 }));
    });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => firstResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: 2 }), { status: 200 }));
    globalThis.fetch = fetchMock;
    const service = await import('./runtime-snapshot-service');

    const first = service.syncRuntimeSnapshot(payload({ expectedVersion: 0 }));
    const second = service.syncRuntimeSnapshot(payload({ expectedVersion: 1 }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    releaseFirst?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { ok: true, version: 1 },
      { ok: true, version: 2 }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
