CREATE INDEX IF NOT EXISTS idx_player_scores_nickname_owner
  ON player_scores(LOWER(TRIM(nickname)), anonymous_player_id);

CREATE INDEX IF NOT EXISTS idx_monitor_events_session_start_nickname_owner
  ON monitor_events(event_type, LOWER(TRIM(json_extract(payload_json, '$.nickname'))), anonymous_player_id);
