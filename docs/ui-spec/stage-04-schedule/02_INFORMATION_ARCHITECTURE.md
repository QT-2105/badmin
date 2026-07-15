# Information Architecture

Status: Locked for Stage 04 planning

Source code changed: No

## Canonical Workflow

Stage 04 supports only this part of the application workflow:

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Chi tiết ca`

It must not enter or redesign:

- `Chi tiết ca` internals
- `Điều phối`
- runtime court orchestration
- player scheduling
- finance/inventory completion behavior

## Trang Lịch Chơi: `/schedule`

Current user jobs:

1. Create a play date when permitted.
2. Review play dates sorted newest first.
3. Identify today.
4. Identify dates with incomplete sessions.
5. Expand a day to review sessions quickly.
6. Open day detail.
7. Delete an eligible future date when permitted.

Information priority:

1. Page title: `Lịch chơi`.
2. One-sentence operational instruction.
3. Primary action area: create play date.
4. List of play dates.
5. Day state: today, incomplete sessions, past/review-only.
6. Sessions inside the day.
7. Primary action: open day detail.
8. Secondary action: delete when allowed.

Required IA behavior:

- The page must not make runtime a root action.
- The page must not add bulk operations.
- The page must not add calendar drag/drop.
- The page must not hide the existing create flow behind a new route.
- The page must not change the number of required clicks for existing critical operations unless explicitly approved.

## Day Card Structure

Recommended display hierarchy:

```text
Thứ Ba, 14/07/2026        Hôm nay        More
1 ca · Có ca chưa hoàn tất

20:00-22:00 · Ca tối · 2 sân       Chờ bắt đầu
```

Rules:

- Prefer human-readable day/title over repeated ISO date.
- Keep `item.playDate` available where useful, but avoid duplicate date noise.
- `Hôm nay` should be a badge or subtle border, not a full-card primary background.
- `Có ca chưa hoàn tất` should be visible but not visually overpower the day title.
- Past dates may show `Chỉ xem lại`, but do not add explanatory warning text.
- Quick session rows must be visually clickable and route to `/sessions/[sessionId]`.

## Trang Chi Tiết Ngày: `/schedule/[playDateId]`

Current user jobs:

1. Review the selected play date.
2. Create a session when permitted.
3. Review sessions sorted by earliest start time.
4. See session time.
5. See court count.
6. See session status.
7. Open session detail.
8. Edit/delete eligible pending future sessions when permitted.

Information priority:

1. Back navigation to `Lịch chơi`.
2. Page title: play date title or play date.
3. Date and session count.
4. Primary action area: create session.
5. Session list.
6. Time and court count.
7. Status.
8. Primary action: `Chi tiết ca`.
9. Secondary actions: edit/delete.

Required IA behavior:

- `Chi tiết ca` remains the primary route for session operations.
- `Điều phối` must not appear here as a primary action in Stage 04.
- Editing remains inline.
- Existing create/edit/delete visibility rules remain unchanged.
- Past dates remain review-only except existing session-detail review navigation.

## Session Row/Card Structure

Recommended display hierarchy:

```text
Ca tối                                      Chờ bắt đầu
20:00-22:00 · 2 sân

Chi tiết ca                                More
```

Rules:

- `Chi tiết ca` is the primary action.
- Edit/delete are secondary and only visible/enabled under existing rules.
- Status must use `StatusBadge` with existing `getSessionStatusLabel`.
- Keep note text available but visually secondary.
- Do not change route to `/sessions/[sessionId]`.

## No Workflow Changes

Stage 04 must preserve:

- play date create/delete flow
- session create/edit/delete flow
- confirmation behavior
- permission gates
- past-date restrictions
- pending-only edit/delete rule
- route hierarchy
- data source and invalidation behavior

If a proposed IA improvement needs any workflow or route change, stop and ask for owner approval.
