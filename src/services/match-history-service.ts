import type { MatchHistorySummary } from '@/types/domain';

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }

  return (await res.json()) as T;
}

export type MatchHistoryPayload = {
  courtNumber: number;
  courtName: string;
  startedAt: string | null;
  endedAt: string;
  durationSeconds: number | null;
  teamA: Array<{ playerId: string; playerName: string }>;
  teamB: Array<{ playerId: string; playerName: string }>;
};

export async function fetchMatchHistory(sessionId: string, playerId?: string | null, signal?: AbortSignal): Promise<MatchHistorySummary[]> {
  const params = new URLSearchParams();
  if (playerId) params.set('playerId', playerId);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/sessions/${sessionId}/match-history${suffix}`, { signal, cache: 'no-store' });
  const data = await readJson<{ history: MatchHistorySummary[] }>(res, 'Failed to load match history');
  return data.history;
}

export async function createMatchHistory(sessionId: string, payload: MatchHistoryPayload): Promise<MatchHistorySummary> {
  const res = await fetch(`/api/sessions/${sessionId}/match-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ history: MatchHistorySummary }>(res, 'Failed to create match history');
  return data.history;
}
