import type { PlayDateSummary, PlaySessionSummary } from '@/types/domain';

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }

  return (await res.json()) as T;
}

export async function fetchPlayDates(signal?: AbortSignal): Promise<PlayDateSummary[]> {
  const res = await fetch('/api/play-dates', { signal, cache: 'no-store' });
  const data = await readJson<{ playDates: PlayDateSummary[] }>(res, 'Failed to load play dates');
  return data.playDates;
}

export async function fetchPlayDate(id: string, signal?: AbortSignal): Promise<PlayDateSummary> {
  const res = await fetch(`/api/play-dates/${id}`, { signal, cache: 'no-store' });
  const data = await readJson<{ playDate: PlayDateSummary }>(res, 'Failed to load play date');
  return data.playDate;
}

export async function fetchPlaySession(sessionId: string, signal?: AbortSignal): Promise<PlaySessionSummary> {
  const res = await fetch(`/api/sessions/${sessionId}`, { signal, cache: 'no-store' });
  const data = await readJson<{ session: PlaySessionSummary }>(res, 'Failed to load session');
  return data.session;
}

export async function createPlayDate(payload: { playDate: string; title?: string; note?: string }): Promise<PlayDateSummary> {
  const res = await fetch('/api/play-dates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ playDate: PlayDateSummary }>(res, 'Failed to create play date');
  return data.playDate;
}

export async function updatePlayDate(id: string, payload: { playDate?: string; title?: string; note?: string }): Promise<PlayDateSummary> {
  const res = await fetch(`/api/play-dates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ playDate: PlayDateSummary }>(res, 'Failed to update play date');
  return data.playDate;
}

export async function deletePlayDate(id: string): Promise<void> {
  const res = await fetch(`/api/play-dates/${id}`, { method: 'DELETE' });
  await readJson<{ ok: true }>(res, 'Failed to delete play date');
}

export async function createPlaySession(playDateId: string, payload: {
  name: string;
  startTime: string;
  endTime: string;
  courtCount: number;
  note?: string;
  status?: string;
}): Promise<PlaySessionSummary> {
  const res = await fetch(`/api/play-dates/${playDateId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ session: PlaySessionSummary }>(res, 'Failed to create session');
  return data.session;
}

export async function updatePlaySession(sessionId: string, payload: Partial<Pick<PlaySessionSummary, 'name' | 'startTime' | 'endTime' | 'courtCount' | 'note' | 'status' | 'courtCost' | 'shuttlecockPiecesUsed' | 'shuttlecockProductId' | 'shuttlecockProductName' | 'extraExpenseTitle' | 'extraExpenseAmount' | 'totalIncome' | 'totalExpense' | 'totalProfit'>>): Promise<PlaySessionSummary> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ session: PlaySessionSummary }>(res, 'Failed to update session');
  return data.session;
}

export async function completePlaySession(sessionId: string, payload: {
  courtCost: number;
  shuttlecockProductId: string;
  shuttlecockPiecesUsed: number;
  extraExpenseTitle?: string | null;
  extraExpenseAmount?: number;
  note?: string | null;
  autoCreateCourtFeeTransaction?: boolean;
  autoCreateShuttlecockUsageTransaction?: boolean;
  autoCreateExtraExpenseTransaction?: boolean;
}): Promise<PlaySessionSummary> {
  const res = await fetch(`/api/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ session: PlaySessionSummary }>(res, 'Failed to complete session');
  return data.session;
}

export async function deletePlaySession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  await readJson<{ ok: true }>(res, 'Failed to delete session');
}
