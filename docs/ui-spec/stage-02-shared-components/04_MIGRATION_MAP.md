# Migration Map

## Migration Principles

Migrate by replacing local presentation shells with shared components while keeping business data and handlers exactly where they are.

Do not migrate a screen if the migration requires:

- changing data shape
- changing mutation timing
- changing validation
- changing table columns
- changing route targets
- changing permission checks
- changing runtime scheduling semantics

## Target Migration Order

1. Shared component files only
2. Low-risk readonly tables/lists
3. Finance and Inventory list shells
4. Users list shell
5. Settings form sections
6. Session detail confirmation dialog only
7. Runtime: audit/proposal only unless owner approves

## Screen Mapping

| Screen | Current Pattern | Stage 02 Target | Risk | Notes |
|---|---|---|---|---|
| Dashboard | MetricCard plus custom recent sessions table | `StatCard`, `DataTable` readonly | SAFE | Do not change dashboard summary API or calculations. |
| Lich choi | Play-date cards and expand controls | no Stage 02 forced migration | LOW | Cards are acceptable after Stage 01.5; do not redesign. |
| Chi tiet ngay | Session list cards | optional `ActionMenu` later | LOW | Do not change session CRUD rules. |
| Chi tiet ca | Dense completion/player workflow | `Dialog` for confirm, `FormSection` later | CAUTION | Split into small tasks; no payment/completion logic edits. |
| Dieu phoi | Runtime protected UI | deferred | PROTECTED | Requires explicit owner approval. |
| Thu chi | Custom transaction list and filters | `FilterBar`, `DataTable`, feedback states | SAFE/CAUTION | Do not change adjustment logic or transaction payloads. |
| Kho cau | Custom product table and movement list | `FilterBar`, `DataTable`, feedback states | SAFE/CAUTION | Do not change movement semantics or stock math. |
| Nguoi dung | Editable grid/list | `DataTable` with editable cells | CAUTION | Do not change role/permission behavior. |
| Cai dat | Collapsible settings panels | `FormSection` | SAFE | Do not change local settings/S3/reset behavior. |

## Component-To-File Migration Map

| Component | Candidate Files | Guardrail |
|---|---|---|
| `DataTable` | `dashboard-page-client.tsx`, `finance-page-client.tsx`, `inventory-page-client.tsx`, `auth-users-panel.tsx` | Preserve columns and row actions. |
| `FilterBar` | `dashboard-page-client.tsx`, `finance-page-client.tsx`, `inventory-page-client.tsx` | Preserve report period state and handlers. |
| `StatCard` | `dashboard-page-client.tsx`, `finance-page-client.tsx`, `inventory-page-client.tsx`, runtime later | No calculations inside component. |
| `FormSection` | `settings-page-client.tsx`, finance/inventory create forms later | Preserve submit handlers and validation. |
| `ActionMenu` | future row/card actions | Permission checks remain outside component. |
| `Dialog` | `session-detail-client.tsx` completion confirm, destructive setting confirms later | Preserve confirmation semantics and payload. |
| `Drawer` | future mobile secondary workflows | Do not alter navigation or runtime UX without approval. |
| feedback states | all screens | Do not hide critical operational warnings. |

## Deferred Migration

Runtime remains deferred:

- court management
- next match suggestions
- player queue
- runtime full player list
- match history overlay
- runtime top bar

Reason: these are protected operator workflows where layout and touch affordance are part of runtime semantics.

