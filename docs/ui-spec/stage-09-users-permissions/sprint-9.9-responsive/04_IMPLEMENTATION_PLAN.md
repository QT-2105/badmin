# Implementation Plan

1. Adjust responsive classes only in `src/components/users/auth-users-panel.tsx`.
2. Preserve table/list data, visible columns, inline controls, and actions.
3. Keep user table and permission matrix overflow inside their own containers or responsive grids.
4. Avoid page-level horizontal overflow by keeping the table scroll container bounded.
5. Keep touch targets near 40px minimum.
6. Add full-value `title` attributes to long inline-edit fields where it does not change data or handlers.
7. Keep important actions visible and reachable at every breakpoint.
8. Run lint, typecheck, build, DB schema guard, and protected diff.

## Allowed Source File

- `src/components/users/auth-users-panel.tsx`

## Protected Files

- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/**`
- `prisma/**`

## Preserved Behavior

- Data source unchanged.
- Handler signatures unchanged.
- Permission checks unchanged.
- Role mapping unchanged.
- Status transitions unchanged.
- Validation unchanged.
- Payloads unchanged.
- Query and mutation behavior unchanged.
- Security behavior unchanged.

## Completion Criteria

- Tablet landscape remains usable without global page overflow.
- Desktop remains dense but readable.
- Tablet portrait and mobile rely on internal table scroll, not page-level overflow.
- Email/display-name long values have a non-mutating way to inspect full value.
- Permission matrix remains readable and touch-friendly.
- Validation passes.
