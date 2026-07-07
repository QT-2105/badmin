import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { readImageFileFromFormData } from '@/lib/image-upload';
import { deleteBrandingLogo, updateBrandingLogo } from '@/repositories/branding-repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const formData = await request.formData();
    const file = await readImageFileFromFormData(formData);
    const branding = await updateBrandingLogo(file);
    return NextResponse.json({ branding });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật logo');
  }
}

export async function DELETE(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const branding = await deleteBrandingLogo();
    return NextResponse.json({ branding });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa logo');
  }
}
