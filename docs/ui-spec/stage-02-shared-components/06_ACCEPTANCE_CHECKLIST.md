# Stage 02 Acceptance Checklist

## Scope

- [ ] Stage 02 remained component-library focused.
- [ ] No deep redesign of a specific screen was performed.
- [ ] No business logic was changed.
- [ ] No API route was changed.
- [ ] No Prisma/database schema was changed.
- [ ] No repository/service/business hook was changed.
- [ ] No Zustand runtime logic was changed.
- [ ] No route name or navigation target was changed.
- [ ] No permission rule was changed.
- [ ] No finance calculation was changed.
- [ ] No inventory calculation was changed.

## Protected Areas

Confirm no changes unless explicitly approved:

- [ ] `src/lib/badminton-store.ts`
- [ ] `src/components/realtime-dashboard.tsx`
- [ ] `src/components/sections/live-courts-section.tsx`
- [ ] `src/components/sections/next-match-queue.tsx`
- [ ] `src/components/sections/player-database-panel.tsx`
- [ ] `src/components/cards/court-card.tsx`
- [ ] `src/components/cards/next-match-card.tsx`
- [ ] runtime hydration/sync hooks
- [ ] runtime repositories
- [ ] `/api/runtime/snapshot`

## Component Quality

### DataTable

- [ ] Supports row/cell rendering without owning data fetching.
- [ ] Supports loading/empty/error states.
- [ ] Supports pagination slot.
- [ ] Supports horizontal overflow.
- [ ] Preserves caller-provided columns and actions.
- [ ] Has accessible table/list semantics.

### FilterBar

- [ ] Supports title/description.
- [ ] Supports action/filter slots.
- [ ] Is compact on desktop.
- [ ] Stacks safely on mobile.
- [ ] Does not own filtering logic.

### StatCard

- [ ] Uses semantic tones.
- [ ] Does not calculate values internally.
- [ ] Supports compact/default density.
- [ ] Works in light and dark mode.

### FormSection

- [ ] Supports title/description/actions.
- [ ] Supports collapsible mode.
- [ ] Supports danger/disabled states.
- [ ] Does not own validation or submit behavior.

### ActionMenu

- [ ] Supports keyboard navigation.
- [ ] Supports disabled and danger items.
- [ ] Permission checks remain outside.
- [ ] Caller owns handlers.

### Dialog

- [ ] Controlled open state.
- [ ] Accessible label/description.
- [ ] Focus is managed.
- [ ] Escape/outside close behavior is explicit.
- [ ] Caller owns confirm/cancel handlers.

### Drawer

- [ ] Controlled open state.
- [ ] Supports side/bottom placement.
- [ ] Body scroll is contained.
- [ ] Focus is managed.
- [ ] Does not alter route/navigation behavior.

### Feedback States

- [ ] Loading state is reusable.
- [ ] Empty state is reusable.
- [ ] Error state is reusable.
- [ ] Warning/success/disabled states are reusable.
- [ ] Critical operational warnings are not hidden.

## Visual Quality

- [ ] Uses Stage 01 semantic tokens.
- [ ] Light mode contrast is acceptable.
- [ ] Dark mode contrast is acceptable.
- [ ] Focus-visible states are clear.
- [ ] Disabled states are readable.
- [ ] Radius uses Stage 01 scale.
- [ ] Shadow uses Stage 01 scale.
- [ ] Spacing uses consistent density scale.
- [ ] Typography hierarchy matches Stage 01.

## Responsive Quality

- [ ] Desktop 1440px reviewed.
- [ ] Laptop 1280px reviewed.
- [ ] Tablet landscape reviewed.
- [ ] Tablet portrait reviewed.
- [ ] Mobile smoke test reviewed.
- [ ] Wide tables remain usable through horizontal scroll.
- [ ] Dialog/drawer content remains scrollable.

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run guard:no-db-schema-automation`

## Completion Report

- [ ] Files changed listed.
- [ ] Components added listed.
- [ ] Screens migrated listed.
- [ ] Business logic unchanged confirmed.
- [ ] Protected files unchanged confirmed.
- [ ] Deferred issues listed.
- [ ] Final decision recorded as `PASS`, `PASS WITH NOTES`, or `BLOCKED`.

