import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission } from '@/lib/auth/guards';
import { normalizeUserRole, normalizeUserStatus } from '@/lib/auth/permissions';
import { countActiveOwners, getAuthUserById, updateAuthUser } from '@/repositories/auth-users-repository';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const currentUser = await requireApiPermission(request, 'users.manage');
    const { userId } = await context.params;
    const payload = await request.json();
    const targetUser = await getAuthUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    }

    const nextRole = payload.role === undefined ? undefined : normalizeUserRole(payload.role);
    const nextStatus = payload.status === undefined ? undefined : normalizeUserStatus(payload.status);
    if (currentUser.role !== 'OWNER' && (targetUser.role === 'OWNER' || nextRole === 'OWNER')) {
      return NextResponse.json({ error: 'Chỉ Chủ CLB được chỉnh tài khoản Chủ CLB.' }, { status: 403 });
    }
    if (currentUser.id === userId && (nextStatus === 'DISABLED' || (nextRole !== undefined && nextRole !== 'OWNER'))) {
      return NextResponse.json({ error: 'Không thể tự khóa hoặc tự hạ quyền tài khoản đang đăng nhập.' }, { status: 400 });
    }
    if (targetUser.role === 'OWNER' && targetUser.status === 'ACTIVE') {
      const activeOwners = await countActiveOwners();
      if (activeOwners <= 1 && (nextStatus === 'DISABLED' || (nextRole !== undefined && nextRole !== 'OWNER'))) {
        return NextResponse.json({ error: 'Hệ thống cần giữ lại ít nhất một tài khoản Chủ CLB đang hoạt động.' }, { status: 400 });
      }
    }
    const user = await updateAuthUser(userId, {
      email: payload.email,
      displayName: payload.displayName,
      role: nextRole,
      status: nextStatus,
      password: payload.password
    });
    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật tài khoản');
  }
}
