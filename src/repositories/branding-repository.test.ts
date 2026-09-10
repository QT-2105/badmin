import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  createTenantImageKey: vi.fn(),
  uploadS3Object: vi.fn(),
  deleteS3Object: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { app_settings: { findFirst: mocks.findFirst, update: mocks.update, create: mocks.create } }
}));
vi.mock('@/lib/s3-storage', () => ({
  createTenantImageKey: mocks.createTenantImageKey,
  uploadS3Object: mocks.uploadS3Object,
  deleteS3Object: mocks.deleteS3Object
}));

import {
  deleteBrandingLogo,
  getBrandingSettings,
  updateBrandingLogo,
  updateBrandingName
} from './branding-repository';

describe('branding repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createTenantImageKey.mockReturnValue('config/logo/new.webp');
    mocks.uploadS3Object.mockResolvedValue({
      key: 'config/logo/new.webp', publicUrl: 'https://cdn.example/new.webp'
    });
    mocks.deleteS3Object.mockResolvedValue(undefined);
  });

  it('returns default branding when the singleton row is absent', async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(getBrandingSettings()).resolves.toEqual({
      clubName: 'Badmin', logoUrl: null, logoS3Key: null
    });
  });

  it('requires and normalizes the displayed club name', async () => {
    await expect(updateBrandingName(' ')).rejects.toMatchObject({ message: 'Vui lòng nhập tên CLB.' });
    mocks.findFirst.mockResolvedValue({ id: 'default', club_name: 'Old', logo_url: null, logo_s3_key: null });
    mocks.update.mockResolvedValue({ club_name: 'CLB Badmin', logo_url: null, logo_s3_key: null });

    await expect(updateBrandingName('  CLB Badmin  ')).resolves.toMatchObject({ clubName: 'CLB Badmin' });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: { club_name: 'CLB Badmin', updated_at: expect.any(Date) }
    });
  });

  it('persists a new logo before deleting the previous object', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'default', club_name: 'CLB Badmin', logo_s3_key: 'config/logo/old.webp', logo_url: 'old-url'
    });
    mocks.update.mockResolvedValue({
      club_name: 'CLB Badmin', logo_s3_key: 'config/logo/new.webp', logo_url: 'https://cdn.example/new.webp'
    });

    await updateBrandingLogo({ buffer: Buffer.from('logo'), contentType: 'image/webp', fileName: 'logo.webp' });

    expect(mocks.createTenantImageKey).toHaveBeenCalledWith(
      'aa1f1aa3-c438-4498-96e9-ab228cd51f4f', 'config/logo', 'logo.webp'
    );

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: expect.objectContaining({
        logo_s3_key: 'config/logo/new.webp', logo_url: 'https://cdn.example/new.webp'
      })
    }));
    expect(mocks.deleteS3Object).toHaveBeenCalledWith('config/logo/old.webp');
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.deleteS3Object.mock.invocationCallOrder[0]);
  });

  it('deletes the current logo object and clears branding references', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'default', club_name: 'CLB Badmin', logo_s3_key: 'config/logo/current.webp', logo_url: 'current-url'
    });
    mocks.update.mockResolvedValue({ club_name: 'CLB Badmin', logo_s3_key: null, logo_url: null });

    await expect(deleteBrandingLogo()).resolves.toEqual({
      clubName: 'CLB Badmin', logoS3Key: null, logoUrl: null
    });
    expect(mocks.deleteS3Object).toHaveBeenCalledWith('config/logo/current.webp');
    expect(mocks.update).toHaveBeenCalledWith({
      where: { club_id: 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f' },
      data: { logo_s3_key: null, logo_url: null, updated_at: expect.any(Date) }
    });
  });
});
