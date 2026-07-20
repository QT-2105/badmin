# Current Audit

Status: Planned

The form is conditional on `finance.manage`, uses local state, and submits `transactionType`, `adjustmentType`, `category`, `title`, `quantity`, `unitPrice`, and `note`.

## Risks

- FormSection migration must not drop controlled values.
- Submit button disabled state must remain tied to `createTransaction.isPending`.
