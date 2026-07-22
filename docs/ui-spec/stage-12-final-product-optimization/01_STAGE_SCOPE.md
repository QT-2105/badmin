# Stage 12 Scope

## Scope Lock

Stage 12 is presentation-first release-candidate hardening.

Allowed work:

- final visual polish
- token cleanup
- color consistency
- typography consistency
- surface/elevation consistency
- KPI/stat-card consistency
- loading/empty/error/success state polish
- interaction state polish
- reduced-motion polish
- responsive polish
- accessibility polish
- browser/device QA documentation
- presentation-only render optimization with baseline and regression evidence

## Strictly Protected

Stage 12 must not change:

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

## Presentation Logic Rule

Presentation logic can be optimized only when all are true:

1. external behavior is unchanged
2. technical reason is documented
3. baseline exists before change
4. regression check exists after change
5. no business logic moves into shared UI

## Stop Rule

If a proposed optimization requires protected logic changes:

1. do not implement it
2. record it as Out of Scope
3. name the file and function
4. describe expected benefit
5. describe risk
6. wait for separate approval
