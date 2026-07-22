# Sprint 12.6 Interaction State Matrix

| Component / Area | Hover | Active / pressed | Selected | Focus-visible | Disabled | Loading | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Button | Existing token hover | Existing opacity feedback | Caller-defined | Visible ring | Existing disabled opacity | Spinner plus `aria-busy` from Sprint 12.5 | Preserved |
| Form controls | Border/color only | Native | Checked state | Visible ring | Existing disabled contrast | N/A | Added explicit transition guard |
| ActionMenu | Row hover only | `onSelect` unchanged | N/A | Focus row background | Disabled opacity | N/A | Added transition guard |
| FormSection collapse | Existing button hover | Button pressed | Expanded chevron | Button focus ring | Disabled lock | N/A | Added chevron transition guard |
| AppShell sidebar | Nav item hover | N/A | Active state text + style | Visible ring | Permission controls visibility unchanged | Logout existing | Added collapse transition guard |
| Dialog/Drawer | Overlay behavior unchanged | N/A | N/A | Focus trap | Close lock preserved | Confirmation lock preserved | Existing global support |
| Runtime | Protected local motion | Protected | Protected | Protected | Protected | Protected | No files changed |

## Dragging / Drop Target

No shared drag/drop target primitives were found in the reviewed source. No drag/drop logic was added.
