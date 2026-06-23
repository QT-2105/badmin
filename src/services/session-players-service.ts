import type { SessionPlayerSummary } from '@/types/domain';

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }

  return (await res.json()) as T;
}

export type SessionPlayerPayload = {
  fullName: string;
  gender?: string | null;
  level?: number;
  paymentAmount?: number;
  discount?: number;
  paymentMethod?: string | null;
  paymentStatus?: string;
  note?: string | null;
};

export async function fetchSessionPlayers(sessionId: string, signal?: AbortSignal): Promise<SessionPlayerSummary[]> {
  const res = await fetch(`/api/sessions/${sessionId}/players`, { signal, cache: 'no-store' });
  const data = await readJson<{ players: SessionPlayerSummary[] }>(res, 'Failed to load session players');
  return data.players;
}

export async function createSessionPlayer(sessionId: string, payload: SessionPlayerPayload): Promise<SessionPlayerSummary> {
  const res = await fetch(`/api/sessions/${sessionId}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ player: SessionPlayerSummary }>(res, 'Failed to create session player');
  return data.player;
}

export async function updateSessionPlayer(playerId: string, payload: Partial<SessionPlayerPayload>): Promise<SessionPlayerSummary> {
  const res = await fetch(`/api/session-players/${playerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ player: SessionPlayerSummary }>(res, 'Failed to update session player');
  return data.player;
}

export async function deleteSessionPlayer(playerId: string): Promise<void> {
  const res = await fetch(`/api/session-players/${playerId}`, { method: 'DELETE' });
  await readJson<{ ok: true }>(res, 'Failed to delete session player');
}

export async function uploadSessionPlayerAvatar(playerId: string, file: File): Promise<{ avatarUrl: string | null; avatarS3Key: string | null }> {
  const formData = new FormData();
  formData.set('file', file);
  const res = await fetch(`/api/session-players/${playerId}/avatar`, {
    method: 'POST',
    body: formData
  });
  const data = await readJson<{ avatar: { avatarUrl: string | null; avatarS3Key: string | null } }>(res, 'Failed to upload player avatar');
  return data.avatar;
}

export async function deleteSessionPlayerAvatar(playerId: string): Promise<{ avatarUrl: null; avatarS3Key: null }> {
  const res = await fetch(`/api/session-players/${playerId}/avatar`, { method: 'DELETE' });
  const data = await readJson<{ avatar: { avatarUrl: null; avatarS3Key: null } }>(res, 'Failed to delete player avatar');
  return data.avatar;
}
