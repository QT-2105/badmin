# UI/UX Constitution

Version: 2026-06-09

## Design Character

Badmin UI must feel operational, compact, modern, and touch-friendly. It is a live tool, not a marketing page or generic admin dashboard.

## App Shell

Desktop/tablet shell:

- fixed sidebar
- collapsible menu persisted in `localStorage`
- clicking nav while collapsed must keep it collapsed
- root nav labels: Dashboard, Lịch chơi, Thu chi, Kho cầu, Cài đặt

Mobile shell:

- sticky top nav
- horizontal compact navigation

## Expand/Collapse Pattern

Cards that support expansion must use consistent labels:

- `Mở rộng`
- `Thu gọn`

Cards should be compact by default when the form is not constantly needed, especially in finance, inventory, settings-like controls, and completion info.

## Number Inputs

Numeric fields should be simple typed inputs. Avoid UI that encourages accidental stepper changes during live operation.

## Runtime Layout

Runtime layout prioritizes:

- compact top bar
- small stats header
- one large `QUẢN LÝ SÂN` area
- courts and next suggestions in the same operational region
- player panel at bottom on tablet/desktop
- full-screen player list available from the `Người chơi` button

Do not reintroduce a separate dead `Hàng chờ` tab unless it serves a clear operational purpose.

## Readability

User-facing player levels must use labels, not raw numbers. Use helpers in `src/lib/player-labels.ts`.

## Completion UX

Session completion is a high-impact action. It should:

- show required fields
- show temporary profit before completion
- validate unpaid players and missing completion inputs
- ask for confirmation
- lock runtime after completion

## Finance UX

Thu chi UI currently:

- shows period filter above metrics
- defaults to current month
- supports month/year reporting
- creates manual vouchers without selecting a session
- requires title before submit
- sorts transaction list only by newest or oldest
- keeps create form collapsible with `Mở rộng` / `Thu gọn`

Do not reintroduce complex filter stacks unless there is a clear operational need.

## Inventory UX

Kho cầu UI currently:

- shows period filter for sale and play-usage reports
- shows top metrics for product count, stock in tubes/balls, stock value, sales, and play usage cost
- keeps product form collapsible
- keeps import/outbound forms hidden behind tab-like buttons
- uses a wide scrollable product table
- uses a wide movement history layout with longer title/note column

Preserve this compact operational layout.
