# Visual Specification

Status: Ready for implementation planning

Source code changed: No

## Global Stage 04 Visual Direction

The Schedule screens should feel like a compact operational SaaS planner:

- clear page hierarchy
- low visual noise
- quick scanning of dates and sessions
- touch-friendly actions
- consistent light/dark mode
- no runtime-style complexity on schedule screens

## PageHeader

Use existing `PageHeader`.

Rules:

- Page title should read clearly at desktop size from the foundation `text-page-title`.
- Description must be one short Vietnamese operational sentence.
- Do not use English eyebrow copy.
- Back action on detail page remains a small link to `/schedule`.
- Actions should stay on the right where available.

For `/schedule`:

- Title: `Lịch chơi`.
- Description should explain: create a day, open the day to create sessions, then open session detail.

For `/schedule/[playDateId]`:

- Title remains `playDate.title || playDate.playDate || 'Ngày chơi'`.
- Description remains date and session count, but can be visually tightened.

## PageToolbar

There is no standalone `PageToolbar` primitive currently.

Allowed substitutes:

- `ToolbarCard` from `page-layout` if a toolbar is needed.
- `FormSection` for form blocks.

Do not create a new `PageToolbar` primitive in Stage 04 unless explicitly approved.

## Form Tạo Ngày

Current fields must remain:

- `playDate`
- `title`
- `note`

Current behavior must remain:

- native date input with `min={today}`
- title optional
- note optional
- submit calls existing `submit`
- API payload unchanged

Visual target:

- Use `FormSection` if it reduces repeated card/form styling without logic changes.
- Keep default visible unless a collapsible behavior is explicitly approved.
- Use shared `Input` and `Button`.
- Use a compact grid:

```text
Ngày chơi | Tiêu đề | Ghi chú | Tạo ngày
```

Mobile:

- Stack fields in one column.
- Button full width is acceptable.

## DayCard

Domain card may remain local to `schedule-page-client.tsx` or be extracted only inside the same module.

Recommended content:

```text
Thứ Ba, 14/07/2026        Hôm nay        More
1 ca · Có ca chưa hoàn tất

20:00-22:00 · Ca tối · 2 sân       Chờ bắt đầu
```

Rules:

- Use `Surface`/`Card` styling or equivalent tokenized surface.
- Do not cover the whole card with primary/warning background.
- Today: use `StatusBadge tone="info"` plus subtle border/ring.
- Incomplete sessions: use `StatusBadge tone="warning"`.
- Past/review-only: use `StatusBadge tone="neutral"`.
- Delete is secondary/destructive.
- Detail/open day is primary.
- Use `ActionMenu` only if it does not alter handlers or confirmation behavior.
- Quick session rows must remain links to `/sessions/[sessionId]`.

## Form Tạo Ca

Current fields must remain:

- `name`
- `startTime`
- `endTime`
- `courtCount`
- `note`

Current behavior must remain:

- `courtCount` limited by `settings.maxCourtCountPerSession`
- submit validation unchanged
- submit payload unchanged

Desktop layout target:

```text
Tên ca | Bắt đầu | Kết thúc | Sân
Ghi chú                         Tạo ca
```

Rules:

- Button must not wrap into two lines.
- Court count field should remain compact.
- `Tối đa {maxCourtCount} sân` remains visible and subtle.
- Tablet may use two columns.
- Mobile stacks fields in one column.

## SessionCard / SessionRow

Domain card may remain local to `play-date-detail-client.tsx` or be extracted only inside the same module.

Recommended content:

```text
Ca tối                                      Chờ bắt đầu
20:00-22:00 · 2 sân

Chi tiết ca                                More
```

Rules:

- Use `StatusBadge` for `getSessionStatusLabel(session.status)`.
- Primary action: `Chi tiết ca`.
- Secondary actions: edit/delete.
- Disabled edit/delete must be visibly disabled and accessible.
- Do not change `canModify`.
- Do not add `Điều phối` action in Stage 04.

## Inline Edit Session Form

Rules:

- Preserve inline edit, not modal/drawer.
- Fields and save payload remain unchanged.
- Use same visual rhythm as create session form.
- Save/cancel icon buttons must have `aria-label`.

## StatusBadge

Use existing `StatusBadge`.

Suggested tone mapping:

- Today: `info`
- Incomplete: `warning`
- Past/review-only: `neutral`
- Pending session: `warning` or `neutral` depending existing visual context.
- Active session: `info`
- Completed session: `success`
- Cancelled session: `danger` or `neutral`

Tone mapping must not introduce new business statuses.

## ActionMenu

Use existing `ActionMenu` only for secondary actions when it improves clarity.

Rules:

- It must call existing handlers.
- It must not perform permission checks internally.
- It must not hide the primary `Chi tiết ngày` or `Chi tiết ca` action.
- Danger item must map only to existing delete handler.

## ConfirmDialog

There is no dedicated `ConfirmDialog` primitive currently.

Current delete behavior uses `window.confirm`.

Stage 04 must preserve this behavior unless a separate approval is given to migrate confirmation UI to `Dialog`.

## EmptyState

Use existing `EmptyState`.

Rules:

- Keep the same empty condition.
- Make copy operational and concise.
- Do not add action buttons that create new workflow.

## LoadingSkeleton / LoadingState

Available primitives:

- `LoadingState`
- `Skeleton`

Rules:

- Loading can migrate from `NoticeCard` to `LoadingState` only if timing and condition stay unchanged.
- Do not add suspense or change fetch behavior.

## Error

Available primitive:

- `ErrorState`

Rules:

- Error message source remains `error.message`.
- Action error message source remains existing mutation catch logic.
- Do not swallow API validation messages.

## Responsive Layout

Desktop:

- `/schedule` can remain two-column date cards.
- `/schedule/[playDateId]` can use stacked session cards.

Tablet landscape:

- Forms must keep touch targets visible and avoid clipped action buttons.

Tablet portrait:

- Cards should stack or use two-column only when content remains readable.

Mobile:

- One-column layout.
- Actions wrap without overlap.
- Horizontal page scroll is acceptable only if inherited from app shell and not caused by Stage 04 card internals.

## Light Mode / Dark Mode

Rules:

- Use semantic tokens only.
- Avoid raw custom dark-only card backgrounds.
- Status, danger, warning, and info tones must remain legible in both themes.

## Focus / Hover / Disabled

Rules:

- All buttons/links must keep visible focus.
- Session quick links need hover/focus affordance.
- Disabled edit/delete buttons must not look active.
- Icon-only buttons must have `aria-label`.

## Error Boundaries

Do not add or change React error boundaries in Stage 04.
