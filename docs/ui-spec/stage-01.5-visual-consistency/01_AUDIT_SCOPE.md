# Stage 01.5 Audit Scope

## Objective

Audit the entire presentation layer and identify gaps against the Stage 01 foundation.

The audit should answer:

- Which screens still use hard-coded colors instead of tokens?
- Which screens do not use shared typography hierarchy?
- Which buttons, inputs, badges, cards, and empty/loading states are inconsistent?
- Which layouts have spacing, radius, border, or shadow drift?
- Which screens have weak light/dark mode parity?
- Which changes are safe presentation-only migrations?
- Which files are protected and should be deferred or handled with extra caution?

## In Scope

Presentation-only audit of:

- `src/app/**/page.tsx`
- `src/components/**`
- shared UI primitives in `src/components/ui/**`
- app shell and navigation presentation
- page headers and section headers
- cards and metric cards
- buttons and icon buttons
- form inputs and selects
- badges and status tags
- loading, empty, error, warning states
- typography hierarchy
- spacing rhythm
- border radius
- borders and dividers
- shadows
- light/dark mode color parity
- responsive visual consistency

## Out of Scope

Do not audit for implementation changes to:

- API behavior
- DB schema
- Prisma mappings
- repository logic
- service logic
- runtime scheduling lifecycle
- Zustand state ownership
- permission decisions
- finance formulas
- inventory movement semantics
- route hierarchy
- data fetching strategy

## Protected Runtime Caveat

Runtime files can be audited visually, but implementation must be conservative.

Protected runtime areas may contain visual debt, but Stage 01.5 must not redesign runtime workflows.

Allowed runtime findings:

- hard-coded presentation class
- inconsistent typography
- inconsistent focus/hover state
- poor token adoption
- dark/light mode issue

Forbidden runtime changes without explicit approval:

- scheduling lifecycle
- player status semantics
- matchmaking logic
- court lifecycle
- replacement eligibility
- DB synchronization behavior

## Screens Audited - 2026-07-14

The audit covered these presentation areas:

- App shell
- Sidebar
- Dashboard
- Lich choi
- Chi tiet ngay
- Chi tiet ca
- Dieu phoi runtime
- Danh sach nguoi choi runtime
- Thu chi
- Kho cau
- Nguoi dung
- Phan quyen
- Cai dat
- Login
- Shared UI components

## Files / Areas Sampled

The audit used direct file inspection and class/component usage scans across:

- `src/components/app-shell.tsx`
- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`
- `src/components/schedule/session-detail-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/player/player-quick-view.tsx`
- `src/components/finance/finance-page-client.tsx`
- `src/components/inventory/inventory-page-client.tsx`
- `src/components/users/auth-users-panel.tsx`
- `src/components/settings/settings-page-client.tsx`
- `src/components/auth/login-page-client.tsx`
- `src/components/ui/**`

Audit commands included:

- `git status --short`
- `git diff --name-only`
- protected-area diff check
- hard-coded presentation class scan
- shared component usage scan
- native control usage scan

No source code was modified as part of this audit.
