# Current Module Audit

## Route And Page

- Route: `/users`.
- Page file: `src/app/users/page.tsx`.
- Access control: `requirePageUser('/users')`.
- Main component: `AuthUsersPanel`.

## Existing UI Areas

1. Role description cards.
2. Create user form.
3. User list with inline edit controls.
4. Pagination controls.
5. Role permission configuration section.
6. Role selector.
7. Permission group cards.
8. Permission checkboxes.
9. Mutation error messages.

## Existing Data Flow

```
UsersPage
-> AuthUsersPanel
-> useCurrentUser / useAuthUsers / useRolePermissions
-> auth-service
-> /api/auth/*
-> repositories
-> Prisma app_users / app_role_permissions / auth_sessions
```

## Current Strengths

- The screen already uses shared `Button`, `Input`, `Select`, `Checkbox`, `SectionCard`, `PaginationControls`, `StatusBadge`, and `EmptyState`.
- User list supports inline username, display name, role, status, and password update.
- Owner role is locked for permission editing.
- Role-permission configuration is already grouped by permission group.
- Pagination exists for users.
- Errors from mutations are shown.

## P0 Findings

None found in source audit that require immediate documentation-only blocker.

Potential P0 if future UI implementation changes:

- Accidentally changing role or permission values.
- Accidentally changing inline blur save behavior.
- Accidentally enabling non-owner users to save role permissions.
- Accidentally changing self-lock/self-demotion safeguards.
- Accidentally touching `/api/auth/**`, `src/lib/auth/**`, repositories, Prisma, or hooks.

## P1 Findings

- User list is a manually built grid table with fixed `min-w-[1120px]`; it can be harder to scan and maintain than shared DataTable.
- Inline edit behavior is implicit and may not communicate save-on-blur clearly.
- Create form fields are dense but not strongly grouped.
- Role notes, user list, and permission matrix have different visual density.
- Permission section uses text button labels for expand/collapse rather than the standardized compact icon treatment used elsewhere.
- Permission checkboxes are visually repeated per card and could benefit from stronger hierarchy and clearer disabled state.
- Empty/loading states are partial. The current list only shows empty state when `authUsers.length === 0`.
- Light/dark presentation depends on shared tokens but still contains module-specific density and grid choices.

## P2 Findings

- Role descriptions can be visually calmer.
- Permission group cards can be tightened.
- Pagination and table toolbar can be visually aligned with Finance/Inventory lists.
- Focus order should be browser-tested after any UI migration.
- Touch density should be validated on tablet.

## Capability Risks

- No dedicated user detail route exists. Sprint 9.3 must not invent one.
- No invitation flow exists. Stage 09 must not add invite UI.
- No profile edit flow exists. Sprint 9.8 must remain read-only/current-user presentation only.
- No role CRUD exists. Sprint 9.5 must remain fixed-role management presentation.
- No permission CRUD exists. Sprint 9.6 must only present existing permission keys.

## Protected Diff Requirement

Every implementation sprint must verify no diff in:

- `middleware.ts`
- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/auth-users-repository.ts`
- `src/repositories/role-permissions-repository.ts`
- `prisma/**`
