# Before / After

## Baseline

| Requirement | Baseline |
| --- | --- |
| Component selected | `src/components/settings/settings-presentation.tsx` |
| Line count before | 762 |
| State owner | `SettingsPageClient` |
| Handler owner | `SettingsPageClient` |
| Query/mutation owner | `SettingsPageClient` |

## Problem Observed

- Capability status chip logic was inline inside `SettingsNavigation`.
- Branding save-state pill logic was inline inside `BrandingSection`.
- Branding feedback and destructive feedback repeated similar status/error class and ARIA mapping.
- These were UI-only mappings but repeated enough to increase presentation maintenance risk.

## Solution

Extracted local presentation helpers:

- `CapabilityStatusChip`
- `SaveStatePill`
- `SettingsFeedbackMessage`

## Risk

| Risk | Mitigation |
| --- | --- |
| Helper accidentally changes status text. | Kept the exact visible labels: `Có sẵn`, `Một phần`, `Chưa lưu`, `Đã lưu`, `Không đổi`. |
| Helper changes callback or data flow. | Helpers receive primitive presentation props only and no handlers. |
| Helper hides business logic. | Helpers do not read config values, settings state, hooks, store or permissions. |
| Line count increases. | Accepted because repeated inline mapping decreased and component boundaries are clearer. |

## After

| Result | Value |
| --- | --- |
| Line count after | 791 |
| Parent orchestration changes | None |
| Query/mutation changes | None |
| Payload changes | None |
| Config key changes | None |
| Typecheck after small change | PASS |
