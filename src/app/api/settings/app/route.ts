import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { getAppSettings, updateAppSettings } from '@/repositories/app-settings-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return apiError(error, 'Không thể tải cài đặt vận hành');
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const payload = await request.json();
    const settings = await updateAppSettings({
      maxCourtCountPerSession: payload.maxCourtCountPerSession,
      autoCreateCourtFeeTransaction: payload.autoCreateCourtFeeTransaction,
      autoCreateShuttlecockUsageTransaction: payload.autoCreateShuttlecockUsageTransaction,
      defaultPaymentBankAccountId: payload.defaultPaymentBankAccountId
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật cài đặt vận hành');
  }
}
