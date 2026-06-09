ALTER TABLE "play_sessions"
  ADD COLUMN IF NOT EXISTS "shuttlecock_product_name" VARCHAR(255);
