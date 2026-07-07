import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { normalizeUserRole } from '@/lib/auth/permissions';
import { createAuthUser, listAuthUsers } from '@/repositories/auth-users-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'users.manage');
    const users = await listAuthUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải danh sách tài khoản');
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireApiPermission(request, 'users.manage');
    const payload = await request.json();
    const role = normalizeUserRole(payload.role);
    if (role === 'OWNER' && currentUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Chỉ Chủ CLB được tạo tài khoản Chủ CLB.' }, { status: 403 });
    }
    const user = await createAuthUser({
      email: payload.email,
      displayName: payload.displayName,
      password: payload.password,
      role
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tạo tài khoản');
  }
}
