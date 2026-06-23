CREATE TABLE IF NOT EXISTS app_settings (
  id varchar(50) PRIMARY KEY DEFAULT 'default',
  club_name varchar(255) NOT NULL DEFAULT 'Badmin',
  logo_s3_key varchar(500),
  logo_url varchar(1000),
  updated_at timestamp(6) DEFAULT now()
);

INSERT INTO app_settings (id, club_name)
VALUES ('default', 'Badmin')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE session_players
  ADD COLUMN IF NOT EXISTS avatar_s3_key varchar(500),
  ADD COLUMN IF NOT EXISTS avatar_url varchar(1000),
  ADD COLUMN IF NOT EXISTS avatar_updated_at timestamp(6);

CREATE TABLE IF NOT EXISTS session_player_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_player_id uuid NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  s3_key varchar(500) NOT NULL,
  public_url varchar(1000) NOT NULL,
  file_name varchar(255),
  content_type varchar(100),
  file_size integer,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp(6) DEFAULT now(),
  updated_at timestamp(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_player_images_player
  ON session_player_images(session_player_id);

CREATE INDEX IF NOT EXISTS idx_session_player_images_status
  ON session_player_images(status);
