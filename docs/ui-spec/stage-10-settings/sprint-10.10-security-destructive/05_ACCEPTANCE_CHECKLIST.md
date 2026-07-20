# Security and Destructive Actions Acceptance Checklist

- [x] Scope reviewed.
- [x] Capability status confirmed.
- [x] Allowed files respected.
- [x] Protected files unchanged.
- [x] Business logic unchanged.
- [x] API/database/Prisma/repository/service unchanged.
- [x] Query keys and mutations unchanged.
- [x] Permissions unchanged.
- [x] Routes unchanged.
- [x] Light/dark presentation checked where applicable.
- [x] Responsive behavior checked where applicable.
- [x] Accessibility checked where applicable.
- [x] Validation commands recorded.

## Notes

- Settings remains accessible only through existing `settings.manage` route guard.
- Server authorization remains the security boundary for destructive APIs.
- Confirmation presentation changed from browser-native confirm to shared `Dialog`; destructive handlers and payloads are unchanged.
