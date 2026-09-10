import { prisma } from '@/lib/prisma';
import { createTenantImageKey, deleteS3Object, uploadS3Object } from '@/lib/s3-storage';
import { AppError } from '@/lib/app-error';
import { requireTenantContext } from '@/lib/tenant-context';
import type { BrandingSettings } from '@/types/domain';

function mapBranding(row: { club_name: string; logo_url: string | null; logo_s3_key: string | null } | null): BrandingSettings {
  return {
    clubName: row?.club_name || 'Badmin',
    logoUrl: row?.logo_url ?? null,
    logoS3Key: row?.logo_s3_key ?? null
  };
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const { clubId } = requireTenantContext('branding.get');
  const row = await prisma.app_settings.findFirst({ where: { club_id: clubId } });
  return mapBranding(row);
}

export async function updateBrandingName(clubName: string): Promise<BrandingSettings> {
  const { clubId } = requireTenantContext('branding.name.upsert');
  const normalized = clubName.trim();
  if (!normalized) throw new AppError('Vui lòng nhập tên CLB.');

  const current = await prisma.app_settings.findFirst({ where: { club_id: clubId } });
  const row = current
    ? await prisma.app_settings.update({
      where: { club_id: clubId },
      data: { club_name: normalized, updated_at: new Date() }
    })
    : await prisma.app_settings.create({
      data: { id: clubId, club_id: clubId, club_name: normalized }
    });

  return mapBranding(row);
}

export async function updateBrandingLogo(input: { buffer: Buffer; contentType: string; fileName: string }): Promise<BrandingSettings> {
  const { clubId } = requireTenantContext('branding.logo.upsert');
  const current = await prisma.app_settings.findFirst({ where: { club_id: clubId } });
  const key = createTenantImageKey(clubId, 'config/logo', input.fileName);
  const uploaded = await uploadS3Object({
    key,
    body: input.buffer,
    contentType: input.contentType
  });

  const row = current
    ? await prisma.app_settings.update({
      where: { club_id: clubId },
      data: {
        logo_s3_key: uploaded.key,
        logo_url: uploaded.publicUrl,
        updated_at: new Date()
      }
    })
    : await prisma.app_settings.create({
      data: {
        id: clubId,
        club_id: clubId,
        club_name: 'Badmin',
        logo_s3_key: uploaded.key,
        logo_url: uploaded.publicUrl
      }
    });

  if (current?.logo_s3_key && current.logo_s3_key !== uploaded.key) {
    await deleteS3Object(current.logo_s3_key).catch(() => undefined);
  }

  return mapBranding(row);
}

export async function deleteBrandingLogo(): Promise<BrandingSettings> {
  const { clubId } = requireTenantContext('branding.logo.delete');
  const current = await prisma.app_settings.findFirst({ where: { club_id: clubId } });
  if (current?.logo_s3_key) {
    await deleteS3Object(current.logo_s3_key);
  }

  const row = current
    ? await prisma.app_settings.update({
      where: { club_id: clubId },
      data: { logo_s3_key: null, logo_url: null, updated_at: new Date() }
    })
    : await prisma.app_settings.create({
      data: { id: clubId, club_id: clubId, club_name: 'Badmin' }
    });

  return mapBranding(row);
}
