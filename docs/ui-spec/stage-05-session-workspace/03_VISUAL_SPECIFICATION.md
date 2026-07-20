# Visual Specification

Status: Ready for implementation planning

Source code changed: No

## Design Direction

Session Workspace should feel:

- operational
- compact
- clear
- touch-friendly
- modern SaaS
- consistent with Dashboard and Schedule stages

It should not feel like:

- a marketing page
- an ERP form
- a dense spreadsheet
- a runtime replacement

## Layout Principles

- Keep page header strong and concise.
- Put primary operational actions near the header.
- Use compact summary cards for key session facts.
- Keep completion inputs visually grouped.
- Keep player management readable on tablet and desktop.
- Preserve vertical scanning on mobile.
- Avoid nested cards where not needed.
- Prioritize high information density.
- Do not create excessive whitespace.
- Do not create oversized decorative cards.
- Avoid marketing-style hero spacing.
- Prefer tight operational bands and compact cards.

## Density Rules

Stage 05 should use compact SaaS density:

- Page vertical gap: small to medium, usually `gap-4` or `gap-5`.
- Section padding: compact, usually `p-4` or `p-5`; avoid `p-8+`.
- Summary card min-height: compact, usually near 88-112px.
- Form control height: keep existing operational control sizes, usually 40-44px.
- Player row height: compact but touch-safe, usually 56-72px in desktop/tablet.
- Avoid large empty card areas when a section has only one or two fields.

## Typography

- Page title: strongest hierarchy.
- Section titles: clear but smaller than page title.
- Field labels: readable, not tiny.
- KPI values: prominent but not oversized.
- Helper text: subdued and concise.

## Color and Tone

Use semantic tokens only:

- success for collected revenue, completed/positive states
- danger for destructive actions and negative profit
- warning for incomplete/attention states
- info/accent for navigation and operational primary actions
- neutral for readonly/passive data

Do not introduce raw color palettes.

## Page Header

Purpose:

- Identify the session quickly.
- Show status context.
- Keep primary actions reachable.

Specification:

- Use `PageHeader` where safe.
- No English eyebrow.
- Title should be session name.
- Description should include existing time, court count, and status.
- Back action stays compact above or beside title.
- Actions should remain one row on desktop where possible and wrap on tablet/mobile.
- `Bắt đầu ca` and `Điều phối` should be visually stronger than secondary edit actions.
- `Hoàn tất ca` remains visible only under existing status/permission logic.

Do not:

- Add a hero block.
- Add large decorative header background.
- Change button visibility logic.
- Move Runtime to root/global navigation.

## Session Summary Card

Purpose:

- Give immediate context before player preparation.

Content:

- Time range.
- Player count.
- Expected revenue.
- Existing status can be represented as a badge if already available.

Specification:

- Use compact `StatCard` or `Card`.
- Use a 3-column layout on desktop/laptop.
- Use 2-column or stacked layout on tablet/mobile.
- Values must use existing displayed data only.
- Label should be readable and not overly small.
- Values should be prominent but not dashboard-scale.

Tone:

- Time: info/neutral.
- Player count: neutral/info.
- Expected revenue: success/income.

Do not:

- Add new KPIs.
- Recalculate values.
- Use large KPI cards that push player section too far down.

## Player Summary Card

Purpose:

- Make the player preparation area the main working surface.

Content:

- Section title: `Người chơi trong ca`.
- Payment summary line using current totals.
- Add-player form.
- Player list.

Specification:

- Use a compact section surface.
- Keep the add-player form inline on desktop/tablet.
- Stack the add-player form on mobile.
- Player rows should remain touch-friendly but not oversized.
- Player row should keep avatar, name, level/gender, match count, fee, payment, edit/delete.
- Quick view behavior remains on row click.

Do not:

- Convert players to global users.
- Add new player fields.
- Remove quick-view behavior.
- Hide edit/delete actions if they are currently available.

## Finance Summary Card

Purpose:

- Help operator understand collection state without leaving player section.

Content:

- Cash collected.
- Bank transfer collected.
- Unpaid amount.
- Existing per-player payment badge.

Specification:

- Keep finance summary visually close to player list.
- Use compact inline stats or small badges, not a large separate dashboard area.
- Use success/info/warning tones:
  - Cash: success.
  - Bank transfer: info.
  - Unpaid: warning.
- Keep text readable in both light and dark mode.

Do not:

- Change payment status enum mapping.
- Change paid/unpaid calculations.
- Introduce accounting terminology.

## Court Summary Card

Purpose:

- Prepare/record court cost without dominating the screen.

Content:

- Court count from session.
- Court cost input.
- Update action if existing workflow allows.

Specification:

- Group with completion information.
- Use compact label/input layout.
- Court cost input should not span the whole page on desktop.
- Disabled/readonly state must be clear when session is locked or permission is missing.

