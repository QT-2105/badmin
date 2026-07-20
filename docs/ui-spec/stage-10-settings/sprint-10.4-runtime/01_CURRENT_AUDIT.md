# Runtime Settings Current Audit

Status: COMPLETED

## Source Findings

| Capability | Group | Current source | Status | Decision |
|---|---|---|---|---|
| Animation preference | Presentation preference | No Settings capability found | MISSING | Do not implement. |
| Compact court cards | Presentation preference | Runtime/card presentation exists, but no persisted preference or Settings control | MISSING | Do not implement. |
| Queue density | Presentation preference | Runtime queue presentation exists, but no persisted preference or Settings control | MISSING | Do not implement. |
| Sound | Presentation preference | No audio/sound preference source found | MISSING | Do not implement. |
| Auto-scroll | Presentation preference | No persisted setting or handler found | MISSING | Do not implement. |
| Display preferences | Presentation preference | Theme/fullscreen controls exist outside Settings; no Runtime Settings panel exists | PARTIAL/OUT OF SCOPE | Do not create Runtime Settings UI. |
| Queue priority | Business rule | `src/lib/badminton-store.ts` | READ_ONLY / PROTECTED | Do not expose as setting. |
| Pairing algorithm | Business rule | `src/lib/badminton-store.ts` | READ_ONLY / PROTECTED | Do not expose as setting. |
| Rest duration/status flow | Business rule | `src/lib/badminton-store.ts` | READ_ONLY / PROTECTED | Do not expose as setting. |
| Court assignment | Business rule | Runtime store/actions | READ_ONLY / PROTECTED | Do not expose as setting. |
| Match generation | Business rule | Runtime store/actions | READ_ONLY / PROTECTED | Do not expose as setting. |
| Status transition | Business rule | Runtime lifecycle | READ_ONLY / PROTECTED | Do not expose as setting. |

## Existing Runtime-Adjacent Settings

- `maxCourtCountPerSession` exists, but it affects schedule/session creation bounds, not runtime algorithm behavior.
- `badmin_active_session_id` exists, but it is runtime recovery state and is read-only, not a user setting.
- Theme and fullscreen controls exist as app controls, but they are not runtime-specific settings and have no Settings form capability.

## Conclusion

Sprint 10.4 has no AVAILABLE runtime presentation preferences inside Settings. Runtime business rules are protected and must not be converted into settings.

Implementation decision: documentation-only, no source code changes.
