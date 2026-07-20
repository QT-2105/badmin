'use client';

import { ChevronDown, ChevronUp, KeyRound, Loader2, Save, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Checkbox, Input, Select } from '@/components/ui/form';
import { SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuthUserMutations, useAuthUsers, useCurrentUser, useRolePermissionMutations, useRolePermissions } from '@/hooks/use-auth';
import { getRoleLabel, PERMISSION_DEFINITIONS, USER_ROLES, type PermissionKey, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const roleDescriptions: Record<UserRole, string> = {
  OWNER: 'Toàn quyền hệ thống, luôn được phép cấu hình phân quyền.',
  MANAGER: 'Mặc định quản lý lịch, ca, thu chi, kho và hoàn tất ca.',
  OPERATOR: 'Mặc định điều phối ca, cập nhật người chơi và lưu runtime.',
  VIEWER: 'Mặc định chỉ xem dashboard, lịch, kho và thu chi.'
};

const roleBadgeTone: Record<UserRole, 'neutral' | 'info' | 'success' | 'warning'> = {
  OWNER: 'success',
  MANAGER: 'info',
  OPERATOR: 'neutral',
  VIEWER: 'warning'
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Đang dùng',
  DISABLED: 'Tạm khóa'
};

const statusDescriptions: Record<UserStatus, string> = {
  ACTIVE: 'Có thể đăng nhập',
  DISABLED: 'Không thể đăng nhập'
};

const statusBadgeTone: Record<UserStatus, 'success' | 'warning'> = {
  ACTIVE: 'success',
  DISABLED: 'warning'
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
  const roleUserCounts = useMemo(() => {
    const counts = USER_ROLES.reduce((result, role) => ({ ...result, [role]: 0 }), {} as Record<UserRole, number>);
    authUsers.forEach((user) => {
      counts[user.role] += 1;
    });
    return counts;
  }, [authUsers]);
  const rolePermissionCounts = useMemo(() => {
    return USER_ROLES.reduce((result, role) => ({
      ...result,
      [role]: role === 'OWNER' ? PERMISSION_DEFINITIONS.length : (draftPermissions[role] ?? []).length
    }), {} as Record<UserRole, number>);
  }, [draftPermissions]);

  return (
    <div className="grid min-w-0 gap-3 sm:gap-4 md:gap-5">
      <SectionCard
        title="Tạo tài khoản nội bộ"
        description="Tài khoản dùng để đăng nhập vận hành hệ thống. Quyền thao tác được kiểm soát bằng vai trò và cấu hình phân quyền bên dưới."
        contentClassName="space-y-4"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {USER_ROLES.map((role) => (
            <RoleNote
              key={role}
              role={role}
              description={roleDescriptions[role]}
              userCount={roleUserCounts[role]}
              permissionCount={rolePermissionCounts[role]}
              selected={selectedRole === role}
            />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-3 shadow-subtle">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Thông tin đăng nhập</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tạo tài khoản đăng nhập nội bộ. Mật khẩu và quyền vẫn được kiểm tra bởi lớp bảo mật hiện tại.
              </p>
            </div>
            <StatusBadge tone="info" className="shrink-0 rounded-lg px-3 py-1.5 text-[11px]">
              Mặc định {getRoleLabel(newUser.role)}
            </StatusBadge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_0.85fr_0.75fr_auto] xl:items-start">
          <label className="block">
            <span className={cn(formLabelClass, 'flex items-center gap-1')}>
              Tên đăng nhập
              <RequiredMark />
            </span>
            <Input
              type="text"
              autoComplete="username"
              value={newUser.email}
              onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
              className={formInputClass}
              placeholder="operator01"
              aria-describedby="create-user-email-hint"
            />
            <FieldHint id="create-user-email-hint">Dùng để đăng nhập. Không tự động thêm đuôi email.</FieldHint>
          </label>
          <label className="block">
            <span className={cn(formLabelClass, 'flex items-center gap-1')}>
              Tên hiển thị
              <RequiredMark />
            </span>
            <Input
              value={newUser.displayName}
              onChange={(event) => setNewUser((current) => ({ ...current, displayName: event.target.value }))}
              className={formInputClass}
              placeholder="Tên operator"
              aria-describedby="create-user-display-name-hint"
            />
            <FieldHint id="create-user-display-name-hint">Tên hiển thị trong danh sách quản trị.</FieldHint>
          </label>
          <label className="block">
            <span className={cn(formLabelClass, 'flex items-center gap-1')}>
              Mật khẩu
              <RequiredMark />
            </span>
            <Input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
              className={formInputClass}
              placeholder="Tối thiểu 8 ký tự"
              aria-describedby="create-user-password-hint"
            />
            <FieldHint id="create-user-password-hint">Quy tắc mật khẩu do API hiện tại kiểm tra.</FieldHint>
          </label>
          <label className="block">
            <span className={cn(formLabelClass, 'flex items-center gap-1')}>
              Role
              <RequiredMark />
            </span>
            <Select
              value={newUser.role}
              onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as UserRole }))}
              className={formInputClass}
              aria-describedby="create-user-role-hint"
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{getRoleLabel(role)}</option>
              ))}
            </Select>
            <FieldHint id="create-user-role-hint">Giữ nguyên giá trị role hệ thống.</FieldHint>
          </label>
          <Button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={authMutations.createUser.isPending}
            className="h-11 rounded-xl whitespace-nowrap md:w-fit xl:mt-6"
            aria-label="Tạo tài khoản nội bộ"
          >
            {authMutations.createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Tạo
          </Button>
          </div>
        </div>
        {authMutations.createUser.error ? (
          <p role="alert" className="mt-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {authMutations.createUser.error.message}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Danh sách người dùng"
        description="Chỉnh tên đăng nhập, tên hiển thị, vai trò, trạng thái và mật khẩu mới cho từng tài khoản nội bộ."
        actions={(
          <label className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Hiển thị</span>
            <Select
              value={usersPageSize}
              onChange={(event) => {
                setUsersPageSize(Number(event.target.value) as PageSize);
                setUsersPage(1);
              }}
              className={`${compactFormInputClass} sm:w-32`}
            >
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
            </Select>
          </label>
        )}
      >
        <div className="operational-x-scroll max-h-[500px] overflow-auto overscroll-x-contain rounded-xl border border-border bg-background" aria-label="Danh sách người dùng nội bộ">
          <div className="min-w-[1180px] xl:min-w-[1320px]" role="table" aria-rowcount={visibleUsers.length + 1}>
            <div className="sticky top-0 z-10 grid grid-cols-[minmax(220px,1.2fr)_minmax(170px,1fr)_minmax(145px,0.8fr)_160px_180px_minmax(170px,1fr)_92px] items-center gap-3 border-b border-border bg-surface-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground" role="row">
              <div role="columnheader">Tài khoản</div>
              <div role="columnheader">Tên hiển thị</div>
              <div role="columnheader">Hoạt động</div>
              <div role="columnheader">Vai trò</div>
              <div role="columnheader">Trạng thái</div>
              <div role="columnheader">Mật khẩu mới</div>
              <div className="text-right" role="columnheader">Tác vụ</div>
            </div>
            {visibleUsers.map((user) => {
              const statusDescriptionId = `user-status-${user.id}`;
              return (
              <article
                  key={user.id}
                  className="grid grid-cols-[minmax(220px,1.2fr)_minmax(170px,1fr)_minmax(145px,0.8fr)_160px_180px_minmax(170px,1fr)_92px] items-center gap-3 border-b border-border px-3 py-3 text-sm transition-colors last:border-b-0 hover:bg-surface-muted/70 focus-within:bg-surface-muted/70 motion-reduce:transition-none"
                  role="row"
                  aria-label={`Tài khoản ${user.displayName || user.email}`}
                >
                <div className="flex min-w-0 items-center gap-2" role="cell">
                  <UserInitialsAvatar displayName={user.displayName} email={user.email} />
                  <Input
                    defaultValue={user.email}
                    onBlur={(event) => {
                      if (event.target.value !== user.email) void handleUpdateUser(user.id, { email: event.target.value });
                    }}
                    className={`${formInputClass} h-10 min-w-0 font-semibold`}
                    aria-label="Tên đăng nhập"
                    title={user.email}
                  />
                </div>
                <div role="cell">
                  <Input
                    defaultValue={user.displayName}
                    onBlur={(event) => {
                      if (event.target.value !== user.displayName) void handleUpdateUser(user.id, { displayName: event.target.value });
                    }}
                    className={`${formInputClass} h-10`}
                    aria-label="Tên hiển thị"
                    title={user.displayName}
                  />
                </div>
                <div className="min-w-0 space-y-1 text-xs text-muted-foreground" role="cell">
                  <div className="truncate font-medium text-foreground" title={user.lastLoginAt ? formatUserDate(user.lastLoginAt) : 'Chưa đăng nhập'}>
                    {user.lastLoginAt ? formatUserDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                  </div>
                  <div className="truncate" title={user.createdAt ? formatUserDate(user.createdAt) : '-'}>
                    Tạo {user.createdAt ? formatUserDate(user.createdAt) : '-'}
                  </div>
                </div>
                <div className="space-y-1.5" role="cell">
                  <StatusBadge tone={roleBadgeTone[user.role]} className="min-h-6 px-2 text-[11px]">
                    {getRoleLabel(user.role)}
                  </StatusBadge>
                  <Select
                    value={user.role}
                    onChange={(event) => void handleUpdateUser(user.id, { role: event.target.value as UserRole })}
                    className={`${formInputClass} h-10`}
                    aria-label="Vai trò"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </Select>
                </div>
                <div
                  className={cn(
                    'space-y-2 rounded-lg border px-2 py-2',
                    user.status === 'ACTIVE' ? 'border-success/25 bg-success-soft/60' : 'border-warning/30 bg-warning-soft/60'
                  )}
                  role="cell"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge tone={statusBadgeTone[user.status]} className="min-h-6 px-2 text-[11px]">
                      {statusLabels[user.status]}
                    </StatusBadge>
                    <span id={statusDescriptionId} className="text-[11px] font-medium text-muted-foreground">{statusDescriptions[user.status]}</span>
                  </div>
                  <Select
                    value={user.status}
                    onChange={(event) => void handleUpdateUser(user.id, { status: event.target.value as UserStatus })}
                    className={`${formInputClass} h-10`}
                    aria-label="Trạng thái"
                    aria-describedby={statusDescriptionId}
                  >
                    <option value="ACTIVE">Đang dùng</option>
                    <option value="DISABLED">Tạm khóa</option>
                  </Select>
                </div>
                <div role="cell">
                  <Input
                    type="password"
                    value={userPasswords[user.id] ?? ''}
                    onChange={(event) => setUserPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                    className={`${formInputClass} h-10`}
                    placeholder="Mật khẩu mới"
                    aria-label={`Mật khẩu mới cho ${user.displayName || user.email}`}
                  />
                </div>
                <div className="flex justify-end" role="cell">
                  <Button
                    type="button"
                    onClick={() => void handleUpdateUser(user.id, { password: userPasswords[user.id] ?? '' })}
                    disabled={!userPasswords[user.id] || authMutations.updateUser.isPending}
                    variant="secondary"
                    size="sm"
                    className="h-10 px-3 text-xs whitespace-nowrap"
                    aria-label={`Lưu mật khẩu mới cho ${user.displayName || user.email}`}
                  >
                    {authMutations.updateUser.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                    Lưu
                  </Button>
                </div>
              </article>
              );
            })}
            {authUsers.length === 0 ? (
              <EmptyState title="Chưa có tài khoản" description="Tạo tài khoản nội bộ để phân quyền thao tác hệ thống." className="m-3" />
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
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {authMutations.updateUser.error.message}
        </p>
      ) : null}

      <SectionCard
        title="Cấu hình phân quyền vai trò"
        description="Chủ CLB luôn có full quyền. Các vai trò còn lại có thể bật/tắt quyền theo nhu cầu vận hành."
        actions={(
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPermissionsExpanded((open) => !open)}
            aria-expanded={permissionsExpanded}
          >
            {permissionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {permissionsExpanded ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        )}
      >
        {permissionsExpanded ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] md:items-start">
                <label className="block">
                  <span className={formLabelClass}>Vai trò cấu hình</span>
                  <Select
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value as UserRole)}
                    className={`${formInputClass} h-10`}
                    aria-describedby="selected-role-summary"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </Select>
                </label>
                <div id="selected-role-summary" className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={roleBadgeTone[selectedRole]} className="px-2 py-1 text-[11px]">
                      {getRoleLabel(selectedRole)}
                    </StatusBadge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {roleUserCounts[selectedRole]} user · {rolePermissionCounts[selectedRole]} quyền
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{roleDescriptions[selectedRole]}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <StatusBadge tone={selectedRole === 'OWNER' ? 'success' : 'info'} className="rounded-lg px-3 py-2">
                  {selectedRole === 'OWNER' ? 'Chủ CLB luôn full quyền' : `${selectedPermissions.length} quyền đang bật`}
                </StatusBadge>
                {selectedRole !== 'OWNER' ? (
                  <Button
                    type="button"
                    onClick={() => void saveRolePermissions(selectedRole)}
                    disabled={currentUser?.role !== 'OWNER' || roleMutations.updateRolePermissions.isPending}
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 text-xs whitespace-nowrap"
                  >
                    {roleMutations.updateRolePermissions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Lưu quyền
                  </Button>
                ) : null}
              </div>
            </div>
            {roleMutations.updateRolePermissions.error ? (
              <p role="alert" className="mt-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {roleMutations.updateRolePermissions.error.message}
              </p>
            ) : null}
            <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {Object.entries(permissionGroups).map(([group, items]) => {
                const groupId = `permission-group-${toDomId(selectedRole)}-${toDomId(group)}`;
                const groupStatusId = `${groupId}-status`;
                return (
                <div
                  key={`${selectedRole}-${group}`}
                  className="rounded-xl border border-border bg-surface p-3 shadow-subtle"
                  role="group"
                  aria-labelledby={groupId}
                  aria-describedby={groupStatusId}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div id={groupId} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</div>
                      <div id={groupStatusId} className="mt-1 text-xs text-muted-foreground">
                        {countSelectedPermissions(items, selectedRole, selectedPermissions)} / {items.length} quyền đang bật
                      </div>
                    </div>
                    <StatusBadge tone={selectedRoleLocked ? 'warning' : 'success'} className="shrink-0 px-2 py-1 text-[10px]">
                      {selectedRoleLocked ? 'Chỉ xem' : 'Có thể sửa'}
                    </StatusBadge>
                  </div>
                  <div className="grid gap-2">
                    {items.map((item) => {
                      const checked = selectedRole === 'OWNER' || selectedPermissions.includes(item.key);
                      return (
                        <label
                          key={`${selectedRole}-${item.key}`}
                          className={cn(
                            'flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors',
                            checked ? 'border-info/45 bg-info-soft text-info' : 'border-border bg-background text-muted-foreground hover:bg-surface-muted',
                            selectedRoleLocked ? 'opacity-80' : 'cursor-pointer',
                            'motion-reduce:transition-none'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={selectedRoleLocked}
                            onChange={() => togglePermission(selectedRole, item.key)}
                            aria-label={`${item.label} cho vai trò ${getRoleLabel(selectedRole)}`}
                          />
                          <span className="min-w-0 flex-1 font-medium leading-5 text-foreground">{item.label}</span>
                          <span className={cn('shrink-0 text-[11px] font-semibold', checked ? 'text-info' : 'text-muted-foreground')}>
                            {checked ? 'Bật' : 'Tắt'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </>
        ) : null}
      </SectionCard>
    </div>
  );
}

function RoleNote({
  role,
  description,
  userCount,
  permissionCount,
  selected
}: {
  role: UserRole;
  description: string;
  userCount: number;
  permissionCount: number;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        'h-full rounded-xl border bg-surface p-3 transition-colors',
        selected ? 'border-info/45 shadow-subtle' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-info">{getRoleLabel(role)}</div>
        <StatusBadge tone={role === 'OWNER' ? 'success' : 'neutral'} className="px-2 py-1 text-[10px]">
          {role === 'OWNER' ? 'Hệ thống' : 'Cấu hình'}
        </StatusBadge>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border bg-surface-muted px-2 py-2">
          <div className="font-semibold text-foreground">{userCount}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">user</div>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted px-2 py-2">
          <div className="font-semibold text-foreground">{permissionCount}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">quyền</div>
        </div>
      </div>
    </div>
  );
}

function RequiredMark() {
  return <span aria-hidden="true" className="text-danger">*</span>;
}

function FieldHint({ id, children }: { id: string; children: string }) {
  return <span id={id} className="mt-1 block text-[11px] leading-4 text-muted-foreground">{children}</span>;
}

function countSelectedPermissions(
  items: typeof PERMISSION_DEFINITIONS[number][],
  selectedRole: UserRole,
  selectedPermissions: PermissionKey[]
): number {
  if (selectedRole === 'OWNER') return items.length;
  return items.filter((item) => selectedPermissions.includes(item.key)).length;
}

function UserInitialsAvatar({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary-soft text-xs font-bold uppercase text-primary"
    >
      {getUserInitials(displayName, email)}
    </div>
  );
}

function getUserInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (!source) return 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function toDomId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function formatUserDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}
