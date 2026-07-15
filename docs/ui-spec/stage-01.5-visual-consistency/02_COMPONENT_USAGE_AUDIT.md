# Component Usage Audit

## Purpose

Identify where screens use custom visual patterns instead of the Stage 01 shared foundation.

The audit must not assume every screen should be rewritten immediately. It should classify findings by risk and migration safety.

## Stage 01 Foundation Components

Shared components and primitives available after Stage 01:

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `Switch`
- `FormLabel`
- `FormDescription`
- `FormMessage`
- `Surface`
- `Card`
- `SectionSurface`
- `StatusBadge`
- `Skeleton`
- `EmptyState`
- `Separator`
- `PageShell`
- `PageHeader`
- `SectionHeader`
- `ToolbarCard`
- `SectionCard`
- `MetricCard`
- `NoticeCard`
- `PaginationControls`

## Audit Checklist

For every screen/component, inspect whether it uses:

- shared buttons instead of one-off button class strings
- shared form primitives or shared form class constants
- shared status badge semantics for tags/chips
- shared card/surface patterns instead of custom card shells
- page and section headers with consistent hierarchy
- shared loading/empty/error states
- tokenized color classes instead of hard-coded palette classes
- tokenized radius, shadow, and border classes
- consistent responsive spacing
- accessible focus states

## Classification

Each finding should be classified as one of:

- `SAFE_MIGRATION`: presentation-only, low risk
- `CAUTION`: presentation-only but in protected runtime or dense workflow area
- `DEFER`: requires screen redesign or could affect workflow
- `FORBIDDEN`: would require business logic, runtime, permission, route, DB, or API changes

## Required Output Format

Use this format in the audit report:

| File | Current Pattern | Foundation Replacement | Risk | Recommendation |
|---|---|---|---|---|
| `path/to/file.tsx` | hard-coded button styles | `Button` variant | SAFE_MIGRATION | migrate in Stage 01.5 |

## Current Audit Snapshot - 2026-07-14

Scope: presentation layer only. No business logic, API, database, Prisma, repositories, services, hooks, Zustand runtime, route, or permission behavior was changed during this audit.

### Foundation Adoption Summary

| Area | Current Usage | Foundation Gap | Risk | Recommendation |
|---|---|---|---|---|
| App shell / Sidebar | Uses semantic tokens for surface, border, active nav, focus ring, theme toggle, fullscreen toggle. | Collapse button and logout button still use local class composition instead of shared `Button`; mobile nav still embeds one-off link styles. | SAFE_MIGRATION | Keep behavior; later normalize icon buttons through shared button/icon-button primitive. |
| Dashboard | Uses `PageShell`, `PageHeader`, `ToolbarCard`, `MetricCard`, `SectionCard`, `NoticeCard`, shared form class constants. | Chart legend and series colors are hard-coded; chart container uses bespoke bar visuals. | SAFE_MIGRATION | Add chart semantic tokens before replacing chart colors. |
| Lich choi | Uses `PageShell`, `PageHeader`, `SectionCard`, `NoticeCard`, `Button`, form class constants. | Play-date cards and status chips are custom; expand/collapse control is still custom; naming and visual hierarchy need token alignment. | SAFE_MIGRATION | Migrate cards to `SectionCard`/`Surface` patterns and chips to `StatusBadge` where text semantics remain identical. |
| Chi tiet ngay | Uses `PageShell`, `Button`, `NoticeCard`, form class constants. | Header is manual instead of `PageHeader`; create-session panel is a custom section; session rows use local surface classes. | SAFE_MIGRATION | Normalize header and panels first; do not change session creation workflow. |
| Chi tiet ca | Uses some `Button` and shared form constants, but many dense sections remain custom. | Hard-coded dark surfaces, custom inputs/selects, custom modal styles, custom player rows, and manual status/payment chips. | CAUTION | Migrate presentation in small groups; verify player add/edit, completion info, and payment flows after each step. |
| Dieu phoi runtime | Protected runtime modules use many one-off cards, buttons, overlays, player chips, court colors, and suggestion panels. | Runtime is not fully tokenized; light-mode parity is weak; status and player tags are custom. | PROTECTED | Audit only by default. Only token/focus/overflow fixes after owner approval; never change scheduling behavior. |
| Danh sach nguoi choi runtime | Dense protected runtime player management uses custom controls, motion buttons, status tags, payment display, and native inputs. | Does not use `StatusBadge`, `Surface`, or form primitives consistently. | PROTECTED | Treat as protected operational UI; migration must preserve touch workflow and DB write timing. |
| Thu chi | Uses `PageShell`, `PageHeader`, `ToolbarCard`, `MetricCard`, `SectionCard`, `Button`, `PaginationControls`, shared form class constants. | `TransactionBadge` is custom; list row layout has local table/list styles; form controls use class constants instead of new `Input`/`Select` primitives. | SAFE_MIGRATION | Replace badges first; then migrate form primitives without changing payloads. |
| Kho cau | Uses `PageShell`, `PageHeader`, `ToolbarCard`, `MetricCard`, `SectionCard`, `Button`, `PaginationControls`, shared form class constants. | `MovementBadge` is custom; import/export tabs and helper fields are local; chart/metric tones need clearer semantic consistency. | SAFE_MIGRATION | Normalize badges/tabs/field components; preserve movement semantics and stock calculations. |
| Nguoi dung / Phan quyen | Uses `SectionCard`, `Button`, `PaginationControls`, shared form class constants. | User table has custom save button; role permission matrix uses native checkbox and local status chips; forms do not use Stage 01 `Input`/`Select` primitives. | SAFE_MIGRATION | Migrate native controls to primitives; preserve permission keys and role mutation behavior. |
| Cai dat | Uses page-level structure and custom collapsible settings cards. | Danger/reset areas, upload controls, and confirmation actions use custom color classes and native buttons; some light-mode danger contrast needs review. | SAFE_MIGRATION | Normalize cards/buttons/status messages; preserve app setting storage and S3 deletion behavior. |
| Login | Uses shared form class constants but has bespoke card, rounded, and shadow styles. | Does not use `PageShell`/`Surface`/form primitives; custom `shadow-2xl` and `rounded-2xl`. | SAFE_MIGRATION | Normalize auth surface after app shell pages; no auth behavior changes. |
| Shared UI primitives | `Button`, page layout helpers, form primitives, surface primitives, status badge, feedback primitives exist. | `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Surface`, `StatusBadge`, `Skeleton`, and `EmptyState` are underused in screens. | SAFE_MIGRATION | Begin Stage 01.5 with adoption guidelines and low-risk replacements. |

