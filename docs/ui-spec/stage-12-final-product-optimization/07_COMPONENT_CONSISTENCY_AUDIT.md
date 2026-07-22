# Component Consistency Audit

## Shared Components In Use

- `Button`
- `IconButton`
- `Surface`
- `SectionCard`
- `PageShell`
- `PageHeader`
- `PageSummaryGrid`
- `StatCard`
- `StatusBadge`
- `DataTable`
- `FilterBar`
- `FormSection`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `Switch`
- `Radio`
- `Dialog`
- `Drawer`
- `ConfirmationDialog`
- `ActionMenu`
- `Skeleton`
- feedback states
- pagination controls

## Consistency Status

| Component Area | Status | Notes |
| --- | --- | --- |
| App page shell | Good | Stage 11 hardened `PageShell`/`PageLayout`. |
| Headers/toolbars | Good with notes | Runtime remains custom. |
| Cards/surfaces | Good with notes | Runtime custom surfaces require visual QA. |
| Buttons | Good | Shared variants and touch/focus rules in place. |
| Forms | Good | Shared primitives hardened. |
| Tables | Good with notes | DataTable supports mobile cards; Users remains custom editable table. |
| Dialog/Drawer | Good | Shared portal/focus behavior in place. |
| Feedback states | Good with notes | Toast remains future scope. |

## P1 Risks

- Custom Runtime panels and Users table should be checked for alignment with shared interaction states.
- Session Detail remains a large mixed presentation/state component.
- Runtime dashboard remains large and protected; changes need strong evidence.

## Stage 12 Rule

Only normalize components when there is a confirmed visual or accessibility issue. Do not force every module into the same primitive if the current module has protected workflow-specific behavior.
