# Implementation Plan

1. Preserve adjustment field visibility. Done.
2. Preserve absolute-stock input mode. Done.
3. Preserve `actualQuantityBall` state and payload. Done.
4. Preserve repository-side difference calculation. Done.
5. Improve current stock, final stock, and adjustment direction presentation only. Done.
6. Improve labels, helper copy, and responsive grouping only. Done.
7. Validate. Done.

## Implementation Guardrails

- Do not convert actual stock into delta before submit.
- Do not send `quantityBall` for `ADJUSTMENT`.
- Do not send `quantityTube` for `ADJUSTMENT`.
- Do not send `salePricePerTube` for `ADJUSTMENT`.
- Do not add a new validation rule beyond current UI `min={0}` and repository validation.
