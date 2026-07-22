# Typography Matrix

## Matrix

| Element | Current baseline | Risk | RC check |
| --- | --- | --- | --- |
| Page title | `PageHeader` and `text-page-title` | Low | Verify consistent scale across Dashboard, Schedule, Finance, Inventory, Users, Settings. |
| Section title | `text-section-title` or local runtime titles | Low | Verify runtime headings remain compact and readable. |
| KPI value | `StatCard`, tabular numeric classes | Low | Verify long currency wraps without clipping. |
| Table header | `DataTable` and custom table headers | Medium | Users and permission matrix use custom tables; verify header hierarchy. |
| Helper text | `formLabelClass`, local text-xs helpers | Medium | Some helpers are dense and should be QA'd on mobile. |
| Runtime labels | direct `text-[10px]`, `text-[11px]` | Medium | Needed for density, but real tablet readability must be checked. |
| Badge labels | `StatusBadge` text labels | Low | Must remain text-based, not color-only. |
| Form labels | shared classes plus local labels | Low | Verify `aria-describedby` remains correct. |

## Findings

- Typography is generally consistent after Stage 11.
- Runtime intentionally uses smaller dense labels; this is acceptable only if tablet readability is confirmed.
- The most likely typography issues are truncation and line wrapping, not missing hierarchy.

