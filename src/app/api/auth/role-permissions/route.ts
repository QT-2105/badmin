import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { authErrorResponse, requireApiPermission, requireApiUser } from '@/lib/auth/guards';
import { normalizePermissionKeys, normalizeUserRole } from '@/lib/auth/permissions';
import { listRolePermissions, updateRolePermissions } from '@/repositories/role-permissions-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiPermission(request, 'users.manage');
    const roles = await listRolePermissions();
    return NextResponse.json({ roles });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể tải cấu hình phân quyền');
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiUser(request, ['OWNER']);
    const payload = await request.json();
    const role = normalizeUserRole(payload.role);
    const result = await updateRolePermissions(role, normalizePermissionKeys(payload.permissions));
    return NextResponse.json({ role: result });
  } catch (error) {
    return authErrorResponse(error) ?? apiError(error, 'Không thể cập nhật phân quyền');
  }
}
