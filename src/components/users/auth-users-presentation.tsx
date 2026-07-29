'use client';

import { ChevronDown, ChevronUp, KeyRound, Loader2, Save, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Checkbox, Input, Select } from '@/components/ui/form';
import { SectionCard, compactFormInputClass, formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { PAGE_SIZE_OPTIONS, PaginationControls, type PageSize } from '@/components/ui/pagination-controls';
import { StatusBadge } from '@/components/ui/status-badge';
import { getRoleLabel, PERMISSION_DEFINITIONS, USER_ROLES, type AuthUser, type PermissionKey, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

export type NewAuthUserForm = {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
};

export type AuthUserRow = AuthUser & {
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};

export type PermissionGroups = Record<string, typeof PERMISSION_DEFINITIONS[number][]>;

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

export function AuthUsersPanelView({
  newUser,
  userPasswords,
  visibleUsers,
  authUsersLength,
  sortedUsersLength,
  usersPageSize,
  usersPage,
  totalUserPages,
  permissionsExpanded,
  selectedRole,
  selectedPermissions,
  selectedRoleLocked,
  roleUserCounts,
  rolePermissionCounts,
  permissionGroups,
  createUserPending,
  createUserError,
  updateUserPending,
  updateUserError,
  updateRolePermissionsPending,
  updateRolePermissionsError,
  canSaveSelectedRolePermissions,
  onNewUserChange,
  onCreateUser,
  onUsersPageSizeChange,
  onUsersPageChange,
  onUserEmailBlur,
  onUserDisplayNameBlur,
  onUserRoleChange,
  onUserStatusChange,
  onUserPasswordChange,
  onSaveUserPassword,
  onPermissionsExpandedChange,
  onSelectedRoleChange,
  onTogglePermission,
  onSaveRolePermissions
}: {
  newUser: NewAuthUserForm;
  userPasswords: Record<string, string>;
  visibleUsers: AuthUserRow[];
  authUsersLength: number;
  sortedUsersLength: number;
  usersPageSize: PageSize;
  usersPage: number;
  totalUserPages: number;
  permissionsExpanded: boolean;
  selectedRole: UserRole;
  selectedPermissions: PermissionKey[];
  selectedRoleLocked: boolean;
  roleUserCounts: Record<UserRole, number>;
  rolePermissionCounts: Record<UserRole, number>;
  permissionGroups: PermissionGroups;
  createUserPending: boolean;
  createUserError: string | null;
  updateUserPending: boolean;
  updateUserError: string | null;
  updateRolePermissionsPending: boolean;
  updateRolePermissionsError: string | null;
  canSaveSelectedRolePermissions: boolean;
  onNewUserChange: (form: NewAuthUserForm) => void;
  onCreateUser: () => void;
  onUsersPageSizeChange: (value: PageSize) => void;
  onUsersPageChange: (page: number) => void;
  onUserEmailBlur: (user: AuthUserRow, value: string) => void;
  onUserDisplayNameBlur: (user: AuthUserRow, value: string) => void;
  onUserRoleChange: (user: AuthUserRow, value: UserRole) => void;
  onUserStatusChange: (user: AuthUserRow, value: UserStatus) => void;
  onUserPasswordChange: (userId: string, value: string) => void;
  onSaveUserPassword: (userId: string) => void;
  onPermissionsExpandedChange: (expanded: boolean) => void;
  onSelectedRoleChange: (role: UserRole) => void;
  onTogglePermission: (role: UserRole, permission: PermissionKey) => void;
  onSaveRolePermissions: (role: UserRole) => void;
}) {
  return (
    <div className="grid min-w-0 gap-3 sm:gap-4 md:gap-5">
      <RoleSummarySection
        roleUserCounts={roleUserCounts}
        rolePermissionCounts={rolePermissionCounts}
      />

      <CreateUserSection
        newUser={newUser}
        createUserPending={createUserPending}
        createUserError={createUserError}
        onNewUserChange={onNewUserChange}
        onCreateUser={onCreateUser}
      />

      <UsersListSection
        visibleUsers={visibleUsers}
        authUsersLength={authUsersLength}
        sortedUsersLength={sortedUsersLength}
        usersPageSize={usersPageSize}
        usersPage={usersPage}
        totalUserPages={totalUserPages}
        userPasswords={userPasswords}
        updateUserPending={updateUserPending}
        updateUserError={updateUserError}
        onUsersPageSizeChange={onUsersPageSizeChange}
        onUsersPageChange={onUsersPageChange}
        onUserEmailBlur={onUserEmailBlur}
        onUserDisplayNameBlur={onUserDisplayNameBlur}
        onUserRoleChange={onUserRoleChange}
        onUserStatusChange={onUserStatusChange}
        onUserPasswordChange={onUserPasswordChange}
        onSaveUserPassword={onSaveUserPassword}
      />

      <RolePermissionSection
        permissionsExpanded={permissionsExpanded}
        selectedRole={selectedRole}
        selectedPermissions={selectedPermissions}
        selectedRoleLocked={selectedRoleLocked}
        roleUserCounts={roleUserCounts}
        rolePermissionCounts={rolePermissionCounts}
        permissionGroups={permissionGroups}
        updateRolePermissionsPending={updateRolePermissionsPending}
        updateRolePermissionsError={updateRolePermissionsError}
        canSaveSelectedRolePermissions={canSaveSelectedRolePermissions}
        onPermissionsExpandedChange={onPermissionsExpandedChange}
        onSelectedRoleChange={onSelectedRoleChange}
        onTogglePermission={onTogglePermission}
        onSaveRolePermissions={onSaveRolePermissions}
      />
    </div>
  );
}

function RoleSummarySection({
  roleUserCounts,
  rolePermissionCounts
}: {
  roleUserCounts: Record<UserRole, number>;
  rolePermissionCounts: Record<UserRole, number>;
}) {
  return (
    <SectionCard
      title="Thống kê tài khoản"
      description="Tổng quan nhanh số tài khoản và quyền hiện có theo từng vai trò."
      density="compact"
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {USER_ROLES.map((role) => (
          <RoleNote
            key={role}
            role={role}
            description={roleDescriptions[role]}
            userCount={roleUserCounts[role]}
            permissionCount={rolePermissionCounts[role]}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function CreateUserSection({
  newUser,
  createUserPending,
  createUserError,
  onNewUserChange,
  onCreateUser
}: {
  newUser: NewAuthUserForm;
  createUserPending: boolean;
  createUserError: string | null;
  onNewUserChange: (form: NewAuthUserForm) => void;
  onCreateUser: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <SectionCard
      title="Tạo tài khoản nội bộ"
      description="Tài khoản dùng để đăng nhập vận hành hệ thống. Quyền thao tác được kiểm soát bằng vai trò và cấu hình phân quyền bên dưới."
      density="compact"
      contentClassName={!isExpanded && !createUserError ? '!mt-0' : undefined}
      actions={(
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded((current) => !current)}
          className="h-10 w-full whitespace-nowrap sm:w-auto"
          aria-expanded={isExpanded}
          aria-controls="create-user-content"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? 'Thu gọn' : 'Mở rộng'}
        </Button>
      )}
    >
      {isExpanded ? (
        <div id="create-user-content" className="rounded-xl border border-border bg-surface-muted p-3 shadow-subtle sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">Thông tin đăng nhập</div>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Nhập đủ thông tin trên một hàng; các trường tự xuống hàng khi màn hình không đủ rộng.
              </p>
            </div>
            <StatusBadge
              tone="info"
              className="shrink-0 rounded-lg px-2.5 py-1 text-[11px]"
              title={`Role mặc định: ${newUser.role}`}
              aria-label={`Role mặc định ${getRoleLabel(newUser.role)}`}
            >
              Mặc định {getRoleLabel(newUser.role)}
            </StatusBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(190px,1.15fr)_minmax(180px,1fr)_minmax(180px,0.9fr)_150px_auto] lg:items-start">
            <label className="block">
              <span className={cn(formLabelClass, 'flex items-center gap-1')}>
                Tên đăng nhập
                <RequiredMark />
              </span>
              <Input
                type="text"
                autoComplete="username"
                value={newUser.email}
                onChange={(event) => onNewUserChange({ ...newUser, email: event.target.value })}
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
                onChange={(event) => onNewUserChange({ ...newUser, displayName: event.target.value })}
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
                onChange={(event) => onNewUserChange({ ...newUser, password: event.target.value })}
                className={formInputClass}
                placeholder="Tối thiểu 8 ký tự"
                aria-describedby="create-user-password-hint"
              />
              <FieldHint id="create-user-password-hint">Quy tắc mật khẩu do API hiện tại kiểm tra.</FieldHint>
            </label>
            <label className="block">
              <span className={cn(formLabelClass, 'flex items-center gap-1')}>
                Vai trò
                <RequiredMark />
              </span>
              <Select
                value={newUser.role}
                onChange={(event) => onNewUserChange({ ...newUser, role: event.target.value as UserRole })}
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
              onClick={onCreateUser}
              disabled={createUserPending}
              className="h-11 w-full rounded-xl whitespace-nowrap sm:w-fit lg:mt-6"
              aria-label="Tạo tài khoản nội bộ"
            >
              {createUserPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Tạo
            </Button>
          </div>
        </div>
      ) : null}
      {createUserError ? (
        <p role="alert" className="mt-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {createUserError}
        </p>
      ) : null}
    </SectionCard>
  );
}

function UsersListSection({
  visibleUsers,
  authUsersLength,
  sortedUsersLength,
  usersPageSize,
  usersPage,
  totalUserPages,
  userPasswords,
  updateUserPending,
  updateUserError,
  onUsersPageSizeChange,
  onUsersPageChange,
  onUserEmailBlur,
  onUserDisplayNameBlur,
  onUserRoleChange,
  onUserStatusChange,
  onUserPasswordChange,
  onSaveUserPassword
}: {
  visibleUsers: AuthUserRow[];
  authUsersLength: number;
  sortedUsersLength: number;
  usersPageSize: PageSize;
  usersPage: number;
  totalUserPages: number;
  userPasswords: Record<string, string>;
  updateUserPending: boolean;
  updateUserError: string | null;
  onUsersPageSizeChange: (value: PageSize) => void;
  onUsersPageChange: (page: number) => void;
  onUserEmailBlur: (user: AuthUserRow, value: string) => void;
  onUserDisplayNameBlur: (user: AuthUserRow, value: string) => void;
  onUserRoleChange: (user: AuthUserRow, value: UserRole) => void;
  onUserStatusChange: (user: AuthUserRow, value: UserStatus) => void;
  onUserPasswordChange: (userId: string, value: string) => void;
  onSaveUserPassword: (userId: string) => void;
}) {
  return (
    <>
      <SectionCard
        title="Danh sách tài khoản"
        description="Chỉnh tên đăng nhập, tên hiển thị, vai trò, trạng thái và mật khẩu mới cho từng tài khoản nội bộ."
        density="compact"
        actions={(
          <label className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Hiển thị</span>
            <Select
              value={usersPageSize}
              onChange={(event) => onUsersPageSizeChange(Number(event.target.value) as PageSize)}
              className={`${compactFormInputClass} sm:w-32`}
            >
              {PAGE_SIZE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
            </Select>
          </label>
        )}
      >
        <div className="operational-x-scroll max-h-[440px] overflow-auto overscroll-x-contain rounded-xl border border-border bg-background" aria-label="Danh sách tài khoản nội bộ">
          <div className="min-w-[1020px]" role="table" aria-rowcount={visibleUsers.length + 1}>
            <div className="sticky top-0 z-10 grid grid-cols-[minmax(210px,1.15fr)_minmax(170px,0.9fr)_150px_145px_150px_minmax(240px,1.2fr)] items-center gap-3 border-b border-border bg-surface-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground shadow-subtle" role="row">
              <div role="columnheader">Tài khoản</div>
              <div role="columnheader">Tên hiển thị</div>
              <div role="columnheader">Hoạt động</div>
              <div role="columnheader">Vai trò</div>
              <div role="columnheader">Trạng thái</div>
              <div role="columnheader">Mật khẩu mới</div>
            </div>
            {visibleUsers.map((user) => {
              const statusDescriptionId = `user-status-${user.id}`;
              return (
                <article
                  key={user.id}
                  className="grid grid-cols-[minmax(210px,1.15fr)_minmax(170px,0.9fr)_150px_145px_150px_minmax(240px,1.2fr)] items-center gap-3 border-b border-border px-3 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-surface-muted/70 focus-within:bg-surface-muted/70 motion-reduce:transition-none"
                  role="row"
                  aria-label={`Tài khoản ${user.displayName || user.email}`}
                >
                  <div className="flex min-w-0 items-center gap-2" role="cell">
                    <UserInitialsAvatar displayName={user.displayName} email={user.email} />
                    <Input
                      defaultValue={user.email}
                      onBlur={(event) => onUserEmailBlur(user, event.target.value)}
                      className={`${formInputClass} h-9 min-w-0 font-semibold`}
                      aria-label="Tên đăng nhập"
                      title={user.email}
                    />
                  </div>
                  <div role="cell">
                    <Input
                      defaultValue={user.displayName}
                      onBlur={(event) => onUserDisplayNameBlur(user, event.target.value)}
                      className={`${formInputClass} h-9`}
                      aria-label="Tên hiển thị"
                      title={user.displayName}
                    />
                  </div>
                  <div className="min-w-0 space-y-0.5 text-[11px] leading-4 text-muted-foreground" role="cell">
                    <div className="truncate font-medium text-foreground" title={user.lastLoginAt ? formatUserDate(user.lastLoginAt) : 'Chưa đăng nhập'}>
                      {user.lastLoginAt ? formatUserDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                    </div>
                    <div className="truncate" title={user.createdAt ? formatUserDate(user.createdAt) : '-'}>
                      Tạo {user.createdAt ? formatUserDate(user.createdAt) : '-'}
                    </div>
                  </div>
                  <div role="cell">
                    <Select
                      value={user.role}
                      onChange={(event) => onUserRoleChange(user, event.target.value as UserRole)}
                      className={`${formInputClass} h-9`}
                      aria-label="Vai trò"
                      title={`Vai trò hiện tại: ${getRoleLabel(user.role)} (${user.role})`}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>{getRoleLabel(role)}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="min-w-0" role="cell">
                    <div className="mb-1 flex items-center gap-1.5">
                      <StatusBadge
                        tone={statusBadgeTone[user.status]}
                        className="min-h-5 shrink-0 px-1.5 py-0.5 text-[10px]"
                        title={`Trạng thái tài khoản: ${user.status}`}
                        aria-label={`Trạng thái ${statusLabels[user.status]}`}
                      >
                        {statusLabels[user.status]}
                      </StatusBadge>
                      <span id={statusDescriptionId} className="truncate text-[10px] font-medium text-muted-foreground">{statusDescriptions[user.status]}</span>
                    </div>
                    <Select
                      value={user.status}
                      onChange={(event) => onUserStatusChange(user, event.target.value as UserStatus)}
                      className={`${formInputClass} h-9`}
                      aria-label="Trạng thái"
                      aria-describedby={statusDescriptionId}
                    >
                      <option value="ACTIVE">Đang dùng</option>
                      <option value="DISABLED">Tạm khóa</option>
                    </Select>
                  </div>
                  <div className="flex min-w-0 items-center gap-2" role="cell">
                    <Input
                      type="password"
                      value={userPasswords[user.id] ?? ''}
                      onChange={(event) => onUserPasswordChange(user.id, event.target.value)}
                      className={`${formInputClass} h-9 min-w-0 flex-1`}
                      placeholder="Mật khẩu mới"
                      aria-label={`Mật khẩu mới cho ${user.displayName || user.email}`}
                    />
                    <Button
                      type="button"
                      onClick={() => onSaveUserPassword(user.id)}
                      disabled={!userPasswords[user.id] || updateUserPending}
                      variant="secondary"
                      size="sm"
                      className="h-9 shrink-0 px-2.5 text-xs whitespace-nowrap"
                      aria-label={`Lưu mật khẩu mới cho ${user.displayName || user.email}`}
                    >
                      {updateUserPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      Lưu
                    </Button>
                  </div>
                </article>
              );
            })}
            {authUsersLength === 0 ? (
              <div className="col-span-full">
                <EmptyState title="Chưa có tài khoản" description="Tạo tài khoản nội bộ để phân quyền thao tác hệ thống." className="m-3" />
              </div>
            ) : null}
          </div>
        </div>
        <PaginationControls
          currentPage={Math.min(usersPage, totalUserPages)}
          totalPages={totalUserPages}
          totalItems={sortedUsersLength}
          pageSize={usersPageSize}
          onPageChange={onUsersPageChange}
          compact
        />
      </SectionCard>
      {updateUserError ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {updateUserError}
        </p>
      ) : null}
    </>
  );
}

function RolePermissionSection({
  permissionsExpanded,
  selectedRole,
  selectedPermissions,
  selectedRoleLocked,
  roleUserCounts,
  rolePermissionCounts,
  permissionGroups,
  updateRolePermissionsPending,
  updateRolePermissionsError,
  canSaveSelectedRolePermissions,
  onPermissionsExpandedChange,
  onSelectedRoleChange,
  onTogglePermission,
  onSaveRolePermissions
}: {
  permissionsExpanded: boolean;
  selectedRole: UserRole;
  selectedPermissions: PermissionKey[];
  selectedRoleLocked: boolean;
  roleUserCounts: Record<UserRole, number>;
  rolePermissionCounts: Record<UserRole, number>;
  permissionGroups: PermissionGroups;
  updateRolePermissionsPending: boolean;
  updateRolePermissionsError: string | null;
  canSaveSelectedRolePermissions: boolean;
  onPermissionsExpandedChange: (expanded: boolean) => void;
  onSelectedRoleChange: (role: UserRole) => void;
  onTogglePermission: (role: UserRole, permission: PermissionKey) => void;
  onSaveRolePermissions: (role: UserRole) => void;
}) {
  return (
    <SectionCard
      title="Cấu hình phân quyền"
      description="Chủ CLB luôn có full quyền. Các vai trò còn lại có thể bật/tắt quyền theo nhu cầu vận hành."
      density="compact"
      actions={(
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPermissionsExpandedChange(!permissionsExpanded)}
          className="h-10 w-full whitespace-nowrap sm:w-auto"
          aria-expanded={permissionsExpanded}
        >
          {permissionsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {permissionsExpanded ? 'Thu gọn' : 'Mở rộng'}
        </Button>
      )}
    >
      {permissionsExpanded ? (
        <>
          <div className="grid gap-3 rounded-xl border border-border bg-surface-muted p-3 lg:grid-cols-[190px_minmax(280px,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <label className="block">
                <span className={formLabelClass}>Vai trò cấu hình</span>
                <Select
                  value={selectedRole}
                  onChange={(event) => onSelectedRoleChange(event.target.value as UserRole)}
                  className={`${formInputClass} h-10`}
                  aria-describedby="selected-role-summary"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>{getRoleLabel(role)}</option>
                  ))}
                </Select>
              </label>
            </div>
            <div id="selected-role-summary" className="min-w-0 rounded-lg border border-border bg-background px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={roleBadgeTone[selectedRole]}
                  className="px-2 py-1 text-[11px]"
                  title={`Role code: ${selectedRole}`}
                  aria-label={`Vai trò đang cấu hình ${getRoleLabel(selectedRole)}`}
                >
                  {getRoleLabel(selectedRole)}
                </StatusBadge>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {roleUserCounts[selectedRole]} tài khoản · {rolePermissionCounts[selectedRole]} quyền
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground" title={roleDescriptions[selectedRole]}>
                {roleDescriptions[selectedRole]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <StatusBadge
                tone={selectedRole === 'OWNER' ? 'success' : 'info'}
                className="h-10 rounded-lg px-3 tabular-nums"
                aria-label={selectedRole === 'OWNER' ? 'Chủ câu lạc bộ luôn có đầy đủ quyền' : `${selectedPermissions.length} quyền đang bật`}
              >
                {selectedRole === 'OWNER' ? 'Chủ CLB luôn full quyền' : `${selectedPermissions.length} quyền đang bật`}
              </StatusBadge>
              {selectedRole !== 'OWNER' ? (
                <Button
                  type="button"
                  onClick={() => onSaveRolePermissions(selectedRole)}
                  disabled={!canSaveSelectedRolePermissions || updateRolePermissionsPending}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-xs whitespace-nowrap"
                >
                  {updateRolePermissionsPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Lưu quyền
                </Button>
              ) : null}
            </div>
          </div>
          {updateRolePermissionsError ? (
            <p role="alert" className="mt-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {updateRolePermissionsError}
            </p>
          ) : null}
          <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(permissionGroups).map(([group, items]) => {
              const groupId = `permission-group-${toDomId(selectedRole)}-${toDomId(group)}`;
              const groupStatusId = `${groupId}-status`;
              return (
                <div
                  key={`${selectedRole}-${group}`}
                  className="rounded-xl border border-border bg-surface p-2.5 shadow-subtle"
                  role="group"
                  aria-labelledby={groupId}
                  aria-describedby={groupStatusId}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div id={groupId} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</div>
                      <div id={groupStatusId} className="mt-1 text-xs tabular-nums text-muted-foreground">
                        {countSelectedPermissions(items, selectedRole, selectedPermissions)} / {items.length} quyền đang bật
                      </div>
                    </div>
                    <StatusBadge
                      tone={selectedRoleLocked ? 'warning' : 'success'}
                      className="shrink-0 px-2 py-1 text-[10px]"
                      aria-label={selectedRoleLocked ? 'Nhóm quyền chỉ xem' : 'Nhóm quyền có thể sửa'}
                    >
                      {selectedRoleLocked ? 'Chỉ xem' : 'Có thể sửa'}
                    </StatusBadge>
                  </div>
                  <div className="grid gap-1.5">
                    {items.map((item) => {
                      const checked = selectedRole === 'OWNER' || selectedPermissions.includes(item.key);
                      return (
                        <label
                          key={`${selectedRole}-${item.key}`}
                          className={cn(
                            'flex min-h-10 items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                            checked ? 'border-info/45 bg-info-soft text-info' : 'border-border bg-background text-muted-foreground hover:bg-surface-muted',
                            selectedRoleLocked ? 'opacity-80' : 'cursor-pointer',
                            'motion-reduce:transition-none'
                          )}
                          title={`${item.label}: ${checked ? 'Bật' : 'Tắt'}`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={selectedRoleLocked}
                            onChange={() => onTogglePermission(selectedRole, item.key)}
                            aria-label={`${item.label} cho vai trò ${getRoleLabel(selectedRole)}`}
                          />
                          <span className="min-w-0 flex-1 break-words font-medium leading-5 text-foreground">{item.label}</span>
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
  );
}

function RoleNote({
  role,
  description,
  userCount,
  permissionCount
}: {
  role: UserRole;
  description: string;
  userCount: number;
  permissionCount: number;
}) {
  return (
    <div className="h-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-subtle">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-info">{getRoleLabel(role)}</div>
        <StatusBadge
          tone={role === 'OWNER' ? 'success' : 'neutral'}
          className="shrink-0 px-2 py-0.5 text-[10px]"
          title={`Role code: ${role}`}
        >
          {role === 'OWNER' ? 'Hệ thống' : 'Cấu hình'}
        </StatusBadge>
      </div>
      <p className="mt-1 truncate text-[11px] leading-4 text-muted-foreground" title={description}>{description}</p>
      <div className="mt-2 flex items-center divide-x divide-border rounded-lg border border-border bg-surface-muted text-xs">
        <div className="min-w-0 flex-1 px-2.5 py-1.5">
          <span className="font-semibold tabular-nums text-foreground">{userCount}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">tài khoản</span>
        </div>
        <div className="min-w-0 flex-1 px-2.5 py-1.5">
          <span className="font-semibold tabular-nums text-foreground">{permissionCount}</span>
          <span className="ml-1 text-[11px] text-muted-foreground">quyền</span>
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
