import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { getBrandingSettings, updateBrandingName } from '@/repositories/branding-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const branding = await getBrandingSettings();
    return NextResponse.json({ branding });
  } catch (error) {
    return apiError(error, 'Không thể tải thông tin CLB');
  }
}

export async function PUT(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const payload = await request.json();
    const branding = await updateBrandingName(String(payload.clubName ?? ''));
    return NextResponse.json({ branding });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật thông tin CLB');
  }
}
