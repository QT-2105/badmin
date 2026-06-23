import type { BrandingSettings } from '@/types/domain';

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallback);
  }

  return (await res.json()) as T;
}

export async function fetchBranding(signal?: AbortSignal): Promise<BrandingSettings> {
  const res = await fetch('/api/settings/branding', { signal, cache: 'no-store' });
  const data = await readJson<{ branding: BrandingSettings }>(res, 'Không thể tải thông tin CLB');
  return data.branding;
}

export async function updateBrandingName(clubName: string): Promise<BrandingSettings> {
  const res = await fetch('/api/settings/branding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clubName })
  });
  const data = await readJson<{ branding: BrandingSettings }>(res, 'Không thể cập nhật thông tin CLB');
  return data.branding;
}

export async function uploadBrandingLogo(file: File): Promise<BrandingSettings> {
  const formData = new FormData();
  formData.set('file', file);
  const res = await fetch('/api/settings/branding/logo', {
    method: 'POST',
    body: formData
  });
  const data = await readJson<{ branding: BrandingSettings }>(res, 'Không thể cập nhật logo');
  return data.branding;
}

export async function deleteBrandingLogo(): Promise<BrandingSettings> {
  const res = await fetch('/api/settings/branding/logo', { method: 'DELETE' });
  const data = await readJson<{ branding: BrandingSettings }>(res, 'Không thể xóa logo');
  return data.branding;
}
