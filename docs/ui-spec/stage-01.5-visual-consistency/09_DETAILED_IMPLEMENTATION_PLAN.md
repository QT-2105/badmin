# Stage 01.5 Detailed Implementation Plan

Status: `PLAN ONLY`

Last updated: 2026-07-14

This plan is based on the completed Stage 01.5 visual consistency audit.

No source code should be changed until this plan is reviewed and accepted.

## 0. Stage Boundary

Stage 01.5 is limited to visual consistency.

Allowed:

- token replacement
- shared primitive adoption
- typography normalization
- spacing/radius/border/shadow normalization
- button/input/badge/card consistency
- loading/empty/disabled/hover/focus consistency
- light/dark parity fixes

Not allowed in Stage 01.5:

- Dashboard redesign
- Runtime redesign
- module-specific layout redesign
- business workflow changes
- API changes
- database changes
- Prisma changes
- repository/service changes
- business hook changes
- Zustand runtime changes
- permission behavior changes
- finance/inventory formula changes
- route changes

## 1. Files To Modify

Only these files are candidates for Stage 01.5 implementation.

### Shared Primitive / Presentation Support

| File | Purpose | Allowed Change |
|---|---|---|
| `src/components/ui/status-badge.tsx` | Centralize semantic badge styling. | Add/adjust tone variants only. No business labels. |
| `src/components/ui/surface.tsx` | Centralize surface/card primitives. | Add safe variants if needed. |
| `src/components/ui/form.tsx` | Shared form primitives. | Add className-compatible support only. |
| `src/components/ui/feedback.tsx` | Empty/loading/skeleton primitives. | Add visual variants only. |
| `src/components/ui/button.tsx` | Shared button variants. | Minor visual token/radius/focus updates only. |
| `src/components/ui/page-layout.tsx` | Page shell, headers, cards, metrics. | Token/typography/radius/focus cleanup only. |
| `src/components/ui/pagination-controls.tsx` | Shared pagination visual consistency. | Visual-only refinement. |
| `src/app/globals.css` | Design tokens and global visual helpers. | Token/helper additions only. No layout resets that change behavior. |
| `tailwind.config.ts` | Token registration. | Add semantic tokens only. No broad theme rewrite. |

### Low-Risk Screens

| File | Area | Allowed Change |
|---|---|---|
| `src/components/dashboard/dashboard-page-client.tsx` | Dashboard | Tokenize chart colors only. No layout redesign. |
| `src/components/finance/finance-page-client.tsx` | Thu chi | Badge/list/form visual consistency only. No calculation or payload changes. |
| `src/components/inventory/inventory-page-client.tsx` | Kho cau | Badge/list/tab/form visual consistency only. No movement/stock logic changes. |
| `src/components/users/auth-users-panel.tsx` | Nguoi dung / Phan quyen | Form/button/badge visual consistency only. No role/permission behavior changes. |
| `src/components/settings/settings-page-client.tsx` | Cai dat | Card/button/message visual consistency only. No S3/settings behavior changes. |
| `src/components/auth/login-page-client.tsx` | Login | Surface/form visual consistency only. No auth logic changes. |

### Schedule Screens

| File | Area | Allowed Change |
|---|---|---|
| `src/components/schedule/schedule-page-client.tsx` | Lich choi | Card/badge/button visual consistency only. No CRUD rule changes. |
| `src/components/schedule/play-date-detail-client.tsx` | Chi tiet ngay | Header/card/form visual consistency only. No session creation/update/delete behavior changes. |
| `src/components/schedule/session-detail-client.tsx` | Chi tiet ca | Token/form/card/modal visual consistency only. High caution. No session completion, player payment, or calculation changes. |

### Shared Non-Business Display Components

| File | Area | Allowed Change |
|---|---|---|
| `src/components/player/player-quick-view.tsx` | Player quick modal | Surface/contrast/overflow/focus only. No displayed fields or close behavior changes. |
| `src/components/player/player-avatar.tsx` | Player avatar | Token/size/contrast only. No avatar source logic changes. |
| `src/components/player/player-fee-input.tsx` | Fee picker | Dropdown visual/focus/close consistency only. No fee values or update behavior changes. |
| `src/components/branding/brand-logo.tsx` | Brand logo | Crop/fit/token polish only. No upload/storage behavior changes. |