Tone:

- Court cost is expense-adjacent but should remain neutral unless validation fails.

Do not:

- Change court count source.
- Change court cost payload.
- Change session completion rules.

## Shuttle Summary Card

Purpose:

- Prepare/record shuttlecock usage and saved product info.

Content:

- Shuttlecock product select.
- Shuttlecock usage input.
- Saved product label.
- Existing usage cost/profit implication only if currently displayed.

Specification:

- Keep product select and usage input in the same compact group.
- Saved product label should be secondary text, not a dominant block.
- Validation warning should stay visible without pushing important actions out of view.

Tone:

- Shuttle usage is expense/inventory-adjacent, but use neutral surface until warning/error.

Do not:

- Change product id/name fallback.
- Change usage price calculation.
- Change inventory movement behavior.

## Action Section

Purpose:

- Separate primary operational actions from secondary edits.

Primary actions:

- `Bắt đầu ca`.
- `Điều phối`.
- `Hoàn tất ca` where existing logic allows.

Secondary actions:

- Update completion info.
- Edit player.
- Delete player.
- Change/delete avatar.
- Expand/collapse section.

Specification:

- Primary actions stay in the header action area.
- Secondary actions stay near the item/section they affect.
- Destructive action uses danger tone.
- Icon-only actions need accessible labels.
- Actions must wrap without overlap on tablet/mobile.

Do not:

- Hide primary runtime/session actions in menus.
- Change confirmation behavior.
- Change disabled rules.

## Surfaces

Use shared primitives where safe:

- `PageShell`
- `PageHeader`
- `Card` / `Surface`
- `FormSection`
- `StatusBadge`
- `Button`
- `Input`
- `Select`
- `Textarea`
- feedback states

## Empty State

Purpose:

- Explain what operator should do next without adding new workflow.

Specification:

- Use `EmptyState`.
- Keep message concise.
- Empty player state should remain inside player section.
- Do not show a large illustration or marketing content.

## Loading

Purpose:

- Show data is loading without layout jump.

Specification:

- Prefer `LoadingState` or compact skeleton.
- Keep loading area near the section being loaded.
- Do not block unrelated visible data if existing behavior does not.

## Skeleton

Purpose:

- Preserve visual rhythm during loading.

Specification:

- Use compact skeleton rows/cards if adopted.
- Skeleton should match approximate final content density.
- Avoid large blank placeholders.

## Error

Purpose:

- Preserve existing error messages while making them visually consistent.

Specification:

- Use `ErrorState` / `WarningState` where safe.
- Keep API/hook error messages intact.
- Completion validation errors should remain close to completion inputs.
- Player action errors should remain close to player section.

Do not:

- Swallow API validation messages.
- Rewrite errors in a way that changes meaning.

## Responsive Rules

Desktop/laptop:

- summary cards may sit in a grid
- completion info can use multi-column input layout
- player list rows can use horizontal structure
- avoid overly wide single inputs
- keep primary actions on the right when room allows

Tablet:

- touch targets must remain large
- inputs must not clip
- actions must wrap cleanly
- fixed-width grids should relax before clipping
- player rows should retain two-hand/touch readability

Mobile:

- stack major sections
- keep primary actions reachable
- avoid horizontal clipping
- player rows may become compact stacked cards
- preserve add-player order
- avoid horizontal scroll for forms unless unavoidable

## Light Mode

Specification:

- Use semantic background/surface/text tokens.
- Avoid low-contrast soft backgrounds with same-color text.
- Summary tones must remain readable.
- Warning/danger states must be clearly visible but not saturated.

## Dark Mode

Specification:

- Use semantic dark tokens.
- Avoid deep tone-on-tone labels.
- Borders should remain visible without heavy outlines.
- Soft semantic backgrounds must contrast with card surfaces.

## Hover

Specification:

- Clickable player rows should use `surface-hover`.
- Buttons use primitive hover states.
- Do not create large motion or decorative hover effects.
- Hover must not shift layout.

## Focus

Specification:

- Use shared focus-visible ring.
- All links, buttons, selects, inputs, file upload triggers, and row actions must be keyboard reachable.
- Row click plus nested buttons requires careful focus order.

## Disabled

Specification:

- Disabled actions must remain visible but clearly inactive.
- Disabled state must not rely only on opacity if contrast becomes too low.
- Disabled `Bắt đầu ca` should still explain eligibility through existing warning state.

## Accessibility Rules

- Icon-only controls need labels.
- Links and buttons need visible focus.
- Disabled states must remain distinguishable.
- Critical state cannot rely on color alone.
- Avatar upload control must be keyboard reachable.

## Visual Constraints

Do not:

- change form fields
- change table/list columns semantically
- change completion calculations
- add new controls
- hide required operational actions
- move Runtime into root navigation
