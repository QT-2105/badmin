# Architecture Decision Records

Version: 2026-06-09

## ADR-001: Session-Centric Runtime

Decision: Runtime scheduling exists only inside a Play Session.

Rationale: Badminton operation is organized by session. Global runtime navigation creates confusion and breaks operational context.

## ADR-002: Current-State Runtime Persistence

Decision: Persist current runtime snapshots, not event streams.

Rationale: Operators need recovery and continuity, not replay architecture.

## ADR-003: Court Count Generates Runtime Courts

Decision: Runtime courts are derived from `play_sessions.court_count` and persisted by `court_number`.

Rationale: The product does not currently need a physical court catalog. This reduces DB and source complexity.

## ADR-004: Remove Standalone Waiting Queue Tab

Decision: The separate waiting queue tab was removed from the court-management region.

Rationale: Current UI focuses on courts and next suggestions. Player management is handled by the player panel and full-screen player list.

## ADR-005: Next Suggestions Stay In Court Management Area

Decision: Courts and next-match suggestions share the `QUẢN LÝ SÂN` area.

Rationale: Operators arrange courts and upcoming matches as one workflow.

## ADR-006: Explicit Runtime DB Commits

Decision: Runtime avoids continuous DB writes and commits snapshots on important operator actions.

Rationale: Live operation must stay responsive and avoid unstable realtime DB select/write loops.

## ADR-007: Shuttlecock Inventory Movement Model

Decision: Shuttlecock stock uses product, inventory, and movements.

Rationale: Current stock must be fast to read, while movements provide source records for import/sale/play usage/adjustment.

## ADR-008: Session Profit Includes Court Cost Even If Voucher Disabled

Decision: Per-session profit always subtracts court cost and shuttlecock usage cost.

Rationale: Settings only control whether finance vouchers are auto-created. They do not change real session economics.

## ADR-009: Settings Are Browser-Local

Decision: Current settings are stored in localStorage.

Rationale: Settings are simple operational preferences, not enterprise configuration.