## 2. Read-Only Files

These files may be read to verify contracts, props, and behavior, but must not be modified in Stage 01.5.

### Domain Types / Helpers

- `src/types/domain.ts`
- `src/lib/session-status.ts`
- `src/lib/player-labels.ts`
- `src/lib/date-format.ts`
- `src/lib/utils.ts`
- `src/lib/localSessions.ts`
- `src/lib/auth/permissions.ts`

### Hooks

- `src/hooks/use-auth.ts`
- `src/hooks/use-branding.ts`
- `src/hooks/use-dashboard-summary.ts`
- `src/hooks/use-finance.ts`
- `src/hooks/use-inventory.ts`
- `src/hooks/use-play-dates.ts`
- `src/hooks/use-play-sessions.ts`
- runtime hydration/sync hooks

### Page Entrypoints

Page files can be read to understand composition, but should not be edited unless a screen cannot adopt visual consistency through its client component.

- `src/app/dashboard/page.tsx`
- `src/app/schedule/page.tsx`
- `src/app/schedule/[playDateId]/page.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `src/app/sessions/[sessionId]/runtime/page.tsx`
- `src/app/finance/page.tsx`
- `src/app/inventory/page.tsx`
- `src/app/users/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/login/page.tsx`

## 3. Protected Files Not To Modify

These files are explicitly out of scope for Stage 01.5 source implementation unless the owner gives a separate approval.

### Runtime Protected Files

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime hydration/sync hooks
- runtime repositories
- `/api/runtime/snapshot`

### Backend / Data / Business Protected Files

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/finance-calculation.ts`
- `src/lib/finance-calculations.ts`
- inventory movement calculation helpers
- session completion business logic
- auth/session/permission business logic

## 4. Component Migration Targets

### Badge Migration

| Current Pattern | Target | Files |
|---|---|---|
| `TransactionBadge` local color map | domain wrapper around `StatusBadge` | `src/components/finance/finance-page-client.tsx` |
| `MovementBadge` local color map | domain wrapper around `StatusBadge` | `src/components/inventory/inventory-page-client.tsx` |
| schedule status chips | `StatusBadge` wrapper | `src/components/schedule/schedule-page-client.tsx` |
| user role/status chips | `StatusBadge` wrapper | `src/components/users/auth-users-panel.tsx` |

Runtime tags are audited but not migrated in Stage 01.5 unless separately approved.

### Form Migration

| Current Pattern | Target | Files |
|---|---|---|
| native `input` with `formInputClass` | `Input` where event behavior is identical | finance, inventory, users, settings, schedule |
| native `select` with `formInputClass` | `Select` where event behavior is identical | finance, inventory, users, settings, schedule |
| native `textarea` with `formInputClass` | `Textarea` where event behavior is identical | finance, inventory, settings, schedule |
| native checkbox in role matrix | `Checkbox` | `src/components/users/auth-users-panel.tsx` |

Session detail form migration is high caution and must be split into smaller tasks.

### Button Migration

| Current Pattern | Target | Files |
|---|---|---|
| local save/action buttons | `Button` variants | users, settings, schedule |
| local danger buttons | `Button variant="danger"` or equivalent existing destructive variant | settings, schedule |
| local icon buttons | existing `Button` size/variant if available; otherwise defer | app shell, users, settings |

Runtime buttons are not migrated in Stage 01.5.

### Surface / Card Migration

| Current Pattern | Target | Files |
|---|---|---|
| custom section shell | `SectionCard` | play date detail, settings, users |
| custom modal shell | `Surface` / existing card primitive | player quick view, login |
| custom toolbar shell | `ToolbarCard` | safe non-runtime report filters |

No Dashboard or Runtime layout redesign is included.

### Feedback Migration

| Current Pattern | Target | Files |
|---|---|---|
| ad hoc empty text | `EmptyState` or `NoticeCard` | users, settings, finance, inventory |
| ad hoc loading message | `Skeleton` or `NoticeCard` | login/settings/users where present |
| ad hoc danger/warning text | semantic `NoticeCard` tone | settings, session detail |