### Key Safe Migrations

| File/Area | Current Pattern | Foundation Replacement | Risk | Recommendation |
|---|---|---|---|---|
| `src/components/finance/finance-page-client.tsx` | `TransactionBadge` local tone map | `StatusBadge` with finance tone mapping | SAFE_MIGRATION | Keep labels and transaction math unchanged. |
| `src/components/inventory/inventory-page-client.tsx` | `MovementBadge` local tone map | `StatusBadge` with movement tone mapping | SAFE_MIGRATION | Preserve movement type semantics. |
| `src/components/schedule/schedule-page-client.tsx` | Custom play-date tag chips | `StatusBadge` | SAFE_MIGRATION | Preserve labels: `Hom nay`, `Co ca chua hoan tat`, `Chi xem lai`. |
| `src/components/users/auth-users-panel.tsx` | Native inputs/selects with class constants | `Input`, `Select`, `Checkbox` | SAFE_MIGRATION | Preserve role keys and mutation payloads. |
| `src/components/settings/settings-page-client.tsx` | Custom danger/reset controls | `Button` variants plus semantic danger tokens | SAFE_MIGRATION | Preserve reset confirmation and S3 deletion behavior. |

### Caution / Protected Migrations

| File/Area | Current Pattern | Foundation Replacement | Risk | Recommendation |
|---|---|---|---|---|
| `src/components/schedule/session-detail-client.tsx` | Dense custom dark surfaces, inputs, player rows, completion panel | `PageHeader`, `SectionCard`, form primitives, `StatusBadge` | CAUTION | Split into small visual-only patches; test add/edit player, fee select, completion cost, and readonly completed session. |
| `src/components/realtime-dashboard.tsx` | Runtime layout, top bar, stat cards, queue, modal triggers with one-off styles | Semantic tokens and shared buttons where behavior is unchanged | PROTECTED | Requires explicit approval before implementation. |
| `src/components/cards/court-card.tsx` | Court states and action buttons use hard-coded status classes | Runtime status tokens only | PROTECTED | Do not change court state transitions, ready/start/end/cancel behavior, or touch layout semantics. |
| `src/components/cards/next-match-card.tsx` | Suggestion cards, replace UI, lock/apply controls use local styles | Runtime token wrappers only | PROTECTED | Do not change matchmaking, replacement, lock, or apply semantics. |
| `src/components/sections/player-database-panel.tsx` | Runtime player list, payment controls, tag controls, motion buttons | Runtime-safe tokenization only | PROTECTED | Do not alter DB commit timing or payment update behavior. |
| `src/components/player/player-quick-view.tsx` | Hard-coded modal overlay/card and local close button | Shared modal/surface primitive when available | CAUTION | Fix contrast and overflow without changing click-to-dismiss behavior. |
