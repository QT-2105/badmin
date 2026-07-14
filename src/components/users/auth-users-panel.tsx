'use client';

import { ChevronDown, ChevronUp, Loader2, Save, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { useAuthUserMutations, useAuthUsers, useCurrentUser, useRolePermissionMutations, useRolePermissions } from '@/hooks/use-auth';
import { getRoleLabel, PERMISSION_DEFINITIONS, USER_ROLES, type PermissionKey, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const roleDescriptions: Record<UserRole, string> = {
  OWNER: 'Toàn quyền hệ thống, luôn được phép cấu hình phân quyền.',
  MANAGER: 'Mặc định quản lý lịch, ca, thu chi, kho và hoàn tất ca.',
  OPERATOR: 'Mặc định điều phối ca, cập nhật người chơi và lưu runtime.',
  VIEWER: 'Mặc định chỉ xem dashboard, lịch, kho và thu chi.'
};

export function AuthUsersPanel() {
  const { data: currentUser } = useCurrentUser();
  const { data: authUsers = [] } = useAuthUsers();
  const { data: rolePermissions = [] } = useRolePermissions();
  const authMutations = useAuthUserMutations();
  const roleMutations = useRolePermissionMutations();
  const [newUser, setNewUser] = useState({ email: '', displayName: '', password: '', role: 'OPERATOR' as UserRole });
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [draftPermissions, setDraftPermissions] = useState<Record<UserRole, PermissionKey[]>>({} as Record<UserRole, PermissionKey[]>);
  const [usersPageSize, setUsersPageSize] = useState<PageSize>(10);
  const [usersPage, setUsersPage] = useState(1);
  const [permissionsExpanded, setPermissionsExpanded] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('MANAGER');
  const permissionGroups = useMemo(() => {
    return PERMISSION_DEFINITIONS.reduce<Record<string, typeof PERMISSION_DEFINITIONS[number][]>>((groups, item) => {
      groups[item.group] = [...(groups[item.group] ?? []), item];
      return groups;
    }, {});
  }, []);

  useEffect(() => {
    if (rolePermissions.length === 0) return;
    setDraftPermissions((current) => {
      const next = { ...current };
      rolePermissions.forEach((role) => {
        next[role.role] = role.permissions;
      });
      return next;
    });
  }, [rolePermissions]);

  useEffect(() => {
    setUsersPage(1);
  }, [authUsers.length, usersPageSize]);

  async function handleCreateUser() {
    await authMutations.createUser.mutateAsync(newUser);
    setNewUser({ email: '', displayName: '', password: '', role: 'OPERATOR' });
  }

  async function handleUpdateUser(userId: string, payload: { email?: string; displayName?: string; role?: UserRole; status?: UserStatus; password?: string }) {
    await authMutations.updateUser.mutateAsync({ userId, payload });
    if (payload.password !== undefined) {
      setUserPasswords((current) => ({ ...current, [userId]: '' }));
    }
  }

  function togglePermission(role: UserRole, permission: PermissionKey) {
    if (role === 'OWNER') return;
    setDraftPermissions((current) => {
      const rolePermissions = current[role] ?? [];
      const nextPermissions = rolePermissions.includes(permission)
        ? rolePermissions.filter((item) => item !== permission)
        : [...rolePermissions, permission];
      return { ...current, [role]: nextPermissions };
    });
  }

  async function saveRolePermissions(role: UserRole) {
    await roleMutations.updateRolePermissions.mutateAsync({
      role,
      permissions: draftPermissions[role] ?? []
    });
  }

  const sortedUsers = useMemo(() => {
    return [...authUsers].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [authUsers]);
  const totalUserPages = Math.max(1, Math.ceil(sortedUsers.length / usersPageSize));
  const visibleUsers = sortedUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);
  const selectedPermissions = draftPermissions[selectedRole] ?? [];
  const selectedRoleLocked = selectedRole === 'OWNER' || currentUser?.role !== 'OWNER';

  return (
    <div className="grid gap-4">
      <SectionCard>
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          {USER_ROLES.map((role) => (
            <RoleNote key={role} role={role} description={roleDescriptions[role]} />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_auto] lg:items-end">
          <label className="block">
            <span className={formLabelClass}>Tên đăng nhập</span>
            <input
              type="text"
              autoComplete="username"
              value={newUser.email}
              onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
              className={formInputClass}
              placeholder="operator01"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Tên hiển thị</span>
            <input
              value={newUser.displayName}
              onChange={(event) => setNewUser((current) => ({ ...current, displayName: event.target.value }))}
              className={formInputClass}
              placeholder="Tên operator"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Mật khẩu</span>
            <input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
              className={formInputClass}
              placeholder="Tối thiểu 8 ký tự"
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Role</span>
            <select
              value={newUser.role}
              onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as UserRole }))}
              className={formInputClass}
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{getRoleLabel(role)}</option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={authMutations.createUser.isPending}
            className="h-11 rounded-xl"
          >
            {authMutations.createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Tạo
          </Button>
        </div>
        {authMutations.createUser.error ? (
          <p className="mt-2 text-sm font-medium text-danger">{authMutations.createUser.error.message}</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Danh sách người dùng"
        description="Chỉnh tên đăng nhập, tên hiển thị, vai trò, trạng thái và mật khẩu mới cho từng tài khoản nội bộ."
        actions={(
          <select
            value={usersPageSize}
            onChange={(event) => {
              setUsersPageSize(Number(event.target.value) as PageSize);
              setUsersPage(1);
            }}
            className={`${compactFormInputClass} sm:w-32`}
          >
            {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
          </select>
        )}
      >
        <div className="operational-x-scroll max-h-[460px] overflow-auto rounded-lg border border-border">
          <div className="min-w-[1120px]">
            <div className="sticky top-0 z-10 grid grid-cols-[1.1fr_1.1fr_1fr_140px_120px_1fr_auto] items-center gap-3 border-b border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <div>Tên đăng nhập</div>
              <div>Tên hiển thị</div>
              <div>Đăng nhập gần nhất</div>
              <div>Vai trò</div>
              <div>Trạng thái</div>
              <div>Mật khẩu mới</div>
              <div className="text-right">Lưu</div>
            </div>
            {visibleUsers.map((user) => (
              <article key={user.id} className="grid grid-cols-[1.1fr_1.1fr_1fr_140px_120px_1fr_auto] items-center gap-3 border-b border-border px-3 py-3 text-sm">
                <input
                  defaultValue={user.email}
                  onBlur={(event) => {
                    if (event.target.value !== user.email) void handleUpdateUser(user.id, { email: event.target.value });
                  }}
                  className={`${formInputClass} h-10 font-semibold`}
                  aria-label="Tên đăng nhập"
                />
                <input
                  defaultValue={user.displayName}
                  onBlur={(event) => {
                    if (event.target.value !== user.displayName) void handleUpdateUser(user.id, { displayName: event.target.value });
                  }}
                  className={`${formInputClass} h-10`}
                  aria-label="Tên hiển thị"
                />
                <div className="min-w-0 text-xs text-muted-foreground">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                </div>
                <select
                  value={user.role}
                  onChange={(event) => void handleUpdateUser(user.id, { role: event.target.value as UserRole })}
                  className={`${formInputClass} h-10`}
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{getRoleLabel(role)}</option>
                  ))}
                </select>
                <select
                  value={user.status}
                  onChange={(event) => void handleUpdateUser(user.id, { status: event.target.value as UserStatus })}
                  className={`${formInputClass} h-10`}
                >
                  <option value="ACTIVE">Đang dùng</option>
                  <option value="DISABLED">Tạm khóa</option>
                </select>
                <input
                  type="password"
                  value={userPasswords[user.id] ?? ''}
                  onChange={(event) => setUserPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                  className={`${formInputClass} h-10`}
                  placeholder="Mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => void handleUpdateUser(user.id, { password: userPasswords[user.id] ?? '' })}
                  disabled={!userPasswords[user.id] || authMutations.updateUser.isPending}
                  className="h-10 rounded-lg border border-border bg-surface-muted px-3 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lưu
                </button>
              </article>
            ))}
            {authUsers.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">Chưa có tài khoản đăng nhập.</div>
            ) : null}
          </div>
        </div>
        <PaginationControls
          currentPage={Math.min(usersPage, totalUserPages)}
          totalPages={totalUserPages}
          totalItems={sortedUsers.length}
          pageSize={usersPageSize}
          onPageChange={setUsersPage}
        />
      </SectionCard>
      {authMutations.updateUser.error ? (
        <p className="text-sm font-medium text-danger">{authMutations.updateUser.error.message}</p>
      ) : null}

      <SectionCard
        title="Cấu hình phân quyền vai trò"
        description="Chủ CLB luôn có full quyền. Các vai trò còn lại có thể bật/tắt quyền theo nhu cầu vận hành."
        actions={(
          <Button type="button" variant="secondary" size="sm" onClick={() => setPermissionsExpanded((open) => !open)}>
            {permissionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {permissionsExpanded ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        )}
      >
        {permissionsExpanded ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg bg-surface-muted p-3 md:flex-row md:items-end md:justify-between">
              <label className="block md:w-72">
                <span className={formLabelClass}>Vai trò cấu hình</span>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as UserRole)}
                  className={`${formInputClass} h-10`}
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{getRoleLabel(role)}</option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                  {selectedRole === 'OWNER' ? 'Chủ CLB luôn full quyền' : `${selectedPermissions.length} quyền đang bật`}
                </span>
                {selectedRole !== 'OWNER' ? (
                  <button
                    type="button"
                    onClick={() => void saveRolePermissions(selectedRole)}
                    disabled={currentUser?.role !== 'OWNER' || roleMutations.updateRolePermissions.isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-info/30 bg-info-soft px-3 text-xs font-semibold text-info transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {roleMutations.updateRolePermissions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Lưu quyền
                  </button>
                ) : null}
              </div>
            </div>
            {roleMutations.updateRolePermissions.error ? (
              <p className="mt-2 text-sm font-medium text-danger">{roleMutations.updateRolePermissions.error.message}</p>
            ) : null}
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(permissionGroups).map(([group, items]) => (
                <div key={`${selectedRole}-${group}`} className="rounded-xl border border-border bg-surface-muted p-2">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</div>
                  <div className="grid gap-2">
                    {items.map((item) => {
                      const checked = selectedRole === 'OWNER' || selectedPermissions.includes(item.key);
                      return (
                        <label
                          key={`${selectedRole}-${item.key}`}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border border-border px-2 py-2 text-xs text-muted-foreground',
                            checked ? 'border-info/45 bg-surface text-info' : 'bg-background'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={selectedRoleLocked}
                            onChange={() => togglePermission(selectedRole, item.key)}
                            className="h-4 w-4 accent-cyan-300"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}

function RoleNote({ role, description }: { role: UserRole; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3">
      <div className="text-xs font-semibold text-info">{getRoleLabel(role)}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
