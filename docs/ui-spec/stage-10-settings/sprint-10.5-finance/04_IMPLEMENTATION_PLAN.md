# Finance Settings Implementation Plan

Status: IMPLEMENTED

## Preconditions

- `autoCreateCourtFeeTransaction` has an existing source and persistence in `badmin_app_settings`.
- `autoCreateShuttlecockUsageTransaction` has an existing source and persistence in `badmin_app_settings`.
- Currency display, default finance report period, payment method presentation, number format, and date format do not have Settings config sources.
- Revenue, expense, profit, category semantics, rounding, accounting rules, and payment status semantics are business logic and remain protected.

## Setting Preservation Matrix

| Setting | Current source | Used by | Default | Validation | Persistence | Handler | Required preservation |
|---|---|---|---|---|---|---|---|
| Auto court fee voucher | `settings.autoCreateCourtFeeTransaction` | Session completion payload | `false` | Existing boolean behavior | `localStorage` key `badmin_app_settings` | `setSetting('autoCreateCourtFeeTransaction', checked)` | Preserve key, default, handler, payload, and finance calculation behavior. |
| Auto shuttle usage voucher | `settings.autoCreateShuttlecockUsageTransaction` | Session completion payload | `true` | Existing boolean behavior | `localStorage` key `badmin_app_settings` | `setSetting('autoCreateShuttlecockUsageTransaction', checked)` | Preserve key, default, handler, payload, inventory movement, and finance linkage. |
| Currency/report period/payment method/date/number format | No Settings source | Finance page presentation/local state/helpers | Existing hard-coded behavior | Existing component/helper behavior | None | None | Do not create editable Settings UI. |
| Revenue/expense/profit/category/rounding/accounting semantics | Finance logic | Finance calculations | Existing logic | Protected | Existing data model | Existing services/helpers | Do not expose or modify as Settings. |

## Implementation

1. Improve only the existing finance settings section presentation.
2. Add a status summary for the two existing auto-voucher toggles.
3. Preserve the existing toggle components, checked state, handlers, defaults, localStorage persistence, and session completion payload behavior.
4. Do not add currency, report period, payment method, number/date format, rounding, or formula settings.

## Protected Files

- Finance calculation helpers.
- Finance page data mapping and local report filter behavior.
- API routes.
- Repositories.
- Services.
- Prisma/database files.
- Session completion logic.
- Inventory movement logic.
- Auth, permission, route, query key, mutation, and cache behavior.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
