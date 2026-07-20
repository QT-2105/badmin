# Current Audit

Status: Complete

This sprint runs after UI implementation. It validates keyboard, focus, contrast, responsive behavior, and the finance regression checklist at source/contract level.

## Accessibility Audit

- Form labels: all visible form fields are wrapped by `<label>` elements or use explicit `aria-label` for report controls.
- Error association: title validation now sets `aria-invalid` and links to `finance-action-error`.
- Feedback regions: warning feedback uses `role="alert"`; success feedback uses `role="status"` and `aria-live="polite"`.
- Button accessible names: buttons include visible text (`Mở rộng`, `Thu gọn`, `Ghi phiếu`, `Tải lại`).
- Focus-visible: shared `Button`, `Input`, and `Select` primitives own focus styling; no custom override was added.
- Keyboard navigation: all controls remain native button/input/select/table controls.
- Dialog/drawer focus: not applicable because Finance currently does not use dialog or drawer in this module.
- Table semantics: transaction list uses shared `DataTable` with native table semantics, `<th scope="col">`, `aria-label`, and bounded horizontal scroll.
- Contrast: semantic shared primitives and status badges are used; no raw color-only status was added.
- Touch target: controls keep 40px+ operational target sizing through shared primitives and `h-11` submit.
- Reduced motion: no new motion was added; existing loading spinner remains unchanged.
- Status not color-only: transaction type badges include text labels (`Thu`, `Chi`, `Giảm thu`, `Giảm chi`).

## Regression Audit Summary

- Finance page source still uses the same hook, query params, local period state, filter function, sort state, pagination state, totals helper, and create mutation.
- No API, service, repository, Prisma, calculation, permission, route, or cache behavior changed.
- Some checklist items are not currently present in the Finance page source (`payment method`, `payment status`, `session relation` controls, row detail/edit/delete actions). These are recorded as N/A rather than implemented.

## Limitation

This sprint did not execute live browser/database transaction creation. Regression confirmation is based on source-level contract preservation plus lint, typecheck, production build, and DB schema automation guard.
