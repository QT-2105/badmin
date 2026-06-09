-- Manual migration for the existing Neon database.
-- The repository previously had no Prisma migration history, so this script is
-- kept outside prisma/migrations to avoid shadow-database failures.
--
-- Shuttlecock inventory is now stored in balls as the canonical unit.
-- Existing tube/piece stock is preserved by converting through product.pieces_per_tube.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_products' AND column_name = 'pieces_per_tube'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_products' AND column_name = 'balls_per_tube'
  ) THEN
    ALTER TABLE "shuttlecock_products" RENAME COLUMN "pieces_per_tube" TO "balls_per_tube";
  END IF;
END $$;

ALTER TABLE "shuttlecock_products"
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(6) DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_inventory' AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_inventory' AND column_name = 'shuttlecock_product_id'
  ) THEN
    ALTER TABLE "shuttlecock_inventory" RENAME COLUMN "product_id" TO "shuttlecock_product_id";
  END IF;
END $$;

ALTER TABLE "shuttlecock_inventory"
  ADD COLUMN IF NOT EXISTS "quantity_ball" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "avg_cost_per_ball" DECIMAL(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "avg_usage_price_per_ball" DECIMAL(18, 6) DEFAULT 0;

UPDATE "shuttlecock_inventory" inventory
SET
  "quantity_ball" = COALESCE(inventory."total_tubes", 0) * products."balls_per_tube" + COALESCE(inventory."remaining_pieces", 0),
  "avg_cost_per_ball" = COALESCE(inventory."average_cost_per_piece", 0),
  "avg_usage_price_per_ball" = CASE
    WHEN products."balls_per_tube" > 0 THEN COALESCE(products."default_sale_price", 0) / products."balls_per_tube"
    ELSE 0
  END
FROM "shuttlecock_products" products
WHERE inventory."shuttlecock_product_id" = products."id";

ALTER TABLE "shuttlecock_inventory"
  DROP COLUMN IF EXISTS "total_tubes",
  DROP COLUMN IF EXISTS "remaining_pieces",
  DROP COLUMN IF EXISTS "average_cost_per_piece";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_movements' AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shuttlecock_movements' AND column_name = 'shuttlecock_product_id'
  ) THEN
    ALTER TABLE "shuttlecock_movements" RENAME COLUMN "product_id" TO "shuttlecock_product_id";
  END IF;
END $$;

ALTER TABLE "shuttlecock_movements"
  ADD COLUMN IF NOT EXISTS "quantity_ball" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "cost_per_ball" DECIMAL(18, 6),
  ADD COLUMN IF NOT EXISTS "usage_price_per_ball" DECIMAL(18, 6),
  ADD COLUMN IF NOT EXISTS "unit_price" DECIMAL(18, 6),
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(255);

UPDATE "shuttlecock_movements" movement
SET
  "quantity_ball" = CASE
    WHEN movement."movement_type" IN ('SALE', 'USAGE', 'PLAY_USAGE') THEN -1
    ELSE 1
  END * (
    COALESCE(movement."tube_quantity", 0) * products."balls_per_tube" + COALESCE(movement."piece_quantity", 0)
  ),
  "cost_per_ball" = COALESCE(movement."unit_cost_per_piece", 0),
  "usage_price_per_ball" = COALESCE(movement."unit_sale_price", 0),
  "unit_price" = CASE
    WHEN movement."movement_type" = 'IMPORT' THEN COALESCE(movement."unit_cost_per_piece", 0)
    ELSE COALESCE(movement."unit_sale_price", movement."unit_cost_per_piece", 0)
  END,
  "title" = COALESCE(movement."note", movement."movement_type")
FROM "shuttlecock_products" products
WHERE movement."shuttlecock_product_id" = products."id";

UPDATE "shuttlecock_movements"
SET "movement_type" = 'PLAY_USAGE'
WHERE "movement_type" = 'USAGE';

ALTER TABLE "shuttlecock_movements"
  DROP COLUMN IF EXISTS "tube_quantity",
  DROP COLUMN IF EXISTS "piece_quantity",
  DROP COLUMN IF EXISTS "unit_cost_per_piece",
  DROP COLUMN IF EXISTS "unit_sale_price",
  DROP COLUMN IF EXISTS "total_amount",
  DROP COLUMN IF EXISTS "session_id";

ALTER TABLE "shuttlecock_products"
  DROP COLUMN IF EXISTS "default_sale_price",
  DROP COLUMN IF EXISTS "note";
