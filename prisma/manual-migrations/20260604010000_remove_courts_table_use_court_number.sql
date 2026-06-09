ALTER TABLE "runtime_courts"
  ADD COLUMN IF NOT EXISTS "court_number" INTEGER;

ALTER TABLE "runtime_matches"
  ADD COLUMN IF NOT EXISTS "court_number" INTEGER;

UPDATE "runtime_courts" rc
SET "court_number" = c."display_order"
FROM "courts" c
WHERE rc."court_id" = c."id"
  AND rc."court_number" IS NULL;

UPDATE "runtime_matches" rm
SET "court_number" = c."display_order"
FROM "courts" c
WHERE rm."court_id" = c."id"
  AND rm."court_number" IS NULL;

ALTER TABLE "runtime_courts"
  ALTER COLUMN "court_number" SET NOT NULL;

ALTER TABLE "runtime_courts"
  DROP COLUMN IF EXISTS "court_id" CASCADE;

ALTER TABLE "runtime_matches"
  DROP COLUMN IF EXISTS "court_id" CASCADE;

DROP TABLE IF EXISTS "courts";
