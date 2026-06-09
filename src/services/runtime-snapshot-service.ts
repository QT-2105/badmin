import type { RuntimeSnapshot, RuntimeSnapshotResponse, RuntimeSyncPayload } from '@/types/runtime';

export async function fetchRuntimeSnapshot(sessionId?: string, signal?: AbortSignal): Promise<RuntimeSnapshot> {
  const params = new URLSearchParams();
  if (sessionId) params.set('sessionId', sessionId);
  const query = params.toString();
  const res = await fetch(`/api/runtime/snapshot${query ? `?${query}` : ''}`, {
    signal,
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Failed to load runtime snapshot');
  }

  return (await res.json()) as RuntimeSnapshotResponse;
}

export async function syncRuntimeSnapshot(payload: RuntimeSyncPayload, signal?: AbortSignal): Promise<void> {
  const res = await fetch('/api/runtime/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });

  if (!res.ok) {
    throw new Error('Failed to sync runtime snapshot');
  }
}
