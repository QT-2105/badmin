# Current Audit

## Source

- Page orchestration: `src/components/settings/settings-page-client.tsx`
- Presentation layer: `src/components/settings/settings-presentation.tsx`
- Local settings contract: `src/lib/app-settings.ts`
- Branding hooks and mutations: `src/hooks/use-branding.ts`
- Destructive services: `src/services/settings-service.ts`

## Existing Capabilities

| Capability | Status | Source | Notes |
| --- | --- | --- | --- |
| Club name | AVAILABLE | Branding API/hook | Manual save behavior exists. |
| Club logo | AVAILABLE | Branding API/hook | Upload/delete behavior exists. |
| Auto court fee transaction | PARTIAL | Local app settings | Browser-local preference. |
| Auto shuttle usage transaction | PARTIAL | Local app settings | Browser-local preference. |
| Max court count per session | PARTIAL | Local app settings | Uses existing normalization. |
| Theme | PARTIAL | Existing theme toggle | No new theme setting. |
| Player image cleanup | AVAILABLE | Settings service/API | Destructive confirmation exists. |
| Match history reset | AVAILABLE | Settings service/API | Destructive confirmation exists. |
| Notifications/export/backup/security settings | MISSING | None | Not shown as editable settings. |

## Findings

| Area | Finding | Priority | Decision |
| --- | --- | --- | --- |
| Navigation | Capability status exists in data but is not visible. | P1 | Show `Có sẵn` / `Một phần` chips. |
| Save feedback | Dirty/saved state is visible but can be more semantic. | P1 | Add bordered semantic state and live region. |
| Toggle rows | Switch rows depend mostly on switch position. | P1 | Add `Bật` / `Tắt` text and focus ring. |
| Destructive feedback | Reset messages should be distinguishable from static warning text. | P1 | Add status/alert feedback containers. |
| Section semantics | Settings sections can better expose headings to assistive tech. | P2 | Add `aria-labelledby` to sections. |

## Protected Behavior Observed

- `SettingsPageClient` owns all settings state, handlers, local setting writes, branding mutation calls and destructive service calls.
- `settings-presentation.tsx` only receives props and renders UI.
- Existing local setting keys remain `autoCreateCourtFeeTransaction`, `autoCreateShuttlecockUsageTransaction` and `maxCourtCountPerSession`.
