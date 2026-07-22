# Sprint 12.7C Current Audit

## Runtime UI

| Area | Current issue | Decision |
| --- | --- | --- |
| Court Card surface | Playing/ready states are readable but some glow/shadow adds visual weight. | Reduce card shadow/glow while keeping status tone. |
| Empty court | Empty state text is present but low hierarchy. | Add clearer two-line presentation. |
| Playing timer | Timer pulse does not account for reduced-motion at component level. | Respect `useReducedMotion` for timer animation. |
| Player names | Names are readable but tight in court card teams. | Slightly strengthen typography and spacing. |
| Gender differentiation | Gender symbol can be ambiguous for non-binary/unknown values. | Show existing gender text with semantic tint. |
| Next-match actions | Action buttons are visually clear but under the 40px touch target baseline. | Raise action height to `h-10`. |
| Next-match score | Emoji-based score indicator adds visual noise. | Use text + semantic tone, using existing score only. |
| Queue primary action | Gradient competes with operational controls. | Use simpler cyan semantic action surface. |