## 5. Token Replacement Only Changes

These changes must not alter DOM structure beyond class replacement.

| Area | Replacement Type |
|---|---|
| hard-coded slate/white borders | `border-border`, `border-input`, `border-muted` tokens |
| hard-coded surface backgrounds | `bg-surface`, `bg-surface-muted`, `bg-background` |
| hard-coded hover backgrounds | `hover:bg-surface-hover`, existing hover tokens |
| hard-coded focus rings | `focus-visible:ring-focus/25` or existing focus token |
| hard-coded danger colors | `text-danger`, `bg-danger-soft`, `border-danger/25` |
| hard-coded warning colors | `text-warning`, `bg-warning-soft`, `border-warning/30` |
| hard-coded success/income colors | `text-success`, `bg-success-soft`, `border-success/25` |
| hard-coded info/cyan colors | `text-info`, `bg-info-soft`, `border-info/25` |
| chart colors | chart semantic tokens only; no chart layout changes |

## 6. High-Risk Changes

These are allowed only as tiny visual-only patches with review after each patch.

| Risk | File/Area | Why Risky | Stage 01.5 Handling |
|---|---|---|---|
| High | `src/components/schedule/session-detail-client.tsx` | Dense operational workflow: player CRUD, payment, completion info, session status. | Split into sub-tasks. No logic edits. |
| High | `src/components/player/player-quick-view.tsx` | Used by session/runtime player inspection. | Visual surface/focus only. |
| High / Protected | runtime files | Scheduling semantics are protected. | Do not implement in Stage 01.5 without explicit owner approval. |
| Medium | `src/components/finance/finance-page-client.tsx` | Finance form/list is tied to operational reports. | Visual-only; no payload/calculation changes. |
| Medium | `src/components/inventory/inventory-page-client.tsx` | Inventory movement UI is tied to stock correctness. | Visual-only; no movement/calc changes. |
| Medium | `src/components/users/auth-users-panel.tsx` | Permission UI is security-sensitive. | Do not change role keys, permission keys, or mutation behavior. |

## 7. Reviewable Task Sequence

Each task must be independently reviewable and rollbackable.

### Task 01 - Lock Foundation Contract

Files to modify:

- `src/components/ui/status-badge.tsx`
- `src/components/ui/surface.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/feedback.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/page-layout.tsx`
- `src/app/globals.css`
- `tailwind.config.ts`

Scope:

- add only missing semantic visual variants needed by audited screens
- no screen migration yet

Commands:

- `npm run lint`
- `npm run typecheck`

Stop if:

- primitives require prop changes in existing consumers
- token changes alter runtime layout globally
- type errors appear outside touched UI files

### Task 02 - Finance Badges And List Visuals

Files to modify:

- `src/components/finance/finance-page-client.tsx`
- shared badge primitive only if Task 01 did not cover needed tones

Scope:

- migrate transaction badges to semantic wrapper
- normalize list header/row visual tokens
- keep filters, pagination, transaction data, adjustment logic unchanged

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- transaction totals change
- form submit payload changes
- transaction type/category mapping changes

### Task 03 - Inventory Badges, Tabs, And List Visuals

Files to modify:

- `src/components/inventory/inventory-page-client.tsx`
- shared badge primitive only if needed

Scope:

- migrate movement badges to semantic wrapper
- normalize import/export tab visuals
- normalize movement list headers and row tokens
- no stock movement logic changes

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- movement type handling changes
- quantity or price calculations change
- negative-stock protection is touched

### Task 04 - Users And Role Permission Visuals

Files to modify:

- `src/components/users/auth-users-panel.tsx`
- shared form/badge primitives only if needed

Scope:

- migrate inputs/selects/checkboxes/buttons to shared primitives where behavior is identical
- normalize role/status visual chips
- preserve pagination layout

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- role keys or permission keys change
- user create/update payload changes
- auth/permission hooks need edits

### Task 05 - Settings Visual Consistency

Files to modify:

- `src/components/settings/settings-page-client.tsx`
- shared card/button/notice primitives only if needed

Scope:

