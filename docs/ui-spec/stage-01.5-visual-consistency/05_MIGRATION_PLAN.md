# Stage 01.5 Migration Plan

## Principle

Migrate presentation consistency from low-risk shared surfaces outward.

Do not start with protected runtime screens.

## Migration Order

1. Shared UI primitives and helper classes
2. App shell and global page wrappers
3. Low-risk pages with simple cards/lists
4. Dashboard, finance, inventory visual consistency
5. Schedule and play date detail
6. Session detail presentation-only cleanup
7. Runtime presentation audit findings only after explicit confirmation

## Safe Migration Examples

Allowed:

- replace hard-coded color classes with semantic token classes
- replace one-off button class strings with `Button`
- replace repeated input class strings with shared primitives or form class constants
- normalize card radius and borders
- normalize section title typography
- normalize pagination visual style
- improve focus-visible states
- improve light/dark token parity

Not allowed:

- changing data fetching
- changing mutation timing
- changing validation rules
- changing form field meaning
- changing calculations
- changing session lifecycle
- changing runtime matchmaking behavior
- removing operational actions

## Migration Safety Levels

### Level 1 - Safe

Pure class replacement and shared primitive adoption with identical props/behavior.

### Level 2 - Caution

Presentation change inside dense operational workflows such as session detail, finance forms, inventory forms.

### Level 3 - Protected

Runtime scheduling screens and protected modules.

Requires explicit owner confirmation before implementation beyond simple token replacement.

## Required Pre-Implementation Output

Before changing source code in Stage 01.5, produce:

- baseline audit
- component usage audit
- design violation list
- screen consistency matrix
- implementation sequence
- protected-file risk list

## Audit-Derived Migration Plan - 2026-07-14

This plan is presentation-only. It must not modify business logic, API contracts, database schema, Prisma models, repositories, services, business hooks, Zustand runtime, routes, permissions, finance calculations, inventory calculations, or runtime scheduling semantics.

### Phase A - Foundation Usage Guardrails

Goal: reduce future drift before touching screens.

1. Document how `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Surface`, `StatusBadge`, `EmptyState`, `Skeleton`, `PageShell`, `PageHeader`, `SectionCard`, `ToolbarCard`, `MetricCard`, and `PaginationControls` should be used.
2. Define domain tone mapping for:
   - finance: income, expense, revenue adjustment, expense adjustment
   - inventory: import, sale, play usage, adjustment, other
   - schedule: today, readonly, unfinished session
   - runtime: waiting, just finished, playing, arrived, not arrived, host, injured, left early, priority
3. Keep chart colors as explicit chart tokens before changing dashboard chart classes.

Validation after Phase A:

- Typecheck only if source primitives are edited.
- No protected runtime files unless owner explicitly approves.

### Phase B - Low-Risk Non-Runtime Screens

Goal: migrate screens that are already close to Stage 01.

Order:

1. Dashboard
2. Finance
3. Inventory
4. Users
5. Settings
6. Login

Allowed changes:

- replace local badges with semantic badge wrappers
- replace local form controls with primitives where props/events remain identical
- normalize section titles, cards, spacing, radius, and focus states
- normalize pagination/list header visuals
- improve light/dark contrast with semantic tokens

Forbidden changes:

- finance totals, adjustment logic, or transaction payloads
- inventory movement logic, stock math, or negative-stock validation
- user permission keys, role defaults, auth/session behavior
- S3 upload/delete behavior

### Phase C - Schedule Screens

Goal: normalize scheduling management screens without changing runtime scheduling.

Order:

1. `/schedule`
2. `/schedule/[playDateId]`
3. `/sessions/[sessionId]`

Special handling:

- `/sessions/[sessionId]` is dense and has financial/session-completion impact; split into smaller visual patches:
  1. header and summary cards
  2. completion information card
  3. note area
  4. add-player form
  5. player list rows
  6. player quick view modal usage
- Validate after each patch by checking add/edit player, payment display, completion info update, completed-session readonly mode, and navigation to runtime.

Forbidden changes:

- start/complete/cancel session lifecycle
- player payment semantics
- court count/session metadata semantics
- completion revenue/expense/profit calculations
- shuttlecock usage movement behavior

### Phase D - Protected Runtime Token Review

Goal: only after owner approval, bring protected runtime closer to tokens without changing behavior.

Protected files:

- `src/components/realtime-dashboard.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- runtime hydration/sync hooks and runtime store must remain untouched unless explicitly requested.

Allowed only with approval:

- token replacement
- contrast/focus fixes
- overflow fixes
- shared button adoption with identical click handlers and disabled logic
- visual badge/token mapping

Forbidden without approval:

- queue lifecycle changes
- court lifecycle changes
- matchmaking scoring changes
- replacement eligibility changes
- DB select/write timing changes
- layout changes that alter operator workflow

### Phase E - Visual Regression Checklist

After every implementation group:

1. Verify dark mode.
2. Verify light mode.
3. Verify tablet landscape.
4. Verify smartphone portrait.
5. Verify keyboard focus on buttons, links, inputs, selects, pagination.
6. Verify empty/loading/disabled states.
7. Run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run guard:no-db-schema-automation`
