import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { deletePaymentBankAccount } from '@/repositories/payment-bank-accounts-repository';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ accountId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireApiPermission(request, 'settings.manage');
    const { accountId } = await context.params;
    await deletePaymentBankAccount(accountId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể xóa tài khoản thanh toán');
  }
}
