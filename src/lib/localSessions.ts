export type SessionItem = {
  id: string;
  playDate: string;
  startsAt: string;
  endsAt: string;
  courtCount: number;
  createdAt: string;
};

const KEY = 'badmin_sessions_v1';

export function loadSessions(): SessionItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionItem[];
  } catch {
    return [];
  }
}

export function saveSessions(items: SessionItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
