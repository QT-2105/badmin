# Settings Safety Contract

Stage 10 only changes Presentation Layer for configuration capabilities that already exist.

## Must Not Change

- Configuration keys.
- Configuration value semantics.
- Configuration storage.
- Environment variable names.
- Environment variable semantics.
- Feature flag keys.
- Feature flag semantics.
- Default values.
- Fallback behavior.
- Validation rules.
- Save payload.
- Reset payload.
- API contracts.
- Query keys.
- Mutations.
- Cache invalidation.
- Repositories.
- Services.
- Database.
- Prisma.
- Routes.
- Permissions.
- Authentication.
- Authorization.
- Runtime algorithms.
- Queue ordering.
- Pairing.
- Court assignment.
- Finance calculations.
- Inventory calculations.
- Current stock.
- Average cost.
- Quantity conversion.
- Notification delivery logic.
- Export logic.
- Import logic.
- Backup logic.
- Restore logic.

## Forbidden

- Do not treat UI visibility as a security control.
- Do not create a save button when the capability has no existing save handler.
- Do not create reset-to-default controls when the capability has no existing reset handler.
- Do not put business calculations into shared settings components.
- Do not add a config table, API, repository, or service.
- Do not implement missing capability UI.
- Do not create fake editable forms for read-only configuration.

## Specific Settings Invariants

- `badmin_app_settings` remains the localStorage key for browser-local app settings.
- `autoCreateCourtFeeTransaction` default remains `false`.
- `autoCreateShuttlecockUsageTransaction` default remains `true`.
- `maxCourtCountPerSession` default remains `3`.
- `maxCourtCountPerSession` normalization remains integer clamped from `1` to `12`.
- Branding uses the existing `app_settings` row with id `default`.
- Branding write APIs continue to require `settings.manage`.
- Destructive maintenance APIs continue to require `settings.manage`.
- S3 paths and cleanup behavior remain repository-owned.

## If UI Requires Logic Change

Do not implement. Record the capability as Out of Scope with file, reason, and risk.

## Missing Capability Rule

If a capability does not exist:

- Mark it as `MISSING`.
- Do not code the feature.
- Record it as `Future Scope`.
