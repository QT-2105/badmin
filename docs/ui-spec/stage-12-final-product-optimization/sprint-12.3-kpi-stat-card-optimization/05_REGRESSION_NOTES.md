# Sprint 12.3 Regression Notes

## Finance Regression

Source files related to Finance calculation/orchestration were not edited.

Must remain unchanged:

- income total
- expense total
- profit
- transaction payload
- category and deduction semantics
- report period
- sorting and pagination

## Inventory Regression

Source files related to Inventory calculation/orchestration were not edited.

Must remain unchanged:

- `current_stock`
- `average_cost`
- tube/piece conversion
- stock value
- movement semantics
- movement payload
- movement ordering

## Runtime Regression

Runtime files were not edited.

Must remain unchanged:

- queue order
- pairing
- court assignment
- match lifecycle
- then-current `JUST_FINISHED` semantics (historical; superseded 2026-08-13)
