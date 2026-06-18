create table if not exists match_histories (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references play_sessions(id) on delete cascade,
  court_number integer not null,
  court_name varchar(50) not null,
  started_at timestamp(6),
  ended_at timestamp(6) not null default now(),
  duration_seconds integer,
  team_a jsonb not null,
  team_b jsonb not null,
  created_at timestamp(6) default now()
);

create index if not exists idx_match_histories_session_ended
  on match_histories(session_id, ended_at);

create index if not exists idx_match_histories_session_court
  on match_histories(session_id, court_number);

create table if not exists match_history_players (
  id uuid primary key default gen_random_uuid(),
  match_history_id uuid not null references match_histories(id) on delete cascade,
  session_player_id uuid not null references session_players(id) on delete cascade,
  team varchar(10) not null,
  position integer not null,
  constraint uq_match_history_player unique (match_history_id, session_player_id)
);

create index if not exists idx_match_history_players_player
  on match_history_players(session_player_id);
