# Current Audit

## Source

- Page integration: `src/components/users/auth-users-panel.tsx`
- Presentation layer: `src/components/users/auth-users-presentation.tsx`
- Auth and permission definitions: `src/lib/auth/permissions.ts`
- Hooks and mutations: `src/hooks/use-auth.ts`

## Existing Workflow

- `AuthUsersPanel` owns current-user query, users query, role-permission query, mutations, create-user form state, password draft state, selected role, pagination and role-permission draft state.
- `AuthUsersPanelView` and child sections receive data, state and callbacks as props.
- User update behavior is still blur/change driven by the parent handlers.
- Role permission editing still uses existing selected role and draft permission handlers.

## Findings

| Area | Finding | Priority | Decision |
| --- | --- | --- | --- |
| User list | Dense inline edit table is functional but role/status scanability can improve. | P1 | Polish presentation only. |
| Long identity | Long username or display name can be hard to inspect in a dense table. | P1 | Preserve values and add title/truncate-friendly presentation. |
| Role summary | Role count values should be easier to scan. | P2 | Use tabular numbers and clearer labels. |
| Status | Status already has text labels; add accessible/status context. | P1 | Preserve status values and labels. |
| Permission matrix | Permission row focus and selected state can be clearer. | P1 | Add focus-visible containment and selected-state text/title. |
| Missing capabilities | Invitation, user deletion, lock/unlock and password reset flows are not part of this sprint. | P0 | Do not create capability. |

## Protected Behavior Observed

- User sorting remains in `AuthUsersPanel`.
- Create-user payload remains in `AuthUsersPanel`.
- User update payload remains in `AuthUsersPanel`.
- Role-permission payload remains in `AuthUsersPanel`.
- OWNER permission lock remains in `AuthUsersPanel`.
- Permission definitions remain in `src/lib/auth/permissions.ts`.
