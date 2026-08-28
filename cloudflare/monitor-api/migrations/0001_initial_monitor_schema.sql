CREATE TABLE IF NOT EXISTS monitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  anonymous_player_id TEXT NOT NULL,
  session_id TEXT,
  occurred_at TEXT NOT NULL,
  client_build TEXT,
  source TEXT,
  surface TEXT,
  run_id TEXT,
  page_url TEXT,
  referrer TEXT,
  ending_id TEXT,
  ending_title TEXT,
  score INTEGER,
  duration_seconds INTEGER,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitor_events_type_time
  ON monitor_events(event_type, occurred_at);

CREATE INDEX IF NOT EXISTS idx_monitor_events_player_time
  ON monitor_events(anonymous_player_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_monitor_events_session_time
  ON monitor_events(session_id, occurred_at);

CREATE TABLE IF NOT EXISTS player_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  anonymous_player_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  run_id TEXT,
  nickname TEXT,
  school TEXT,
  score INTEGER NOT NULL,
  ending_id TEXT,
  ending_title TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_scores_score_time
  ON player_scores(score DESC, occurred_at ASC);

CREATE INDEX IF NOT EXISTS idx_player_scores_player_time
  ON player_scores(anonymous_player_id, occurred_at);
