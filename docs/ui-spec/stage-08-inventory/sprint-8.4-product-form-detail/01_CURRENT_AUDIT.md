# Current Audit

Status: Complete

Product form uses `productForm`, `editingProductId`, `submitProduct`, and `editProduct`. These contracts are protected.

## Field Preservation Table

| Field | Data key | Field type | Default value | Validation | Payload mapping | Editable/read-only | Required preservation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tên loại cầu | `productForm.name` | Text input | `''` | `required` input attribute | Sent inside `productForm` for create/update | Editable | Key, required state, and handler preserved. |
| Hãng | `productForm.brand` | Text input | `''` | Optional | Sent inside `productForm` for create/update | Editable | Optional state and handler preserved. |
| Quả/ống | `productForm.ballsPerTube` | Number input | `12` | `min={1}` | Sent inside `productForm` for create/update | Editable | Default 12, min 1, number type, and handler preserved. |
| Trạng thái | `productForm.status` | Select | `ACTIVE` | Existing options only | Sent inside `productForm` for create/update | Editable | Option values `ACTIVE`/`INACTIVE` and handler preserved. |
| Current stock | No form field | N/A | N/A | N/A | Not sent by product form | Read-only in list | No stock edit field added. |
| Average cost | No form field | N/A | N/A | N/A | Not sent by product form | Read-only in list | No average-cost edit field added. |
| Default sale price / Note | No current form field | N/A | N/A | N/A | Not sent by product form | N/A | No new field added. |

## Findings

- Form fields were correct but visually compressed into one dense row.
- The form needed stronger hierarchy to distinguish create vs edit state.
- Helper text can clarify that stock and average prices are controlled by movements, not product CRUD.
- Safe change is presentation-only: form container, field spacing, helper text, required marker, status badge, and submit alignment.
