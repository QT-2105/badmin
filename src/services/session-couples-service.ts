import type { SessionCoupleMatchMode, SessionCoupleSummary } from '@/types/domain';

export type SessionCouplePayload = {
  memberIds: string[];
  matchMode: SessionCoupleMatchMode;
  active?: boolean;
  nextMatchRequestedAt?: string | null;
};

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || fallback);
  }
  return (await response.json()) as T;
}

export async function fetchSessionCouples(sessionId: string, signal?: AbortSignal): Promise<SessionCoupleSummary[]> {
  const response = await fetch(`/api/sessions/${sessionId}/couples`, { cache: 'no-store', signal });
  const payload = await readJson<{ couples: SessionCoupleSummary[] }>(response, 'Không thể tải danh sách Couple');
  return payload.couples;
}

export async function createSessionCouple(sessionId: string, payload: SessionCouplePayload): Promise<SessionCoupleSummary> {
  const response = await fetch(`/api/sessions/${sessionId}/couples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ couple: SessionCoupleSummary }>(response, 'Không thể tạo Couple');
  return data.couple;
}

export async function updateSessionCouple(coupleId: string, payload: Partial<SessionCouplePayload>): Promise<SessionCoupleSummary> {
  const response = await fetch(`/api/session-couples/${coupleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ couple: SessionCoupleSummary }>(response, 'Không thể cập nhật Couple');
  return data.couple;
}

export async function deleteSessionCouple(coupleId: string): Promise<void> {
  const response = await fetch(`/api/session-couples/${coupleId}`, { method: 'DELETE' });
  await readJson<{ ok: true }>(response, 'Không thể gỡ Couple');
}
