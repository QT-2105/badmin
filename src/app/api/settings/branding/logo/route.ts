import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { readImageFileFromFormData } from '@/lib/image-upload';
import { deleteBrandingLogo, updateBrandingLogo } from '@/repositories/branding-repository';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = await readImageFileFromFormData(formData);
    const branding = await updateBrandingLogo(file);
    return NextResponse.json({ branding });
  } catch (error) {
    return apiError(error, 'Không thể cập nhật logo');
  }
}

export async function DELETE() {
  try {
    const branding = await deleteBrandingLogo();
    return NextResponse.json({ branding });
  } catch (error) {
    return apiError(error, 'Không thể xóa logo');
  }
}
