# Implementation Plan

1. Record current columns and row render output.
2. Improve list presentation, preferring `DataTable` if safe.
3. Keep sort, page size, current page, and visible transactions calculation unchanged.
4. Validate.

## Completion Criteria

- Same rows and columns are visible.
- Numeric columns align right.
- Empty state remains inside list.
- Pagination unchanged.
