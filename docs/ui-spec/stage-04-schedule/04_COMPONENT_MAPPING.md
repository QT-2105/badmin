# Component Mapping

Status: Ready for implementation planning

Source code changed: No

## Existing Shared Component Inventory Relevant to Stage 04

Available:

- `PageShell`
- `PageHeader`
- `SectionHeader`
- `ToolbarCard`
- `SectionCard`
- `MetricCard`
- `NoticeCard`
- `Button`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `Switch`
- `FormSection`
- `Surface`
- `Card`
- `SectionSurface`
- `StatusBadge`
- `ActionMenu`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `WarningState`
- `SuccessState`
- `DisabledState`
- `Skeleton`
- `Separator`

Available but not expected for Stage 04:

- `DataTable`
- `Dialog`
- `Drawer`
- `FilterBar`
- `StatCard`
- `PaginationControls`

Not available as named primitives:

- `PageToolbar`
- `ConfirmDialog`

## Current to Target Mapping: `/schedule`

| Current UI | Current File | Target Primitive | Rule |
| --- | --- | --- | --- |
| Page wrapper | `PageShell` | Keep `PageShell` | No layout route change. |
| Page header | `PageHeader` | Keep `PageHeader` | Remove English eyebrow if present; keep title/description. |
| Create play date form surface | `SectionCard` | Prefer `FormSection` or keep `SectionCard` | No field, state, or submit changes. |
| Date input | `Input type="date"` | Keep `Input` | Preserve `min={today}`. |
| Title input | `Input` | Keep `Input` | Preserve optional title behavior. |
| Note input | `Input` | Keep `Input` or `Textarea` only if no behavior change | Prefer keep `Input` to avoid behavior drift. |
| Submit button | `Button` | Keep `Button` | Preserve `createPlayDate.isPending`. |
| Loading notice | `NoticeCard` | Optional `LoadingState` | Only if condition/message behavior unchanged. |
| Error notice | `NoticeCard tone="danger"` | Optional `ErrorState` | Preserve `error.message`. |
| Action error notice | `NoticeCard tone="warning"` | Optional `WarningState` | Preserve mutation error message. |
| Day card | Inline `article` | Local `DayCard` or `Surface` | Presentation only; no domain logic inside shared primitive. |
| Today/incomplete/past tags | `StatusBadge` | Keep `StatusBadge` | Tone only; no status logic changes. |
| Detail day action | `Link` + `Button` | Keep visible primary action | Preserve `/schedule/${item.id}`. |
| Delete day action | `Button variant="danger"` | Optional `ActionMenu` item | Preserve `removePlayDate`. |
| Session quick links | `Link` rows | Keep links, style as rows | Preserve `/sessions/${session.id}`. |
| Empty state | `EmptyState` | Keep `EmptyState` | Preserve condition. |

## Current to Target Mapping: `/schedule/[playDateId]`

| Current UI | Current File | Target Primitive | Rule |
| --- | --- | --- | --- |
| Page wrapper | `PageShell` | Keep `PageShell` | No route/layout behavior change. |
| Page header | `PageHeader` | Keep `PageHeader` | Preserve back action to `/schedule`. |
| Create session form surface | `SectionCard` | Prefer `FormSection` or keep `SectionCard` | No field, state, validation, or submit changes. |
| Session name/time/court/note fields | `Input` | Keep `Input` | Preserve input types and values. |
| Create session button | `Button` | Keep `Button` | Preserve pending state. |
| Loading/error/action notices | `NoticeCard` | Optional feedback primitives | Preserve all message sources. |
| Session card | Inline `article` | Local `SessionCard` / `SessionRow` or `Surface` | Presentation only. |
| Session status | plain text from `getSessionStatusLabel` | `StatusBadge` | Preserve label and normalized status logic. |
| Edit/delete buttons | `Button` | Optional `ActionMenu`; or keep visible buttons | Preserve `canModify` and handlers. |
| Detail action | `Link` + `Button` | Keep visible primary action | Preserve `/sessions/${session.id}`. |
| Inline edit form | Inline card/form | Keep inline; optional local `SessionEditForm` | No modal/drawer; no payload change. |
| Empty state | `EmptyState` | Keep `EmptyState` | Preserve condition. |

## Domain Component Creation Rules

Allowed only if it reduces presentation duplication:

- `DayCard`
- `SessionCard` or `SessionRow`

Preferred location if created:

- same file as caller, unless reuse between the two Schedule screens is genuinely simple and logic-free

Must not contain:

- fetch logic
- mutation logic
- permission logic
- date restriction logic
- sorting logic
- status lifecycle logic
- route construction beyond caller-provided hrefs

## Shared Component Non-Goals

Do not modify shared primitive APIs for Stage 04 unless a bug blocks implementation.

Do not add business-specific props such as:

- `playDate`
- `sessionStatus`
- `courtCount`
- `canManage`
- `isPastDate`
- `hasIncompleteSessions`

These must stay in Schedule components.

## Protected Mapping

No Stage 04 implementation should modify:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/auth/**`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/lib/badminton-store.ts`
- `prisma/**`
- runtime components
- session detail page

## Expected File Touches After Plan Acceptance

Likely implementation files:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Possible docs/report files:

- `docs/ui-spec/stage-04-schedule/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

Any other file touch requires a plan update before implementation.
