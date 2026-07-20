# General Club Settings Implementation Plan

Status: IMPLEMENTED

## Preconditions

- Club profile name: AVAILABLE.
- Club logo: AVAILABLE.
- Additional club profile fields such as phone, email, address, website, social links, timezone, and locale: MISSING in the current Settings source, so no UI was added for them.

## Field Preservation Matrix

| Field | Data key | Source | Editable | Default | Validation | Payload mapping | Permission | Required preservation |
|---|---|---|---|---|---|---|---|---|
| Club name | `clubName` | `useBranding()` and local state | Yes | `branding?.clubName || 'Badmin'` | Existing service/API validation | `updateBrandingName(clubName)` sends existing payload | Existing Settings page access | Preserve key, default, handler, normalization, cache invalidation. |
| Logo reference | `logoUrl` | `branding?.logoUrl` | Yes, through existing upload/delete | `null` fallback to text avatar | Existing file accept and backend validation | `uploadBrandingLogo(file)`, `deleteBrandingLogo()` | Existing Settings page access | Preserve upload/delete behavior, storage, handler, cache invalidation. |
| Phone/email/address/description/website/social/timezone/locale | Not present | None | No | Not applicable | Not applicable | Not applicable | Not applicable | Do not add fields or fake configuration UI. |

## Implementation

1. Keep the existing Settings route and section.
2. Improve only the presentation of the `Thông tin CLB` card.
3. Add a compact profile preview that uses existing `BrandLogo`, `clubName`, and `logoUrl`.
4. Improve form grouping, helper text, button hierarchy, focus state, and responsive layout.
5. Preserve all existing handlers, payloads, defaults, validations, permissions, routes, query keys, and mutations.

## Protected Files

- API routes.
- Repositories.
- Services.
- Prisma/database files.
- Auth/session/permission code.
- Runtime, finance, and inventory logic.
- Branding hooks, service payloads, repository behavior, and storage logic.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
