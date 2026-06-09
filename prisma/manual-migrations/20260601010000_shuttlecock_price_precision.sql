-- Increase per-ball price precision and recover existing import-derived prices.
-- Example: 265000 / 12 = 22083.333333, which cannot be represented by DECIMAL(12,2).

ALTER TABLE "shuttlecock_inventory"
  ALTER COLUMN "avg_cost_per_ball" TYPE DECIMAL(18, 6),
  ALTER COLUMN "avg_usage_price_per_ball" TYPE DECIMAL(18, 6);

ALTER TABLE "shuttlecock_movements"
  ALTER COLUMN "cost_per_ball" TYPE DECIMAL(18, 6),
  ALTER COLUMN "usage_price_per_ball" TYPE DECIMAL(18, 6),
  ALTER COLUMN "unit_price" TYPE DECIMAL(18, 6);

UPDATE "shuttlecock_movements" movement
SET
  "cost_per_ball" = ROUND((movement."cost_per_ball" * product."balls_per_tube")::numeric, 0) / product."balls_per_tube",
  "unit_price" = ROUND((movement."cost_per_ball" * product."balls_per_tube")::numeric, 0) / product."balls_per_tube"
FROM "shuttlecock_products" product
WHERE movement."shuttlecock_product_id" = product."id"
  AND movement."movement_type" = 'IMPORT'
  AND product."balls_per_tube" > 0;

WITH import_totals AS (
  SELECT
    movement."shuttlecock_product_id",
    SUM(movement."quantity_ball") AS imported_quantity,
    SUM(movement."quantity_ball" * movement."cost_per_ball") AS imported_cost,
    SUM(movement."quantity_ball" * movement."usage_price_per_ball") AS imported_usage_value
  FROM "shuttlecock_movements" movement
  WHERE movement."movement_type" = 'IMPORT'
  GROUP BY movement."shuttlecock_product_id"
)
UPDATE "shuttlecock_inventory" inventory
SET
  "avg_cost_per_ball" = CASE
    WHEN import_totals."imported_quantity" > 0 THEN import_totals."imported_cost" / import_totals."imported_quantity"
    ELSE inventory."avg_cost_per_ball"
  END,
  "avg_usage_price_per_ball" = CASE
    WHEN import_totals."imported_quantity" > 0 THEN import_totals."imported_usage_value" / import_totals."imported_quantity"
    ELSE inventory."avg_usage_price_per_ball"
  END,
  "updated_at" = now()
FROM import_totals
WHERE inventory."shuttlecock_product_id" = import_totals."shuttlecock_product_id";
