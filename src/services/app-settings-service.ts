import type { AppSettings } from '@/lib/app-settings';

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || fallback);
  }
  return (await response.json()) as T;
}

export async function fetchAppSettings(signal?: AbortSignal): Promise<AppSettings> {
  const response = await fetch('/api/settings/app', { cache: 'no-store', signal });
  const payload = await readJson<{ settings: AppSettings }>(response, 'Không thể tải cài đặt vận hành');
  return payload.settings;
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const response = await fetch('/api/settings/app', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  const payload = await readJson<{ settings: AppSettings }>(response, 'Không thể cập nhật cài đặt vận hành');
  return payload.settings;
}
