# Information Architecture

Status: Ready for implementation planning

Source code changed: No

Source code changed: No

## Canonical Workflow

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Chi tiết ca -> Điều phối`

Session Workspace is the `Chi tiết ca` preparation screen. It is not Runtime.

## Screen Purpose

The screen helps the operator:

- verify session time, court count, and status
- start the session when eligible
- enter or review completion inputs
- review expected/profit values
- add and maintain session-scoped players
- confirm player payment information
- navigate into Runtime when ready
- return to Schedule context

## Priority Order

The Session Workspace must prioritize information in this order:

1. Session Header
2. Session Summary
3. Người chơi
4. Tình trạng thanh toán
5. Thông tin sân
6. Thông tin cầu
7. Nút Bắt đầu điều phối
8. Hành động chỉnh sửa

This order is about visual priority only. It must not change workflow, data flow, routes, validation, permissions, or runtime behavior.

## Current Business Sections

The implementation should preserve these conceptual areas:

1. Session header and navigation.
2. Session summary.
3. Player management.
4. Payment state.
5. Court and shuttlecock completion information.
5. Existing feedback states.

## Proposed Presentation Order

No workflow change is intended. Presentation should remain operational:

1. Session Header:
   - back to schedule context
   - session title
   - time/courts/status
   - primary actions kept in the existing permission/status gates
   - Runtime remains contextual to this session

2. Session Summary:
   - time
   - player count
   - expected revenue
   - optional status indicator using existing session status only

3. Người chơi:
   - add-player form
   - player rows
   - inline edit state
   - empty state
   - quick view behavior

4. Tình trạng thanh toán:
   - cash collected
   - bank transfer collected
   - unpaid amount
   - payment badge per player
   - existing payment edit mapping only

5. Thông tin sân:
   - court cost
   - court count display from existing session data
   - update action using existing handler

6. Thông tin cầu:
   - shuttlecock product
   - shuttlecock usage
   - saved shuttlecock product label
   - shuttlecock usage cost from existing calculation

7. Nút Bắt đầu điều phối:
   - `Bắt đầu ca` remains governed by existing status, permission, and minimum-player rules
   - `Điều phối` remains a contextual link to `/sessions/[sessionId]/runtime`
   - do not make Runtime root navigation

8. Hành động chỉnh sửa:
   - edit player
   - delete player
   - update completion info
   - avatar change/delete
   - complete session confirmation
   - secondary actions should never visually compete with primary operational actions

## Recommended Layout Model

### Top Zone

The top zone should answer:

- Which session is this?
- Is it ready to operate?
- What are the primary next actions?

Recommended content:

- Back action to schedule context.
- Session name.
- Time, court count, and status.
- Primary actions in existing order/visibility:
  - `Bắt đầu ca`
  - `Hoàn tất ca`
  - `Điều phối`

### Summary Zone

The summary zone should be compact and scan-friendly:

- `Thời gian`
- `Người chơi`
- `Thu dự kiến`

These must use the current values and formulas.

### Player Zone

The player zone should be visually more important than the completion inputs because preparing the session starts with confirming who is playing.

Recommended content order:

1. Section header with payment totals.
2. Add-player form.
3. Player list.
4. Inline edit states.
5. Empty/loading/error states.

The payment totals remain near the player list because they summarize the same player source.

### Completion Zone

The completion zone should remain visible but secondary during initial preparation:

1. Profit display.
2. Court cost.
3. Shuttlecock product.
4. Shuttlecock usage.
5. Session note.
6. Update completion info.

The zone can stay collapsible if existing behavior is preserved.

### Secondary Actions

Secondary edit/delete/avatar actions should be discoverable but quieter than primary operational actions.

Do not hide actions behind a new workflow unless separately approved.

## Interaction Rules to Preserve

- The operator remains in control.
- Session completion cannot bypass existing validation.
- Completed sessions remain readonly according to existing implementation rules.
- Runtime is reached only through the existing route.
- Player management remains session-scoped.
- Payment states remain the existing domain states.
- Avatar upload remains optional.
- `Bắt đầu ca` eligibility remains `players.length >= courtCount * 6`.
- `Hoàn tất ca` remains controlled by existing completion validation and permission.
- Existing confirmation behavior remains unless explicitly approved for migration.
- Existing inline edit behavior remains.

## Layout Risks

| Area | Risk | Rule |
| --- | --- | --- |
| Header actions | Moving `Điều phối` can imply Runtime is a primary/root module. | Keep it contextual to the session. |
| Payment summary | Separating payment totals from players can make source unclear. | Keep payment summary near player list. |
| Court/shuttle inputs | Moving fields can change perceived completion workflow. | Keep update/complete semantics unchanged. |
| Edit actions | Over-emphasizing edit/delete can distract from operation. | Keep them secondary but accessible. |
| Collapsible sections | Collapsing required completion inputs can hide validation blockers. | If collapsible, error states must remain visible. |

## Non-Goals

- Do not redesign Runtime.
- Do not add a new player profile system.
- Do not add a new payment workflow.
- Do not add accounting or inventory features.
- Do not change session completion semantics.
