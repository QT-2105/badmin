import { prisma } from '@/lib/prisma';
import { deleteS3Object, uploadS3Object, createImageKey } from '@/lib/s3-storage';
import { AppError } from '@/lib/app-error';
import type { BrandingSettings } from '@/types/domain';

const DEFAULT_ID = 'default';

function mapBranding(row: { club_name: string; logo_url: string | null; logo_s3_key: string | null } | null): BrandingSettings {
  return {
    clubName: row?.club_name || 'Badmin',
    logoUrl: row?.logo_url ?? null,
    logoS3Key: row?.logo_s3_key ?? null
  };
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const row = await prisma.app_settings.findUnique({ where: { id: DEFAULT_ID } });
  return mapBranding(row);
}

export async function updateBrandingName(clubName: string): Promise<BrandingSettings> {
  const normalized = clubName.trim();
  if (!normalized) throw new AppError('Vui lòng nhập tên CLB.');

  const row = await prisma.app_settings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, club_name: normalized },
    update: { club_name: normalized, updated_at: new Date() }
  });

  return mapBranding(row);
}

export async function updateBrandingLogo(input: { buffer: Buffer; contentType: string; fileName: string }): Promise<BrandingSettings> {
  const current = await prisma.app_settings.findUnique({ where: { id: DEFAULT_ID } });
  const key = createImageKey('config/logo', input.fileName);
  const uploaded = await uploadS3Object({
    key,
    body: input.buffer,
    contentType: input.contentType
  });

  const row = await prisma.app_settings.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      club_name: current?.club_name || 'Badmin',
      logo_s3_key: uploaded.key,
      logo_url: uploaded.publicUrl
    },
    update: {
      logo_s3_key: uploaded.key,
      logo_url: uploaded.publicUrl,
      updated_at: new Date()
    }
  });

  if (current?.logo_s3_key && current.logo_s3_key !== uploaded.key) {
    await deleteS3Object(current.logo_s3_key).catch(() => undefined);
  }

  return mapBranding(row);
}

export async function deleteBrandingLogo(): Promise<BrandingSettings> {
  const current = await prisma.app_settings.findUnique({ where: { id: DEFAULT_ID } });
  if (current?.logo_s3_key) {
    await deleteS3Object(current.logo_s3_key);
  }

  const row = await prisma.app_settings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, club_name: 'Badmin' },
    update: { logo_s3_key: null, logo_url: null, updated_at: new Date() }
  });

  return mapBranding(row);
}
