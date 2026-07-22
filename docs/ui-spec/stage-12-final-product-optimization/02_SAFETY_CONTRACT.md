# Stage 12 Safety Contract

## Non-Negotiable Constraints

Do not change:

- Database
- Prisma
- Migration
- API contracts
- Repository contracts
- Service contracts
- Query keys
- Mutation payloads
- Validation rules
- Authentication
- Authorization
- Permissions
- Routes
- Runtime algorithms
- Queue ordering
- Pairing
- Court assignment
- Match lifecycle
- Finance calculations
- Revenue calculation
- Expense calculation
- Profit calculation
- Inventory calculations
- `current_stock`
- `average_cost`
- Movement semantics

## Protected Runtime Contract

Runtime must preserve:

- contextual route `/sessions/[sessionId]/runtime`
- `WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`
- advisory suggestions only
- operator final authority
- no PLAYING player replacement
- no duplicate suggestion players
- court lifecycle `EMPTY -> READY -> PLAYING -> EMPTY`
- explicit action-driven runtime snapshot commits
- current-state persistence

## Finance Contract

Finance must preserve:

- manual transactions do not require `session_id`
- `NORMAL` and `DEDUCTION` semantics
- title required
- quantity and unit price behavior
- positive `total_amount`
- current report period behavior
- newest/oldest sort only
- revenue, expense and profit formulas

## Inventory Contract

Inventory must preserve:

- all stock changes create movements
- no negative stock
- weighted average cost behavior
- tube/piece conversion behavior
- current stock stored in balls
- movement type semantics

## Settings Contract

Settings must preserve:

- browser-local operational preferences unless owner separately approves a storage change
- max court count behavior
- auto-created voucher preference behavior
- destructive action confirmation behavior

## Shared UI Contract

Shared UI components must not contain:

- business calculations
- permission decisions
- route decisions
- query logic
- mutation logic
- runtime scheduling state
