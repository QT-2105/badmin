# Component Dependency Graph

## Users Page

```
src/app/users/page.tsx
-> AppShell
-> PageShell
-> PageHeader
-> AuthUsersPanel
```

## User List Flow

```
AuthUsersPanel
-> useAuthUsers
-> fetchAuthUsers
-> GET /api/auth/users
-> requireApiPermission('users.manage')
-> listAuthUsers
-> prisma.app_users
```

## Create / Update User Flow

```
AuthUsersPanel
-> useAuthUserMutations
-> createAuthUser / updateAuthUser service client
-> POST /api/auth/users or PATCH /api/auth/users/[userId]
-> requireApiPermission('users.manage')
-> createAuthUser / updateAuthUser repository
-> password hashing if password is present
-> prisma.app_users
```

## Role Permission Flow

```
AuthUsersPanel
-> useRolePermissions
-> fetchRolePermissions
-> GET /api/auth/role-permissions
-> requireApiPermission('users.manage')
-> listRolePermissions
-> prisma.app_role_permissions
```

```
AuthUsersPanel
-> useRolePermissionMutations
-> updateRolePermissions
-> PATCH /api/auth/role-permissions
-> requireApiUser(['OWNER'])
-> updateRolePermissions repository
-> prisma.app_role_permissions
```

## Auth Session Flow

```
LoginPageClient
-> useLoginMutation / useBootstrapOwnerMutation
-> auth-service
-> /api/auth/login or /api/auth/bootstrap
-> auth-users-repository
-> password/session helpers
-> auth_sessions cookie
```

## Runtime Security Boundary

Stage 09 must not modify runtime, finance, inventory, or session modules. Permission display can reference existing permission labels only.
