-- 002_journal_entries.sql — the trade journal, moved off browser
-- localStorage (which lost every entry on a cleared browser/different
-- device) onto real, durable MySQL storage. Single-user tool, no user_id
-- column — every row belongs to the one trader using this terminal.
CREATE TABLE IF NOT EXISTS journal_entries (
  id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  traded_at DATE NOT NULL,
  instrument VARCHAR(32) NOT NULL,
  direction VARCHAR(16) NOT NULL,
  setup VARCHAR(120) NOT NULL,
  thesis TEXT NOT NULL,
  invalidation TEXT NOT NULL,
  outcome_r DOUBLE NULL,
  followed_plan TINYINT(1) NOT NULL,
  notes TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_journal_entries_traded_at (traded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
