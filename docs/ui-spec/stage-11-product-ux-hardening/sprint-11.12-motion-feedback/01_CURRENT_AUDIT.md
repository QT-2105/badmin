# Sprint 11.12 — Current Motion And Feedback Audit

## Motion/Feedback Matrix

| Area | Finding | Result |
| --- | --- | --- |
| Hover | Shared surfaces/buttons had different transition scopes. | Standardized transition scope on shared Button, Surface, StatCard, and StatusBadge. |
| Pressed | Shared Button had no pressed feedback. | Added lightweight `active:opacity-90`; no transform delay or business timing. |
| Focus | Focus-visible was already standardized in prior sprints. | Preserved. |
| Loading | Shared Button and LoadingState used spin animation. | Added `motion-reduce:animate-none`. |
| Skeleton | Skeleton used pulse animation. | Added `motion-reduce:animate-none`. |
| Toast | No source toast implementation exists. | Marked N/A; no fake toast created. |
| Dialog transition | Shared Dialog had portal/focus but no entry motion utility. | Added lightweight `motion-overlay-in` and `motion-dialog-in`. |
| Drawer transition | Shared Drawer had portal/focus but no entry motion utility. | Added placement-aware entry utilities. |
| Success state | Shared SuccessState uses FeedbackState. | Gains consistent feedback entry motion and reduced-motion support. |
| Error state | Shared ErrorState uses FeedbackState. | Gains consistent feedback entry motion and reduced-motion support. |
| Reduced motion | Global media query existed. | Added explicit utility opt-out classes for new motion utilities. |

## Timing Audit

Static search found existing timing-related code in:

- `src/components/cards/court-card.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/lib/badminton-store.ts`
- `src/app/providers.tsx`
- `src/hooks/use-auth.ts`

Sprint 11.12 did not modify countdowns, match timers, refresh intervals, retry intervals, store timing, query retry behavior, or runtime timing semantics.

## Risk Classification

### P0

- None after validation. No protected timing or runtime logic changed.

### P1

- Toast state remains N/A because the app has no toast primitive or provider.

### P2

- Browser visual QA remains needed for exact dialog/drawer entry feel and reduced-motion preference behavior.

