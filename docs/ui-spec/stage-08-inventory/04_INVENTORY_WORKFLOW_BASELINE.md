# Inventory Workflow Baseline

## Product Catalog

1. Operator views product list.
2. Operator may open product form if they have `inventory.manage`.
3. Operator creates a product with name, brand, balls per tube, and status.
4. Operator may edit a product.
5. Operator may delete a product only if backend rules allow it.

Stage 08 must not change product validation, payload mapping, or delete behavior.

## Import Flow

1. Operator opens `Phiếu nhập kho`.
2. Operator selects product.
3. Operator enters title, tube quantity, cost price per tube, usage price per tube, and note.
4. UI submits existing `IMPORT` payload.
5. Repository converts tubes to balls, recalculates weighted averages, creates movement, and updates inventory in a transaction.

Stage 08 must not change import conversion or average formulas.

## Outbound Flow

1. Operator opens `Phiếu xuất kho`.
2. Operator selects outbound type.
3. Operator selects product.
4. Operator enters title and type-specific quantity/price fields.
5. UI submits existing payload.
6. Repository validates stock and creates movement.

Supported movement types:

- `SALE`
- `PLAY_USAGE`
- `ADJUSTMENT`
- `OTHER`

Stage 08 must not change movement type meaning or payload mapping.

## Movement History

Movement history renders existing newest-first data from `useInventoryMovements`.

Stage 08 must not add sorting, filtering, or movement reordering.

