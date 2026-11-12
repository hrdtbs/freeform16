CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  type_key TEXT,
  status TEXT NOT NULL,
  overall_confidence REAL NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rank_confidence
  ON results(status, overall_confidence DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_rank_type
  ON results(type_key, expires_at);

CREATE INDEX IF NOT EXISTS idx_results_expires
  ON results(expires_at);
