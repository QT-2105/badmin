ALTER TABLE session_players
  ADD COLUMN IF NOT EXISTS player_tags TEXT[] NOT NULL DEFAULT ARRAY['NOT_ARRIVED']::TEXT[];

UPDATE session_players
SET player_tags = ARRAY['NOT_ARRIVED']::TEXT[]
WHERE player_tags IS NULL OR cardinality(player_tags) = 0;
