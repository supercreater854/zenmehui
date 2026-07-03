-- ====== 怎么回 Supabase 数据库迁移 ======
-- 在 Supabase SQL Editor 中执行此文件

-- 1. users 表：匿名用户 + VIP + 每日次数
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY,              -- 前端传入的 UUID（localStorage 生成）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  vip         BOOLEAN NOT NULL DEFAULT false,
  daily_count INTEGER NOT NULL DEFAULT 0,
  last_reset  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. usage_logs 表：埋点分析
CREATE TABLE IF NOT EXISTS usage_logs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scene      TEXT,        -- work / love / social / unknown
  success    BOOLEAN NOT NULL DEFAULT false
);

-- 3. 索引：按 user_id 查日志
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- 4. RLS：关闭（服务端用 service_role key，不需要 RLS）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs DISABLE ROW LEVEL SECURITY;

-- 5. analytics_events 表：精细化埋点
CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL,
  event      TEXT NOT NULL,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ae_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ae_user_event ON analytics_events(user_id, event);

ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;