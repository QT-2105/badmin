# Implementation Plan

## Allowed Source File

- `src/components/users/auth-users-panel.tsx`

## Protected Files

- `src/app/api/auth/users/**`
- `src/repositories/auth-users-repository.ts`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `prisma/**`

## Steps

1. Preserve all action handlers and arguments.
2. Preserve status option values: `ACTIVE`, `DISABLED`.
3. Preserve status select visibility and immediate `onChange` behavior.
4. Preserve password save trigger and disabled condition.
5. Preserve role-permission save visibility and disabled condition.
6. Improve status badge hierarchy, helper copy, and light/dark readability.
7. Improve password action presentation, loading state, and accessible labels.
8. Improve error feedback presentation only.
9. Do not add action menu, delete/remove, invite, lock/unlock, confirmation, or extra transition logic.
10. Run lint, typecheck, build, DB schema guard, and protected diff.

## Completion Criteria

- Status semantics unchanged.
- Action visibility unchanged.
- Handler arguments unchanged.
- Payloads unchanged.
- Owner/self/last-admin protections remain server-side and unchanged.
- Missing actions remain Out of Scope.
