# Regression Checklist

Status: Draft for future implementation QA

## Runtime Logic

- [ ] Matchmaking algorithm unchanged.
- [ ] Queue source unchanged.
- [ ] Waiting queue order unchanged.
- [ ] Queue sorting unchanged.
- [ ] Priority mapping unchanged.
- [ ] Player runtime status unchanged.
- [ ] Runtime status unchanged.
- [ ] Player status unchanged.
- [ ] Match generation unchanged.
- [ ] Auto pairing unchanged.
- [ ] Manual pairing unchanged.
- [ ] Gender/level pairing criteria unchanged.
- [ ] Court assignment unchanged.
- [ ] Current match references unchanged.
- [ ] Match assignment unchanged.
- [ ] Start/end match unchanged.
- [ ] Swap pair unchanged.
- [ ] Apply match unchanged.
- [ ] Match history source unchanged.
- [ ] Runtime hydration unchanged.
- [ ] Runtime synchronization unchanged.
- [ ] Zustand store unchanged.
- [ ] Zustand actions unchanged.
- [ ] React Query behavior unchanged.
- [ ] Query keys unchanged.
- [ ] Mutations unchanged.
- [ ] API payloads unchanged.
- [ ] Repository queries unchanged.
- [ ] Service calculations unchanged.
- [ ] Routes unchanged.
- [ ] Permissions unchanged.
- [ ] API/repository/service/database/Prisma unchanged.

## Operational Flow

- [ ] Operator can leave runtime safely.
- [ ] Operator can open player list.
- [ ] Operator can open match history.
- [ ] Operator can auto-generate suggestions.
- [ ] Operator can apply suggestion.
- [ ] Operator can replace suggested player.
- [ ] Operator can lock suggestion.
- [ ] Operator can cancel ready court.
- [ ] Operator can start match.
- [ ] Operator can end match.

## Visual QA

- [ ] Runtime frame readable.
- [ ] Header compact.
- [ ] Court grid readable.
- [ ] Court Card readable.
- [ ] Waiting players readable.
- [ ] Next match readable.
- [ ] Match history readable.
- [ ] Tablet landscape usable.
- [ ] Tablet portrait usable.
- [ ] Mobile smoke usable.

## Accessibility

- [ ] Keyboard focus visible.
- [ ] Icon buttons labelled.
- [ ] Disabled state visible.
- [ ] State not conveyed by color alone.
