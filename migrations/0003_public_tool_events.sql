CREATE TABLE IF NOT EXISTS public_tool_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  session_id TEXT NOT NULL,
  bishop_id TEXT NOT NULL,
  run_type TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  risk_level INTEGER NOT NULL CHECK (risk_level BETWEEN 0 AND 4),
  status TEXT,
  message_text TEXT,
  queen_reply TEXT
);

CREATE INDEX IF NOT EXISTS idx_public_tool_events_created_at
  ON public_tool_events(created_at);

CREATE INDEX IF NOT EXISTS idx_public_tool_events_tool
  ON public_tool_events(tool_name);

CREATE INDEX IF NOT EXISTS idx_public_tool_events_session
  ON public_tool_events(session_id);
