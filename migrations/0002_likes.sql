CREATE TABLE IF NOT EXISTS likes (
  session_id TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('human', 'agent')),
  source TEXT NOT NULL CHECK (source IN ('human_ui', 'webmcp_delegated', 'webmcp_agent_native')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, actor)
);

CREATE INDEX IF NOT EXISTS idx_likes_actor
  ON likes(actor);

CREATE INDEX IF NOT EXISTS idx_likes_created_at
  ON likes(created_at);
