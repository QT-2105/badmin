# Implementation Plan

1. Check desktop, laptop, tablet landscape, tablet portrait, and mobile smoke layouts. Done.
2. Adjust KPI grid to support tablet landscape density. Done.
3. Adjust form grids to use tablet-friendly two-column layouts before wide desktop. Done.
4. Adjust form padding and submit buttons for mobile/tablet touch ergonomics. Done.
5. Preserve DataTable internal horizontal overflow for product and movement lists. Done.
6. Preserve all fields, actions, handlers, and data. Done.
7. Validate. Done.

## Implementation Notes

- KPI grid now supports three columns at `lg` while preserving six-column wide desktop layout.
- Product/import/outbound forms use `md:grid-cols-2` and wider `xl` custom tracks.
- Primary form actions use full-width on mobile and compact width from small screens upward.
- Critical inventory actions remain visible; no action was hidden or moved into a new workflow.
