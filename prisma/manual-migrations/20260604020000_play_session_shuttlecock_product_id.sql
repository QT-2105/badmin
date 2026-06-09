ALTER TABLE "play_sessions"
  ADD COLUMN IF NOT EXISTS "shuttlecock_product_id" UUID;

UPDATE "play_sessions" ps
SET "shuttlecock_product_id" = sp."id"
FROM "shuttlecock_products" sp
WHERE ps."shuttlecock_product_id" IS NULL
  AND ps."shuttlecock_product_name" = sp."name";