- normalize collapsible settings card visuals
- normalize branding upload/delete buttons
- normalize danger reset warnings/messages
- no S3/local settings behavior changes

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- settings persistence changes
- S3 deletion behavior changes
- reset behavior changes

### Task 06 - Schedule Page Visual Consistency

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`

Scope:

- normalize date cards, chips, expand/collapse button visuals
- preserve button semantics and route destinations
- no Dashboard or Runtime redesign

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- play date CRUD restrictions change
- past-date readonly rules change
- route navigation changes

### Task 07 - Play Date Detail Visual Consistency

Files to modify:

- `src/components/schedule/play-date-detail-client.tsx`

Scope:

- normalize page header, create-session card, session row visuals
- no session CRUD behavior changes
- no runtime button reintroduction or route changes

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- court count validation changes
- session edit/delete restrictions change
- session route navigation changes

### Task 08 - Player Quick View Visual Consistency

Files to modify:

- `src/components/player/player-quick-view.tsx`
- `src/components/player/player-avatar.tsx` only if needed for contrast/fit

Scope:

- normalize modal surface, overlay, focus, overflow, light/dark colors
- keep displayed fields and close behavior unchanged

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- player data fields change
- click outside/close behavior changes
- runtime imports require behavior changes

### Task 09 - Session Detail Visual Consistency, Part 1

Files to modify:

- `src/components/schedule/session-detail-client.tsx`

Scope:

- header and summary card token replacement only
- no player form/list changes yet

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- start/complete/session status behavior changes
- completion totals change
- navigation changes

### Task 10 - Session Detail Visual Consistency, Part 2

Files to modify:

- `src/components/schedule/session-detail-client.tsx`
- shared form primitives only if already stable

Scope:

- completion information card, note area, add-player form, player list visual consistency
- do not change field names, values, submit handlers, payment state, or fee values

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- player create/edit/delete payload changes
- payment type/state behavior changes
- completion info update behavior changes
- session readonly completed state changes

### Task 11 - Login Visual Consistency

Files to modify:

- `src/components/auth/login-page-client.tsx`

Scope:

- normalize auth surface, form, button, error state visuals
- no auth/session behavior changes

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Stop if:

- login payload changes
- redirect behavior changes
- session expiry handling changes

### Task 12 - Final Visual QA And Guard

Files to modify:

- none unless fixing review notes from previous tasks

Commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

Manual review:

- dark mode
- light mode
- tablet landscape
- smartphone portrait
- keyboard focus
- loading/empty/disabled states
- horizontal scroll areas

Stop if:

- any protected file changed unexpectedly
- build fails
- a visual patch requires data/model/API changes

## 8. Commands After Every Task

Minimum after each source task:

```bash
npm run lint
npm run typecheck
```

Required after every screen migration task:

```bash
npm run lint
npm run typecheck
npm run build
```

Required before completion:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Optional audit checks:

```bash
git diff --name-only
git diff -- src/app/api src/repositories src/services prisma src/lib/badminton-store.ts
```

## 9. Stop Criteria

Stop immediately and ask for owner confirmation if any of these occur:

1. A visual migration requires changing API, DB, Prisma, repository, service, hook, Zustand, permission, route, finance, inventory, or runtime logic.
2. A shared primitive change requires modifying consumer props across business screens.
3. A runtime protected file must be changed to finish a task.
4. A layout change would alter operator workflow, tap order, scheduling flow, or queue semantics.
5. A finance/inventory/session screen visual change risks changing totals, payloads, validation, or generated records.
6. Light mode fix requires removing operational color semantics instead of tokenizing them.
7. Build/typecheck fails due to files outside the intended task scope.
8. Dashboard redesign or runtime redesign becomes necessary.

## 10. Explicit Deferrals

These are intentionally not part of Stage 01.5 implementation:

- Dashboard redesign
- Runtime redesign
- runtime court layout redesign
- next-match card behavior changes
- player queue behavior changes
- auto-matchmaking UI behavior changes
- finance calculation redesign
- inventory movement redesign
- permission model redesign
- module-specific feature layout redesign
- new data fetching strategy
- new table/grid framework

Stage 01.5 should leave the app looking more consistent, not behaving differently.
