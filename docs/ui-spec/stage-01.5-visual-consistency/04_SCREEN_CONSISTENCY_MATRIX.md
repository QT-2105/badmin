# Screen Consistency Matrix

## Purpose

Use this matrix to compare screens against the Stage 01 foundation without redesigning screen workflows.

## Screens To Audit

| Screen | Route | Priority | Notes |
|---|---|---:|---|
| Dashboard | `/dashboard` | High | Business overview, metric cards, chart, recent sessions |
| Schedule | `/schedule` | High | Play date list and creation flow |
| Play Date Detail | `/schedule/[playDateId]` | High | Session list and create session form |
| Session Detail | `/sessions/[sessionId]` | High | Dense operational form and player list |
| Runtime | `/sessions/[sessionId]/runtime` | Protected | Audit only; migrate carefully |
| Finance | `/finance` | High | Report cards, form, transaction list |
| Inventory | `/inventory` | High | Stock metrics, product table, movement forms/list |
| Settings | `/settings` | Medium | App-level configuration |
| Users | `/users` | Medium | Auth user and role management |
| Login | `/login` | Medium | Authentication surface |

## Matrix Columns

Use these columns in the audit:

| Screen | Page Header | Tokens | Typography | Buttons | Forms | Cards | Badges | Empty/Loading | Light/Dark | Risk |
|---|---|---|---|---|---|---|---|---|---|---|

Status values:

- `PASS`
- `PARTIAL`
- `FAIL`
- `DEFER`
- `PROTECTED`

## Audit Rules

For each screen:

1. Identify only presentation issues.
2. Do not propose changing workflow sequence.
3. Do not change copy that affects operational meaning.
4. Do not alter route or permission behavior.
5. Separate safe migrations from protected or risky changes.

## Runtime-Specific Matrix Rule

Runtime can receive:

- token replacement
- better contrast
- consistent button focus/hover
- safer overflow handling
- typography normalization

Runtime must not receive:

- layout redesign that changes operator workflow
- matchmaking UI behavior change
- queue lifecycle change
- court card state behavior change

## Completed Audit Matrix - 2026-07-14

| Screen | Page Header | Tokens | Typography | Buttons | Forms | Cards | Badges | Empty/Loading | Light/Dark | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| App shell | N/A | PASS | PASS | PARTIAL | N/A | PARTIAL | N/A | N/A | PASS | SAFE_MIGRATION |
| Sidebar | N/A | PASS | PASS | PARTIAL | N/A | PASS | N/A | N/A | PASS | SAFE_MIGRATION |
| Dashboard | PASS | PARTIAL | PASS | PASS | PARTIAL | PASS | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Lich choi | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Chi tiet ngay | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | N/A | PASS | PARTIAL | SAFE_MIGRATION |
| Chi tiet ca | PARTIAL | FAIL | PARTIAL | PARTIAL | FAIL | FAIL | PARTIAL | PARTIAL | FAIL | CAUTION |
| Dieu phoi | PROTECTED | FAIL | PARTIAL | PARTIAL | N/A | FAIL | PARTIAL | PARTIAL | FAIL | PROTECTED |
| Danh sach nguoi choi runtime | PROTECTED | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL | PARTIAL | FAIL | PROTECTED |
| Thu chi | PASS | PARTIAL | PASS | PASS | PARTIAL | PASS | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Kho cau | PASS | PARTIAL | PASS | PASS | PARTIAL | PASS | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Nguoi dung | PASS | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Phan quyen | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | SAFE_MIGRATION |
| Cai dat | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | SAFE_MIGRATION |
| Login | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL | N/A | PARTIAL | PARTIAL | SAFE_MIGRATION |
| Shared UI components | N/A | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | SAFE_MIGRATION |

## Screen Notes

### App Shell / Sidebar

- Uses semantic tokens and fixed sidebar behavior correctly.
- Remaining inconsistency is mostly primitive reuse: collapse/logout/mobile nav controls still use local class strings.
- Migration is safe if it does not change route visibility or permission filtering.

### Dashboard

- Strongest Stage 01 adoption among primary screens.
- KPI cards, page shell, header, toolbar, section cards, and notice cards are aligned.
- Remaining gap: chart colors and legend are still hard-coded; chart should receive semantic chart tokens before migration.

### Lich Choi

- Overall structure is aligned, but play-date cards still have custom card/chip/action patterns.
- Date cards need clearer button naming and consistent chip tokens in future UI work.
- No business logic migration required for visual consistency.

### Chi Tiet Ngay

- Uses page shell and shared buttons, but header is manual and create-session area is not fully aligned with `PageHeader`/`SectionCard`.
- Session rows are visually custom and should be normalized without changing create/edit/delete restrictions.

### Chi Tiet Ca

- Highest non-runtime visual risk.
- Completion info, player add/edit form, player rows, modal/player details, and warning states contain dark-only classes and custom controls.
- Any migration must be split and validated around player CRUD, payment state, completion cost, shuttlecock type, and readonly completed-session behavior.

### Dieu Phoi / Runtime

- Protected runtime remains visually divergent by design history.
- Current UI is operationally important; token migration cannot alter queue, court, suggestion, replacement, lock, apply, start, end, cancel, or DB-save semantics.
- Marked protected for implementation sequencing.

### Thu Chi

- Core layout is foundation-aligned.
- Remaining issues are local transaction badges, native controls using class constants, and list/table style needing a reusable table/list primitive.
- Manual and generated finance behavior must remain untouched.

### Kho Cau

- Core layout is foundation-aligned.
- Remaining issues are local movement badges, import/export tab buttons, helper field wrappers, and movement list column consistency.
- Inventory movement semantics must remain untouched.

### Nguoi Dung / Phan Quyen

- Uses SectionCard and pagination, but form controls and role permission rows are still custom.
- Permission mutation logic and role keys must not change during presentation migration.

### Cai Dat

- Page structure is aligned, but settings cards and danger/reset areas are custom.
- Upload/reset/fullscreen/settings persistence must remain behaviorally identical.

### Shared UI Components

- Stage 01 primitives are present and pass as primitives.
- Adoption is incomplete across domain screens, so Stage 01.5 should focus on usage consistency rather than inventing new patterns.
