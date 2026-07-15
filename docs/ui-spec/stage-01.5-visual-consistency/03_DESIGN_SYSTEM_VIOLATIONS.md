# Design System Violations

## Purpose

Define what counts as a visual consistency violation after Stage 01.

The goal is not visual perfection. The goal is to stop drift and make future UI changes predictable.

## Token Violations

Flag these patterns:

- direct Tailwind palette classes where a semantic token exists
- hard-coded `bg-slate-*`, `text-slate-*`, `border-slate-*`
- hard-coded `bg-cyan-*`, `text-cyan-*`, `border-cyan-*`
- hard-coded `bg-rose-*`, `text-rose-*`, `border-rose-*`
- hard-coded `bg-emerald-*`, `text-emerald-*`, `border-emerald-*`
- hard-coded `bg-amber-*`, `text-amber-*`, `border-amber-*`
- hard-coded `bg-violet-*`, `text-violet-*`, `border-violet-*`
- arbitrary shadows such as `shadow-[...]`
- arbitrary radius such as `rounded-[...]`
- one-off overlays such as `bg-slate-950/80`

Allowed exceptions:

- chart colors when the chart explicitly needs series distinction
- avatar gender colors until avatar tokens are formalized
- temporary protected runtime classes if changing them risks workflow regressions

## Typography Violations

Flag:

- page title smaller than section title
- section title visually identical to body text
- labels too low contrast
- uppercase microcopy used as decoration without meaning
- inconsistent KPI number sizes
- mixed font families outside the Stage 01 font stack
- English labels in Vietnamese operational UI unless they are technical identifiers

## Layout Violations

Flag:

- inconsistent page padding
- page content missing `PageShell`
- cards with inconsistent radius
- nested card-in-card visuals that create unclear hierarchy
- uncontrolled horizontal overflow without scroll affordance
- tables/lists without column headers when data meaning is unclear
- inconsistent action placement between similar screens

## Component Violations

Flag:

- custom button styles that duplicate `Button`
- custom input/select/textarea styles that duplicate form primitives
- status chips that do not map to `StatusBadge`
- ad hoc empty/loading states
- cards that do not map to `Surface`, `SectionCard`, or `MetricCard`
- inconsistent pagination controls

## Light/Dark Violations

Flag:

- text that has good contrast in dark mode but poor contrast in light mode
- semantic badge backgrounds too faint in light mode
- cards relying only on dark backgrounds
- border-only hierarchy that disappears in light mode
- hover/focus states only visible in dark mode

## Current Findings - 2026-07-14

Severity key:

- `P0`: severe theme/token/contrast/focus issue or a protected area that would visibly break product quality if migrated carelessly.
- `P1`: component inconsistency, repeated hard-code, typography/spacing/radius drift.
- `P2`: polish, density, motion, or minor hierarchy issue.

### P0 Findings

| Area | Files | Finding | Impact | Required Handling |
|---|---|---|---|---|
| Session detail light/dark parity | `src/components/schedule/session-detail-client.tsx` | Large parts of the screen still rely on hard-coded dark surfaces such as slate backgrounds, white borders, cyan/amber/rose classes, and custom modal panels. | Light mode can lose contrast and hierarchy; dense operational workflow becomes visually inconsistent. | Presentation-only migration in small patches. Do not change session status, player payments, completion math, or runtime entry rules. |
| Runtime protected UI parity | `src/components/realtime-dashboard.tsx`, `src/components/cards/court-card.tsx`, `src/components/cards/next-match-card.tsx`, `src/components/sections/player-database-panel.tsx` | Runtime cards, court states, next-match suggestions, player tags, and overlays use many one-off dark-only classes. | Runtime may not meet light-mode or SaaS consistency expectations; careless changes can damage protected scheduling UX. | Audit only unless owner approves runtime UI token migration. No lifecycle, queue, matchmaking, or DB timing changes. |
| Player quick view modal | `src/components/player/player-quick-view.tsx`, runtime/session usages | Modal overlay/card is dark-only and custom, with local close/focus handling. | Player info popup can look broken in light mode and may not share focus/overlay behavior with future modal primitives. | Normalize overlay/surface/focus only; keep click outside and close behavior. |

### P1 Findings

| Category | Files / Areas | Finding | Recommended Fix |
|---|---|---|---|
| Underused Stage 01 primitives | Most domain screens | `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Surface`, `StatusBadge`, `Skeleton`, and `EmptyState` exist but are not broadly adopted. | Migrate low-risk screens first; keep props and event behavior identical. |
| Custom badges | Finance, inventory, schedule, users, runtime | `TransactionBadge`, `MovementBadge`, play-date tags, role/permission tags, runtime player tags use local color maps. | Map to `StatusBadge` or formal domain-specific wrappers using semantic tokens. |
| Chart colors | Dashboard | Chart series use hard-coded emerald/rose/cyan/amber palette classes. | Add chart semantic tokens or chart tone constants before migration. |
| Manual page headers | Play date detail, session detail, runtime | Several screens still build page headers manually instead of `PageHeader`. | Normalize non-runtime first; runtime header changes need protected review. |
| Custom card shells | Schedule cards, session detail panels, settings cards, runtime cards | Many cards use local `rounded-*`, `border-*`, `bg-*`, `shadow-*` combinations. | Use `SectionCard`, `Surface`, or explicit domain wrappers. |
| Native controls | Users, settings, session detail, inventory helper forms, runtime player list | Many native `input`, `select`, and `button` elements use class strings instead of shared primitives. | Replace only where value/onChange/onBlur semantics stay identical. |
| Danger and warning colors | Settings reset areas, schedule delete buttons, session completion warnings | Some danger/warning states use direct rose/amber classes. | Route through semantic `danger`, `warning`, and `Button` variants. |
| Typography drift | Session detail, runtime, schedule cards, settings cards | Section titles, labels, uppercase microcopy, and KPI values are not always aligned with Stage 01 hierarchy. | Apply `text-page-title`, `text-section-title`, `text-card-title`, `text-label`, and metric styles consistently. |
| Empty/loading states | Session detail, runtime, settings, users | Some empty and loading states are ad hoc text blocks instead of `NoticeCard`, `EmptyState`, or `Skeleton`. | Normalize non-runtime first; runtime states need protected review. |

### P2 Findings

| Category | Files / Areas | Finding | Recommended Fix |
|---|---|---|---|
| Radius and shadow polish | Login, modals, runtime cards | `rounded-2xl`, `shadow-2xl`, arbitrary shadow/radius patterns appear in isolated places. | Standardize to Stage 01 radius/shadow scale where it does not reduce touch usability. |
| Motion density | Runtime player list and interactive cards | Some hover/scale/motion patterns are stronger than SaaS operational UI needs. | Keep motion subtle and consider reduced-motion compatibility later. |
| Table/list density | Finance, inventory, users | Lists are functional but column headers, row heights, and pagination spacing should be reviewed for compact parity. | Normalize through shared list/table wrapper in a later presentation pass. |
| Microcopy hierarchy | Dashboard, schedule, inventory, finance | Some helper descriptions and uppercase labels compete visually with section titles. | Reduce decorative uppercase; reserve it for meaningful category labels. |

### Allowed Exceptions Confirmed

- Runtime protected modules may retain temporary hard-coded classes until explicit runtime UI migration approval.
- Chart colors may remain hard-coded until chart semantic tokens are defined.
- Avatar gender colors may remain until avatar tokens are formalized.
- Existing shared form class constants are acceptable as an interim bridge even before full `Input`/`Select` adoption.
