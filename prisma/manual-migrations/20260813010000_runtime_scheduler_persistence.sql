BEGIN;

ALTER TABLE play_sessions
  ADD COLUMN IF NOT EXISTS runtime_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_couple_number INTEGER NOT NULL DEFAULT 1;

ALTER TABLE session_players
  ADD COLUMN IF NOT EXISTS first_arrived_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS arrival_baseline_matches INTEGER,
  ADD COLUMN IF NOT EXISTS fairness_offset INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deferred_rounds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waiting_since TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS entry_priority_consumed_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS last_finished_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS next_match_requested_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS next_match_request_mode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS end_game_at TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS end_game_after_match BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS couple_number INTEGER,
  ADD COLUMN IF NOT EXISTS couple_match_mode VARCHAR(20);

ALTER TABLE runtime_matches
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_format VARCHAR(20),
  ADD COLUMN IF NOT EXISTS generation INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_edited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source_revision INTEGER;

UPDATE session_players
SET first_arrived_at = COALESCE(joined_at, now()),
    waiting_since = COALESCE(waiting_since, joined_at, now())
WHERE first_arrived_at IS NULL
  AND (
    'ARRIVED' = ANY(player_tags)
    OR 'PRIORITY' = ANY(player_tags)
    OR 'HOST' = ANY(player_tags)
  );

UPDATE session_players
SET end_game_at = COALESCE(end_game_at, now())
WHERE end_game_at IS NULL
  AND ('INJURED' = ANY(player_tags) OR 'LEFT_EARLY' = ANY(player_tags));

CREATE INDEX IF NOT EXISTS idx_session_players_couple
  ON session_players(session_id, couple_number)
  WHERE couple_number IS NOT NULL;

-- Normalize potentially duplicated legacy current-state rows before adding
-- unique identities used by Runtime Scheduler upserts.
WITH ranked_courts AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY session_id, court_number
      ORDER BY COALESCE(updated_at, TIMESTAMP 'epoch') DESC, id DESC
    ) AS row_number
  FROM runtime_courts
)
DELETE FROM runtime_courts court
USING ranked_courts ranked
WHERE court.id = ranked.id
  AND ranked.row_number > 1;

WITH ranked_queue AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY session_id, queue_order
      ORDER BY COALESCE(updated_at, created_at, TIMESTAMP 'epoch') DESC, id DESC
    ) AS row_number
  FROM runtime_matches
  WHERE queue_order IS NOT NULL
    AND court_number IS NULL
)
DELETE FROM runtime_matches rm
USING ranked_queue ranked
WHERE rm.id = ranked.id
  AND ranked.row_number > 1;

-- A current-state match belongs either to the queue or to one court, never both.
UPDATE runtime_matches
SET queue_order = NULL
WHERE court_number IS NOT NULL
  AND queue_order IS NOT NULL;

CREATE TEMP TABLE runtime_court_match_keepers ON COMMIT DROP AS
SELECT id, session_id, court_number
FROM (
  SELECT rm.id, rm.session_id, rm.court_number,
    row_number() OVER (
      PARTITION BY rm.session_id, rm.court_number
      ORDER BY EXISTS (
        SELECT 1 FROM runtime_courts court WHERE court.runtime_match_id = rm.id
      ) DESC,
      COALESCE(rm.updated_at, rm.created_at, TIMESTAMP 'epoch') DESC,
      rm.id DESC
    ) AS row_number
  FROM runtime_matches rm
  WHERE rm.court_number IS NOT NULL
) ranked
WHERE ranked.row_number = 1;

UPDATE runtime_courts court
SET runtime_match_id = keeper.id
FROM runtime_court_match_keepers keeper
WHERE court.session_id = keeper.session_id
  AND court.court_number = keeper.court_number
  AND court.runtime_match_id IS DISTINCT FROM keeper.id;

DELETE FROM runtime_matches rm
USING runtime_court_match_keepers keeper
WHERE rm.session_id = keeper.session_id
  AND rm.court_number = keeper.court_number
  AND rm.id <> keeper.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_runtime_courts_session_number
  ON runtime_courts(session_id, court_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_runtime_matches_session_queue
  ON runtime_matches(session_id, queue_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_runtime_matches_session_court
  ON runtime_matches(session_id, court_number);

ALTER TABLE play_sessions
  DROP CONSTRAINT IF EXISTS ck_play_sessions_runtime_version,
  ADD CONSTRAINT ck_play_sessions_runtime_version CHECK (runtime_version >= 0),
  DROP CONSTRAINT IF EXISTS ck_play_sessions_next_couple_number,
  ADD CONSTRAINT ck_play_sessions_next_couple_number CHECK (next_couple_number > 0);

ALTER TABLE session_players
  DROP CONSTRAINT IF EXISTS ck_session_players_arrival_baseline,
  ADD CONSTRAINT ck_session_players_arrival_baseline CHECK (arrival_baseline_matches IS NULL OR arrival_baseline_matches >= 0),
  DROP CONSTRAINT IF EXISTS ck_session_players_fairness_offset,
  ADD CONSTRAINT ck_session_players_fairness_offset CHECK (fairness_offset >= 0),
  DROP CONSTRAINT IF EXISTS ck_session_players_deferred_rounds,
  ADD CONSTRAINT ck_session_players_deferred_rounds CHECK (deferred_rounds >= 0),
  DROP CONSTRAINT IF EXISTS ck_session_players_next_match_mode,
  ADD CONSTRAINT ck_session_players_next_match_mode CHECK (
    next_match_request_mode IS NULL OR next_match_request_mode IN ('ANY', 'MEN', 'WOMEN', 'MIXED')
  ),
  DROP CONSTRAINT IF EXISTS ck_session_players_couple_number,
  ADD CONSTRAINT ck_session_players_couple_number CHECK (couple_number IS NULL OR couple_number > 0),
  DROP CONSTRAINT IF EXISTS ck_session_players_couple_mode,
  ADD CONSTRAINT ck_session_players_couple_mode CHECK (
    couple_match_mode IS NULL OR couple_match_mode IN ('MEN', 'WOMEN', 'MIXED')
  ),
  DROP CONSTRAINT IF EXISTS ck_session_players_couple_pair,
  ADD CONSTRAINT ck_session_players_couple_pair CHECK (
    (couple_number IS NULL AND couple_match_mode IS NULL)
    OR (couple_number IS NOT NULL AND couple_match_mode IS NOT NULL)
  );

ALTER TABLE runtime_matches
  DROP CONSTRAINT IF EXISTS ck_runtime_matches_generation,
  ADD CONSTRAINT ck_runtime_matches_generation CHECK (generation >= 0),
  DROP CONSTRAINT IF EXISTS ck_runtime_matches_source_revision,
  ADD CONSTRAINT ck_runtime_matches_source_revision CHECK (source_revision IS NULL OR source_revision >= 0),
  DROP CONSTRAINT IF EXISTS ck_runtime_matches_format,
  ADD CONSTRAINT ck_runtime_matches_format CHECK (
    match_format IS NULL OR match_format IN ('AUTO', 'MEN', 'WOMEN', 'MIXED')
  );

COMMIT;
