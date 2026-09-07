CREATE TABLE IF NOT EXISTS global_read_runs (
  run_id VARCHAR(36) NOT NULL PRIMARY KEY,
  method_version VARCHAR(64) NOT NULL,
  snapshot_hash CHAR(64) NOT NULL,
  language VARCHAR(8) NOT NULL,
  readiness VARCHAR(32) NOT NULL,
  as_of DATETIME(3) NOT NULL,
  report JSON NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_global_read_as_of (as_of)
);
