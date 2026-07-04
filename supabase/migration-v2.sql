-- ====== 会话历史功能 ======

-- 6. sessions 表：对话会话
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  mode       TEXT NOT NULL DEFAULT 'quick',   -- 'quick' | 'scenario'
  title      TEXT NOT NULL DEFAULT '',         -- 自动截取首条消息
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. session_messages 表：会话中的每条消息
CREATE TABLE IF NOT EXISTS session_messages (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,                    -- 'user' | 'assistant' | 'system'
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',               -- { replies?: string[], chosenIndex?: number, strategy?: object }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_msgs_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_msgs_created_at ON session_messages(created_at);

-- RLS：关闭（服务端 service_role key）
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages DISABLE ROW LEVEL SECURITY;