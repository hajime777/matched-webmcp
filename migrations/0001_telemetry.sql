CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  event TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  tool TEXT,
  status TEXT,
  source TEXT,
  phase TEXT,
  supported INTEGER,
  tool_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_created_at
  ON telemetry_events(created_at);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_event
  ON telemetry_events(event);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_session
  ON telemetry_events(session_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_tool
  ON telemetry_events(tool);
