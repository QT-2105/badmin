# Implementation Plan

## Allowed Source Files

- `src/components/users/auth-users-panel.tsx`

## Documentation Files

- `docs/ui-spec/stage-09-users-permissions/sprint-9.10-accessibility-security-regression/01_CURRENT_AUDIT.md`
- `docs/ui-spec/stage-09-users-permissions/sprint-9.10-accessibility-security-regression/04_IMPLEMENTATION_PLAN.md`
- `docs/ui-spec/stage-09-users-permissions/sprint-9.10-accessibility-security-regression/05_ACCEPTANCE_CHECKLIST.md`
- `docs/ui-spec/stage-09-users-permissions/sprint-9.10-accessibility-security-regression/06_COMPLETION_REPORT.md`
- `docs/ui-spec/stage-09-users-permissions/sprint-9.10-accessibility-security-regression/07_SECURITY_REGRESSION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Protected Files

- `middleware.ts`
- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/**`
- `prisma/**`

## Preservation Table

| Area | Existing source | Required preservation |
| --- | --- | --- |
| User create/update | Existing mutation handlers in `AuthUsersPanel` | Handler identity, arguments, payload shape, and validation ownership unchanged |
| Role select | Existing `USER_ROLES` values | Role codes and option values unchanged |
| Status select | Existing `ACTIVE` / `DISABLED` values | Status values and update payload unchanged |
| Permission matrix | Existing permission definitions and role-permission state | Permission keys, checked state, disabled state, toggle handler, and save payload unchanged |
| Pagination | Existing local page/page-size state | Page-size options, slicing, and page-change behavior unchanged |
| Authorization | Existing middleware, API checks, hooks, and permission visibility | No security logic moved into shared UI or presentation layer |

## Implementation Tasks

1. Add table-like semantics to the existing grid-based user list without changing DOM data mapping or handlers.
2. Connect status helper text to the status select with `aria-describedby`.
3. Add permission-group semantics with labelled group and selected-count description.
4. Add reduced-motion utility classes to repeated presentation transitions.
5. Run protected diff and validation commands.
6. Record security regression results and deferred N/A capabilities.

## Risks

- Adding ARIA roles to a CSS grid can create confusing semantics if cells are incomplete; every visible row must keep matching `role="cell"` children.
- Permission matrix semantics must not change checkbox selected state or toggle behavior.
- Security regression is source-level only; browser/manual authorization testing remains deferred unless a dedicated test harness is available.
