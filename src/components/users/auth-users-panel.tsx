'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthUserMutations, useAuthUsers, useCurrentUser, useRolePermissionMutations, useRolePermissions } from '@/hooks/use-auth';
import { PERMISSION_DEFINITIONS, USER_ROLES, type PermissionKey, type UserRole, type UserStatus } from '@/lib/auth/permissions';
import {
  AuthUsersPanelView,
  type AuthUserRow,
  type NewAuthUserForm,
  type PermissionGroups
} from './auth-users-presentation';
import type { PageSize } from '@/components/ui/pagination-controls';

const emptyNewUser: NewAuthUserForm = { email: '', displayName: '', password: '', role: 'OPERATOR' };

export function AuthUsersPanel() {
  const { data: currentUser } = useCurrentUser();
  const { data: authUsers = [] } = useAuthUsers();
  const { data: rolePermissions = [] } = useRolePermissions();
  const authMutations = useAuthUserMutations();
  const roleMutations = useRolePermissionMutations();
  const [newUser, setNewUser] = useState<NewAuthUserForm>(emptyNewUser);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [draftPermissions, setDraftPermissions] = useState<Record<UserRole, PermissionKey[]>>({} as Record<UserRole, PermissionKey[]>);
  const [usersPageSize, setUsersPageSize] = useState<PageSize>(10);
  const [usersPage, setUsersPage] = useState(1);
  const [permissionsExpanded, setPermissionsExpanded] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('MANAGER');
  const permissionGroups = useMemo(() => {
    return PERMISSION_DEFINITIONS.reduce<PermissionGroups>((groups, item) => {
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
    setNewUser(emptyNewUser);
  }

  async function handleUpdateUser(userId: string, payload: { email?: string; displayName?: string; role?: UserRole; status?: UserStatus; password?: string }) {
    await authMutations.updateUser.mutateAsync({ userId, payload });
    if (payload.password !== undefined) {
      setUserPasswords((current) => ({ ...current, [userId]: '' }));
    }
  }

  function handleUserEmailBlur(user: AuthUserRow, value: string) {
    if (value !== user.email) void handleUpdateUser(user.id, { email: value });
  }

  function handleUserDisplayNameBlur(user: AuthUserRow, value: string) {
    if (value !== user.displayName) void handleUpdateUser(user.id, { displayName: value });
  }

  function handleUserRoleChange(user: AuthUserRow, role: UserRole) {
    void handleUpdateUser(user.id, { role });
  }

  function handleUserStatusChange(user: AuthUserRow, status: UserStatus) {
    void handleUpdateUser(user.id, { status });
  }

  function handleUserPasswordChange(userId: string, value: string) {
    setUserPasswords((current) => ({ ...current, [userId]: value }));
  }

  function handleSaveUserPassword(userId: string) {
    void handleUpdateUser(userId, { password: userPasswords[userId] ?? '' });
  }

  function handleUsersPageSizeChange(pageSize: PageSize) {
    setUsersPageSize(pageSize);
    setUsersPage(1);
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
    <AuthUsersPanelView
      newUser={newUser}
      userPasswords={userPasswords}
      visibleUsers={visibleUsers}
      authUsersLength={authUsers.length}
      sortedUsersLength={sortedUsers.length}
      usersPageSize={usersPageSize}
      usersPage={usersPage}
      totalUserPages={totalUserPages}
      permissionsExpanded={permissionsExpanded}
      selectedRole={selectedRole}
      selectedPermissions={selectedPermissions}
      selectedRoleLocked={selectedRoleLocked}
      roleUserCounts={roleUserCounts}
      rolePermissionCounts={rolePermissionCounts}
      permissionGroups={permissionGroups}
      createUserPending={authMutations.createUser.isPending}
      createUserError={authMutations.createUser.error?.message ?? null}
      updateUserPending={authMutations.updateUser.isPending}
      updateUserError={authMutations.updateUser.error?.message ?? null}
      updateRolePermissionsPending={roleMutations.updateRolePermissions.isPending}
      updateRolePermissionsError={roleMutations.updateRolePermissions.error?.message ?? null}
      canSaveSelectedRolePermissions={currentUser?.role === 'OWNER' && selectedRole !== 'OWNER'}
      onNewUserChange={setNewUser}
      onCreateUser={() => void handleCreateUser()}
      onUsersPageSizeChange={handleUsersPageSizeChange}
      onUsersPageChange={setUsersPage}
      onUserEmailBlur={handleUserEmailBlur}
      onUserDisplayNameBlur={handleUserDisplayNameBlur}
      onUserRoleChange={handleUserRoleChange}
      onUserStatusChange={handleUserStatusChange}
      onUserPasswordChange={handleUserPasswordChange}
      onSaveUserPassword={handleSaveUserPassword}
      onPermissionsExpandedChange={setPermissionsExpanded}
      onSelectedRoleChange={setSelectedRole}
      onTogglePermission={togglePermission}
      onSaveRolePermissions={(role) => void saveRolePermissions(role)}
    />
  );
}
