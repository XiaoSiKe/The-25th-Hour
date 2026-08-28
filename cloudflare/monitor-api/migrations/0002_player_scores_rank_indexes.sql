CREATE INDEX IF NOT EXISTS idx_player_scores_player_best_rank
  ON player_scores(anonymous_player_id, score DESC, occurred_at ASC, event_id ASC);

CREATE INDEX IF NOT EXISTS idx_player_scores_global_rank
  ON player_scores(score DESC, occurred_at ASC, anonymous_player_id ASC);
