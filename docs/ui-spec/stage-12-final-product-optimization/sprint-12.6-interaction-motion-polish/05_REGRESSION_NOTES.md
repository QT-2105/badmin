# Sprint 12.6 Regression Notes

## Keyboard Regression

Source-level checks:

- Button focus ring retained.
- Input/select/checkbox/radio/switch focus-visible rings retained.
- ActionMenu ArrowUp/ArrowDown/Escape behavior unchanged.
- Dialog and Drawer focus trap unchanged.
- AppShell navigation focus styles retained.

## Reduced Motion Regression

Confirmed by source:

- Global `prefers-reduced-motion` CSS remains active.
- Sidebar collapse width/margin transition now opts out with `motion-reduce:transition-none`.
- Form controls and menu item transitions now opt out explicitly.
- FormSection chevron transition now opts out explicitly.

## Runtime Timing Regression

No Runtime files changed. Unchanged by source scope:

- Countdown.
- Match timer.
- Runtime refresh interval.
- Match lifecycle timing.
- Queue/pairing/court assignment flow.

## Deferred

- Browser keyboard walk-through was not run.
- OS-level reduced-motion browser verification was not run.
