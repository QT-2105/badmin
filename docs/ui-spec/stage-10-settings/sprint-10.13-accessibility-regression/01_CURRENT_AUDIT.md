# Accessibility and Regression Current Audit

Status: NOT STARTED

## Accessibility Audit

| Area | Result | Notes |
|---|---|---|
| Heading hierarchy | PASS WITH NOTES | Page has `PageHeader`; sections use `h2`. |
| Landmark | PASS | Settings navigation uses `nav` with `aria-label`. |
| Settings navigation semantics | PASS | Navigation buttons are real buttons and active item uses `aria-current`. |
| Active navigation state | PASS | Active state is visual and semantic. |
| Form labels | PASS | Inputs/switches are wrapped in labels. |
| Required state | PASS WITH NOTES | Branding validation remains server/repository-owned; no new required markers added. |
| Helper text association | PASS | Branding name and max court helper text use `aria-describedby`. |
| Error association | PASS WITH NOTES | Branding save error uses status region; no field-level validation logic changed. |
| Radio group semantics | NOT APPLICABLE | No radio group exists in Settings. |
| Switch labels | PASS | Switches are wrapped by text labels. |
| Accessible names | PASS | Icon-only section toggles now include section-specific labels. |
| Focus-visible | PASS | Navigation, file upload, buttons, inputs and dialog use focus-visible/focus styles. |
| Keyboard navigation | PASS | Buttons/inputs/switches/dialog are keyboard reachable. |
| Dialog focus | PASS | Shared `Dialog` handles initial focus and focus trap. |
| Focus return | PASS | Shared `Dialog` restores prior focused element. |
| Contrast | PASS WITH NOTES | Uses semantic tokens; no source-level contrast regression found. |
| Status not color-only | PASS | Status badges include text labels such as "Chưa lưu", "Đã lưu", "Đang bật". |
| Touch target | PASS | Main buttons and switches are approximately 40px or larger. |
| Reduced motion | PASS | Settings navigation scroll now respects `prefers-reduced-motion`. |
| Screen reader save/error announcement | PASS | Branding save/error message uses `role="status"` and `aria-live="polite"`. |

## Configuration Regression Audit

| Check | Capability status | Result |
|---|---|---|
| Settings route load | AVAILABLE | PASS by build and route guard review. |
| Settings navigation | AVAILABLE | PASS. |
| Direct deep link | PARTIAL | Section IDs exist; no route/query behavior introduced. |
| Permission-restricted sections | AVAILABLE | PASS; route and API guards unchanged. |
| General settings load | AVAILABLE | PASS by source review. |
| Club profile load/save | AVAILABLE | PASS; branding mutation unchanged. |
| Schedule defaults load/save | AVAILABLE | PASS; local setting key and normalization unchanged. |
| Existing sessions unchanged | READ_ONLY | PASS; no session source changes. |
| Runtime preferences load/save | MISSING | Not applicable. |
| Queue order | READ_ONLY | PASS; runtime source untouched. |
| Pairing | READ_ONLY | PASS; runtime source untouched. |
| Court assignment | READ_ONLY | PASS; runtime source untouched. |
| Finance settings load/save | AVAILABLE | PASS; local setting keys unchanged. |
| Revenue/expense/profit | READ_ONLY | PASS; finance source untouched. |
| Inventory settings load/save | MISSING | Not applicable. |
| Current stock / average cost / tube conversion | READ_ONLY | PASS; inventory source untouched. |
| Appearance preferences | PARTIAL | PASS; existing `ThemeToggle` behavior unchanged. |
| Notification preferences/delivery | MISSING | Not applicable; no fake UI. |
| Export/import/backup/restore | MISSING | Not applicable; no fake UI. |
| Read-only settings remain read-only | READ_ONLY | PASS; no editable controls added. |
| Missing capabilities | MISSING | PASS; missing capabilities remain Future Scope. |
| Validation | AVAILABLE | PASS by command validation. |
| Save success/failure/dirty state | AVAILABLE | PASS by presentation review. |
| Cache/reload behavior | AVAILABLE | PASS; query keys and invalidation unchanged. |
| Server authorization | AVAILABLE | PASS; API/auth files untouched. |
| Light/Dark | AVAILABLE | PASS by token usage review. |
| Tablet/Mobile | AVAILABLE | PASS by responsive class review. |

## Required Confirmations

- No hard-coded business value was converted into a dynamic setting.
- No config key changed.
- No default value changed.
- No persistence mechanism changed.
- No fake setting was created.
- No missing backend feature is shown as active.
- No business logic changed.
- No privilege escalation was introduced.
