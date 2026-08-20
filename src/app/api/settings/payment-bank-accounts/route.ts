import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { readImageFileFromFormData } from '@/lib/image-upload';
import {
  createPaymentBankAccount,
  listPaymentBankAccounts
} from '@/repositories/payment-bank-accounts-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accounts = await listPaymentBankAccounts({ activeOnly: true });
    return NextResponse.json({ accounts });
  } catch (error) {
    return apiError(error, 'Không thể tải tài khoản thanh toán');
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const formData = await request.formData();
    const account = await createPaymentBankAccount({
      accountName: String(formData.get('accountName') ?? ''),
      bankName: String(formData.get('bankName') ?? ''),
      qrImage: await readImageFileFromFormData(formData, 'qrImage')
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể thêm tài khoản thanh toán');
  }
}
