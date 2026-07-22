# Allowed And Protected Files By Sprint

## Global Protected Files For Every Sprint

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- business calculation helpers
- domain types when enum/data contract would change

## Sprint Map

| Sprint | Allowed files | Protected within sprint |
| --- | --- | --- |
| 11.0 Audit Baseline | `docs/ui-spec/stage-11-product-ux-hardening/**` | All source files. |
| 11.1 App Shell Global Layout | `src/components/app-shell.tsx`, shared layout docs | Root nav labels/routes, auth/session behavior. |
| 11.2 Shared Components | `src/components/ui/**` | Component APIs unless backward-compatible optional presentation props. |
| 11.3 Dashboard Schedule | Dashboard and schedule presentation files | Data fetching, CRUD, route params, validation, date/session rules. |
| 11.4 Session Runtime | Session detail and runtime presentation files | Runtime store, handlers, queue, pairing, court/match lifecycle, completion semantics. |
| 11.5 Finance Inventory | Finance/inventory presentation files | Calculations, payloads, movement/transaction semantics. |
| 11.6 Users Settings | Users/settings presentation files | Auth, permission, role/status values, settings persistence. |
| 11.7 Dialog Drawer Confirmations | `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx`, approved presentation call sites | Destructive handler semantics and runtime leave guard. |
| 11.8 Forms Feedback | Presentation call sites and shared feedback primitives | Validation rules, field names, submit payloads. |
| 11.9 DataTable Overflow | `src/components/ui/data-table.tsx`, presentation call sites | Sorting/filtering/data order. |
| 11.10 Accessibility Keyboard | Presentation files only | Logic-based visibility and authorization. |
| 11.11 Responsive Device QA | Docs and presentation-only fixes approved from QA | Workflow and data contracts. |
| 11.12 Completion | Docs only | All source files. |

