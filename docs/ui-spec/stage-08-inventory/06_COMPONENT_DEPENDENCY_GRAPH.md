# Inventory Component Dependency Graph

## Route Graph

```text
/inventory
-> src/app/inventory/page.tsx
-> requirePageUser('/inventory')
-> AppShell
-> InventoryPageClient
```

## Requested Baseline Graph

```text
Inventory Page
-> Header / Filters
-> Inventory Query
-> Product Data
```

```text
Inventory Page
-> KPI Summary
-> Existing stock summary data
```

```text
Inventory Page
-> Product List
-> Product actions
-> Product mutation
```

```text
Inventory Page
-> Movement List
-> Movement data
-> Movement actions
```

```text
Movement Form
-> Existing validation
-> Existing submit handler
-> Existing inventory mutation
-> Stock update logic
```

## Product Query Graph

```text
InventoryPageClient
-> useInventoryProducts
-> fetchProducts
-> GET /api/inventory/products
-> listShuttlecockProducts
-> prisma.shuttlecock_products
-> shuttlecock_inventory
-> shuttlecock_movements
```

## Product Options Graph

```text
InventoryPageClient / session completion product selects
-> useShuttlecockProductOptions
-> fetchProductOptions
-> GET /api/inventory/products?view=options
-> listShuttlecockProductOptions
-> active shuttlecock_products
```

## Movement Query Graph

```text
InventoryPageClient
-> useInventoryMovements
-> fetchMovements
-> GET /api/inventory/movements
-> listShuttlecockMovements
-> prisma.shuttlecock_movements
```

## Mutation Graph

```text
InventoryPageClient
-> useInventoryMutations
-> createProduct / updateProduct / deleteProduct / createMovement
-> inventory-service
-> /api/inventory/products
-> /api/inventory/products/[productId]
-> /api/inventory/movements
-> inventory-repository
-> React Query invalidation
```

Invalidated query keys:

- `['inventory', 'products']`
- `['inventory', 'product-options']`
- `['inventory', 'movements']`
- `['dashboard', 'summary']`

## Presentation Graph

```text
InventoryPageClient
-> PageShell
-> PageHeader
-> ToolbarCard / future FilterBar candidate
-> MetricCard / future StatCard candidate
-> SectionCard
-> Product table / future DataTable candidate
-> Product form
-> Import form
-> Outbound movement form
-> Movement history / future DataTable candidate
-> PaginationControls
```

## Protected Stock Logic Graph

```text
createShuttlecockMovement
-> normalizeMovementType
-> fetch product + inventory
-> movement-specific validation
-> quantity conversion
-> no-negative-stock validation
-> weighted average update for IMPORT
-> create shuttlecock_movements row
-> update shuttlecock_inventory row
```

## Movement Type Graph

```text
IMPORT
-> quantityTube * ballsPerTube
-> update average cost and usage price
```

```text
SALE
-> quantityTube * ballsPerTube
-> negative movement quantity
-> preserve inventory average values
```

```text
PLAY_USAGE
-> user-facing consumption
-> quantityBall
-> negative movement quantity
-> preserve inventory average values
```

```text
ADJUSTMENT
-> actualQuantityBall - oldQuantity
-> movement may be positive or negative
-> preserve inventory average values
```

```text
OTHER
-> quantityTube * ballsPerTube + looseBalls
-> negative movement quantity
```

Stage 08 may not modify the protected data, mutation, or stock logic graphs.
