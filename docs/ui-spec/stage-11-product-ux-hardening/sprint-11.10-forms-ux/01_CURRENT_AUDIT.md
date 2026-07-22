# Sprint 11.10 — Current Forms Audit

## Shared Controls

| Control | Current risk | Sprint result |
| --- | --- | --- |
| Input | Focus and invalid states were not consistently semantic at the primitive level. | `focus-visible`, `aria-invalid`, date/time tabular numbers, and numeric right alignment standardized. |
| Select | Invalid state was consumer-dependent. | Optional `invalid` prop and `aria-invalid` support added. |
| Textarea | Invalid state was consumer-dependent. | Optional `invalid` prop and `aria-invalid` support added. |
| Checkbox | Touch target was compact. | Size increased to a more touch-friendly primitive while preserving input type and props. |
| Radio | No shared primitive existed. | Presentation-only `Radio` primitive added. |
| Switch | Touch target and reduced-motion presentation needed hardening. | Size, focus-visible, disabled, and `motion-reduce` presentation standardized. |
| FormMessage | Error message was visual only by default. | `role="alert"` added. |
| Required state | No shared required marker. | Presentation-only `RequiredMark` added. |

## Source Form Candidates Reviewed

| Area | Finding | Action |
| --- | --- | --- |
| Finance manual transaction form | Numeric/currency fields needed clearer labels, units, and helper linkage. | Updated quantity and unit-price labels/helper text only. |
| Schedule create/edit session forms | Time and court-count controls needed clearer labels and numeric unit helper. | Updated labels/helper text and tablet form columns only. |
| Inventory forms | Already rely heavily on existing labels and preserve stock formulas; broader changes deferred to avoid calculation risk. | No Sprint 11.10 source change. |
| Users forms | Existing create/edit controls were hardened in Stage 09 and shared primitive changes apply. | No Sprint 11.10 source change. |
| Settings forms | Existing Settings form feedback was hardened in Stage 10 and shared primitive changes apply. | No Sprint 11.10 source change. |

## Risk Classification

### P0

- None found after implementation. Protected diff is clean and validation passes.

### P1

- Some domain forms still use local label patterns instead of structured `FormLabel`/`FormDescription`/`FormMessage` composition. Deferred because a broad migration could create noisy diffs without behavior benefit.

### P2

- Browser visual QA remains for exact helper/error spacing across all forms and viewports.

