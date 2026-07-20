# Stage 08 Scope

## In Scope

- Inventory page header.
- Report-period filter presentation.
- Top inventory metrics.
- Product catalog table presentation.
- Product form presentation.
- Product detail/readability presentation.
- Import form presentation.
- Sale form presentation.
- Consumption/play-usage form presentation.
- Adjustment form presentation.
- Movement history presentation.
- Pagination presentation.
- Loading, empty, error, success, and warning states.
- Responsive behavior for desktop, tablet, and mobile.
- Light/dark mode consistency.
- Accessibility improvements that do not change business behavior.

## Out of Scope

- Current stock calculation.
- Weighted average cost formula.
- Weighted average usage price formula.
- Tube-to-ball conversion.
- Negative stock prevention.
- Movement transaction behavior.
- Movement order.
- Movement type semantics.
- Product ID semantics.
- Import, sale, play usage, adjustment, and other movement payloads.
- `CONSUMPTION` as a user-facing concept maps to the existing `PLAY_USAGE` movement value. Stage 08 must not rename the API/DB value.
- API, repository, service, hook, Prisma, database, permission, route, or validation changes.
- New reports or new inventory features.
- Warehouse, ERP, batch, supplier, barcode, or lot-tracking systems.

## Non-Negotiable Constraint

Inventory remains lightweight operational stock tracking for badminton shuttlecocks. It must not become warehouse management software.
