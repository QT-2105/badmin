import type { RuntimeSnapshot, RuntimeSnapshotResponse, RuntimeSyncPayload, RuntimeSyncResponse } from '@/types/runtime';

const runtimeSyncQueues = new Map<string, Promise<unknown>>();

export class RuntimeSyncConflictError extends Error {
  currentVersion: number | null;

  constructor(message: string, currentVersion: number | null) {
    super(message);
    this.name = 'RuntimeSyncConflictError';
    this.currentVersion = currentVersion;
  }
}

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

  const snapshot = (await res.json()) as RuntimeSnapshotResponse;
  return snapshot;
}

async function sendRuntimeSnapshot(payload: RuntimeSyncPayload, signal?: AbortSignal): Promise<RuntimeSyncResponse> {
  const res = await fetch('/api/runtime/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });

  if (!res.ok) {
    const errorPayload = (await res.json().catch(() => null)) as { error?: string; currentVersion?: number } | null;
    if (res.status === 409) {
      throw new RuntimeSyncConflictError(errorPayload?.error ?? 'Runtime đã thay đổi trên thiết bị khác.', errorPayload?.currentVersion ?? null);
    }
    throw new Error(errorPayload?.error ?? 'Failed to sync runtime snapshot');
  }

  const response = (await res.json()) as RuntimeSyncResponse;
  return response;
}

export function syncRuntimeSnapshot(payload: RuntimeSyncPayload, signal?: AbortSignal): Promise<RuntimeSyncResponse> {
  const previous = runtimeSyncQueues.get(payload.sessionId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => sendRuntimeSnapshot(payload, signal));
  runtimeSyncQueues.set(payload.sessionId, next);
  void next.finally(() => {
    if (runtimeSyncQueues.get(payload.sessionId) === next) runtimeSyncQueues.delete(payload.sessionId);
  }).catch(() => undefined);
  return next;
}
