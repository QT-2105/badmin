# Current UI Audit

Status: Completed for planning

Source code changed: No

## Documents Read

- `docs/ui-spec/stage-01-foundation/*`
- `docs/ui-spec/stage-01.5-visual-consistency/*`
- `docs/ui-spec/stage-02-shared-components/*`
- `docs/ui-spec/stage-03-dashboard/*`
- `docs/ui-spec/stage-04-schedule/*`

## Source Audited

Primary Stage 04 source:

- `src/app/schedule/page.tsx`
- `src/app/schedule/[playDateId]/page.tsx`
- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Read-only behavior context:

- `src/hooks/use-play-dates.ts`
- `src/services/schedule-service.ts`
- `src/repositories/play-dates-repository.ts`
- `src/repositories/play-sessions-repository.ts`
- `src/types/domain.ts`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/lib/auth/permissions.ts`
- `src/components/ui/*`

## Route Audit

| Item | Source | Current Behavior | Stage 04 Rule |
| --- | --- | --- | --- |
| Route trang Lịch chơi | `src/app/schedule/page.tsx` | Requires page user for `/schedule`, wraps `SchedulePageClient` in `AppShell`. | Preserve. |
| Route Chi tiết ngày | `src/app/schedule/[playDateId]/page.tsx` | Awaits `playDateId`, requires page user for `/schedule/${playDateId}`, wraps `PlayDateDetailClient`. | Preserve. |
| Navigation to day detail | `Link href={`/schedule/${item.id}`}` | Opens Play Date detail. | Preserve route and click behavior. |
| Navigation to session detail | `Link href={`/sessions/${session.id}`}` | Opens Session detail from quick links and session cards. | Preserve route and click behavior. |

## Component Audit

### Trang Lịch Chơi: `SchedulePageClient`

| Required Area | Current Source Behavior | Shared Components Used | Finding |
| --- | --- | --- | --- |
| Component tạo ngày | Inline `<form>` inside `SectionCard`; fields: `playDate`, `title`, `note`; submit calls `createPlayDate.mutateAsync({ playDate, title, note })`. | `SectionCard`, `Input`, `Button` | P1: functional but dense; could use `FormSection` and clearer title without changing fields or handler. |
| Component card ngày | Inline `article` in grid; shows title/date/session count/tags/note/actions/expanded session links. | `StatusBadge`, `Button` | P1: card hierarchy and action grouping can be cleaner; card uses repeated raw border/ring combinations. |
| Status badge | Today, incomplete, past use `StatusBadge` tones. | `StatusBadge` | P2: semantics are good; placement can be more consistent. |
| Action sửa/xóa/xem chi tiết | Detail is visible button; delete is visible icon button when allowed; no edit day action currently exposed in UI. | `Button`, `Link` | P1: destructive action can move into `ActionMenu`; preserve delete handler and confirm. |
| Empty state | `EmptyState` when no play dates. | `EmptyState` | P2: acceptable; copy can become more operational. |
| Loading state | `NoticeCard` with text. | `NoticeCard` | P1: can migrate to `LoadingState` if message and timing unchanged. |
| Error state | `NoticeCard tone="danger"` with `error.message`. | `NoticeCard` | P1: can migrate to `ErrorState` if message source unchanged. |
| Responsive behavior | Card grid `lg:grid-cols-2`; create form `md:grid-cols-[160px_1fr_1fr_auto]`. | Tailwind grid | P1: desktop is okay; tablet/mobile density and action wrapping need QA. |
| Light/Dark mode | Mostly semantic tokens, but several manual ring/border/background combinations. | Tokens | P1: replace severe hard-coded combinations with primitives/tokens where safe. |

### Trang Chi Tiết Ngày: `PlayDateDetailClient`

| Required Area | Current Source Behavior | Shared Components Used | Finding |
| --- | --- | --- | --- |
| Component tạo ca | Inline `<form>` inside `SectionCard`; fields: `name`, `startTime`, `endTime`, `courtCount`, `note`; submit calls `createPlaySession`. | `SectionCard`, `Input`, `Button` | P1: layout works but visual hierarchy and button width can be cleaner; must preserve max-court validation. |
| Component card ca | Inline `article`; shows name, time, court count, status label, note, edit/delete/detail. | `Button`, `Link` | P1: status is plain text; should use `StatusBadge`; actions should be clearer. |
| Inline edit ca | Inline replacement form; fields match session create fields; save calls `updatePlaySession`. | `Input`, `Button` | P1: keep inline workflow; improve spacing, labels, and icon button accessibility. |
| Status badge | Not currently using `StatusBadge` for session status in session cards. | None | P1: adopt `StatusBadge` with existing status labels only. |
| Action sửa/xóa/xem chi tiết | Edit/delete disabled unless `canModify`; detail always available. | `Button`, `Link` | P1: primary action should be `Chi tiết ca`; edit/delete are secondary. Disabled contrast and labels need audit. |
| Empty state | `EmptyState` when no sessions. | `EmptyState` | P2: acceptable. |
| Loading state | `NoticeCard`. | `NoticeCard` | P1: can migrate to `LoadingState` if behavior unchanged. |
| Error state | `NoticeCard tone="danger"`. | `NoticeCard` | P1: can migrate to `ErrorState` if behavior unchanged. |
| Responsive behavior | Create/edit form uses custom grid; cards stack on mobile. | Tailwind grid | P1: number field and create button can wrap awkwardly; verify tablet/mobile. |
| Light/Dark mode | Mostly semantic tokens; edit form uses manual `border-info/25 bg-info-soft/50`. | Tokens | P2: acceptable but should align with `Surface`/`FormSection`. |

## Shared Components Currently Used

- `PageShell`
- `PageHeader`
- `SectionCard`
- `NoticeCard`
- `Button`
- `Input`
- `StatusBadge`
- `EmptyState`

## Shared Components Not Yet Applied

Available but not yet used in Stage 04 source:

- `FormSection`
- `Surface` / `Card`
- `ActionMenu`
- `LoadingState`
- `ErrorState`
- `WarningState`
- `Separator`

Available but not expected in Stage 04 unless specifically needed:

- `DataTable`
- `Dialog`
- `Drawer`
- `FilterBar`
- `StatCard`

Not currently available as standalone primitives:

- `PageToolbar` (closest current primitive: `ToolbarCard`)
- `ConfirmDialog` (current behavior uses `window.confirm`)

Stage 04 must not create missing primitives unless the implementation plan is explicitly updated and accepted.

## Hard-Coded Presentation Findings

| Source Pattern | Location | Risk | Direction |
| --- | --- | --- | --- |
| `rounded-xl border p-4 shadow-soft` repeated cards | Both Schedule files | P1 duplication | Migrate to `Surface`/`Card` or local domain card wrapper without logic. |
| `border-info/45 bg-surface ring-1 ring-info/15` | Day card today state | P1 visual inconsistency | Use tokenized tone rule; avoid overpowering entire card. |
| `border-warning/45 bg-surface ring-1 ring-warning/15` | Day card incomplete state | P1 visual inconsistency | Use subtle warning marker/badge/border only. |
| `border-info/25 bg-info-soft` | Expanded session links | P2 polish | Keep route; make compact row affordance. |
| `border-info/25 bg-info-soft/50` | Inline edit session | P2 polish | Use `FormSection` or `Surface` tone if safe. |
| Icon-only edit/delete/save/cancel buttons | Both Schedule files | P1 accessibility | Add `aria-label`/visible hierarchy without handler change. |

## Copy-Paste / Primitive Duplication

- Create play date and create session forms both use manual label/input grid patterns.
- Session create and inline edit forms repeat almost the same field layout.
- Day card and session card use custom card styling instead of a shared `Surface` wrapper.
- Loading/error notices use `NoticeCard` instead of Stage 02 feedback states.

These are presentation-level duplications only. They must not be collapsed into business-aware shared components.

## Protected Files

Absolute no-edit files for Stage 04:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/use-play-dates.ts`
- `src/hooks/use-auth.ts`
- `src/hooks/use-app-settings.ts`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/types/domain.ts`
- `prisma/**`
- `src/components/schedule/session-detail-client.tsx`
- runtime components and runtime hooks/services

Allowed implementation candidates after plan acceptance:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Docs/progress files may be updated for reporting.

## Business Logic Risk Register

Do not change:

- `usePlayDates()` query key or fetch timing.
- `usePlayDate(playDateId)` query key or fetch timing.
- `useScheduleMutations()` invalidation behavior.
- `createPlayDate.mutateAsync({ playDate, title, note })`.
- `deletePlayDate.mutateAsync(id)`.
- `createPlaySession.mutateAsync({ id: playDateId, payload: { name, startTime, endTime, courtCount, note } })`.
- `updatePlaySession.mutateAsync({ id: editingSessionId, payload: editForm })`.
- `deletePlaySession.mutateAsync(session.id)`.
- `window.confirm` semantics unless explicitly approved.
- `isPastDateInput` and `todayDateInput` usage.
- `hasPermission(currentUser, 'schedule.manage')` usage.
- `normalizeSessionStatus(session.status) === 'PENDING'` modification rule.
- Date sorting newest first.
- Session sorting earliest start first.
- Routes to `/schedule/[playDateId]` and `/sessions/[sessionId]`.

## Priority Classification

### P0

No P0 blocker found in source audit.

Potential P0 stop condition: any proposed UI change requiring API, route, permission, mutation, validation, or runtime changes.

### P1

- Create forms are visually dense and not yet using `FormSection`.
- Day cards and session cards use repeated custom card presentation.
- Session status is plain text in session cards rather than `StatusBadge`.
- Action hierarchy is not clear enough: detail should be primary; edit/delete secondary.
- Icon-only buttons need explicit accessible labels.
- Loading/error states can align with Stage 02 feedback primitives if behavior stays unchanged.
- Responsive form/button layout needs tablet/mobile verification.

### P2

- Copy can be shortened.
- Hover/focus affordance on quick session links can be polished.
- Empty states can use more operational descriptions.
- Tone density for today/incomplete/past can be refined.

## Audit Decision

Decision: PASS WITH NOTES for implementation planning.

No source code should be changed until the Stage 04 implementation plan is accepted.
