# Current Audit

Status: Planned

Current UI uses `PageShell`, `PageHeader`, and `ToolbarCard` for the report period. The filter works but should be visually compact and aligned with dashboard/reporting patterns.

## Risks

- Changing control names or handlers would alter report period behavior.
- Replacing controls must preserve `value`, `onChange`, and input types.
