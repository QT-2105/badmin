# Accessibility and Regression Acceptance Checklist

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

- `npm test` and E2E commands are not available in `package.json`.
- Accessibility changes are limited to section disclosure semantics and reduced-motion scroll behavior.
- Regression is source-review plus required command validation; no production data was modified.
