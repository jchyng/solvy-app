-- Solvy Initial Schema
-- Week 1: Create all tables. RLS enabled but permissive until Week 7.

-- ─── Users ──────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE,
  name            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  tier            TEXT DEFAULT 'free' CHECK (tier IN ('free', 'light', 'pro')),
  tier_started_at TIMESTAMPTZ,
  is_beta_tester  BOOLEAN DEFAULT false
);

-- ─── Problem Sessions ────────────────────────────────────────────
CREATE TABLE problem_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  original_image_url  TEXT,
  status              TEXT CHECK (status IN ('uploading','analyzing','confirming','done','error')),
  recognized_problem  JSONB,
  classification      JSONB,
  analysis_result     JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- ─── Conversations ───────────────────────────────────────────────
CREATE TABLE conversations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id),
  problem_session_id UUID REFERENCES problem_sessions(id) UNIQUE,
  title              TEXT,
  auto_title         TEXT,
  is_favorite        BOOLEAN DEFAULT false,
  last_message_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX idx_conversations_user_recent
  ON conversations(user_id, last_message_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_conversations_user_fav
  ON conversations(user_id, last_message_at DESC)
  WHERE is_favorite = true AND deleted_at IS NULL;

-- ─── Messages ────────────────────────────────────────────────────
CREATE TABLE messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('system','assistant','user')),
  content             TEXT NOT NULL,
  structured_payload  JSONB,
  follow_up_questions JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation
  ON messages(conversation_id, created_at);

-- ─── Note Folders ────────────────────────────────────────────────
CREATE TABLE note_folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  name       TEXT NOT NULL,
  color      TEXT,
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_folders_user
  ON note_folders(user_id, position);

-- ─── Conversation ↔ Folder (many-to-many) ───────────────────────
CREATE TABLE conversation_folders (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  folder_id       UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, folder_id)
);

CREATE INDEX idx_conv_folders_folder
  ON conversation_folders(folder_id, added_at DESC);

-- ─── Usage Events (AI cost tracking) ────────────────────────────
CREATE TABLE usage_events (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES users(id),
  session_id     UUID,
  role           TEXT NOT NULL,
  provider       TEXT NOT NULL,
  model          TEXT NOT NULL,
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  cached_tokens  INTEGER DEFAULT 0,
  cost_usd       NUMERIC(10,6),
  latency_ms     INTEGER,
  success        BOOLEAN,
  error_type     TEXT,
  fallback_depth INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user_time
  ON usage_events(user_id, created_at DESC);

CREATE INDEX idx_usage_events_role
  ON usage_events(role, created_at DESC);

-- ─── Credits (ad reward system, stub for Week 6) ────────────────
CREATE TABLE credits (
  user_id      UUID PRIMARY KEY REFERENCES users(id),
  balance      INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent  INTEGER DEFAULT 0,
  last_earned_at TIMESTAMPTZ
);

CREATE TABLE credit_transactions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES users(id),
  amount       INTEGER,
  type         TEXT CHECK (type IN ('ad_reward','problem_spent','chat_spent','bonus','refund')),
  reference_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Analytics Events ────────────────────────────────────────────
CREATE TABLE analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name_time
  ON analytics_events(event_name, created_at DESC);

-- ─── Row Level Security ──────────────────────────────────────────
-- Enable RLS on all tables. Permissive policies until Week 7 hardening.
-- Service key bypasses RLS; JWT-based policies come in Week 7.
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "temp_open_users"               ON users               FOR ALL USING (true);
CREATE POLICY "temp_open_problem_sessions"    ON problem_sessions    FOR ALL USING (true);
CREATE POLICY "temp_open_conversations"       ON conversations       FOR ALL USING (true);
CREATE POLICY "temp_open_messages"            ON messages            FOR ALL USING (true);
CREATE POLICY "temp_open_note_folders"        ON note_folders        FOR ALL USING (true);
CREATE POLICY "temp_open_conversation_folders" ON conversation_folders FOR ALL USING (true);
CREATE POLICY "temp_open_usage_events"        ON usage_events        FOR ALL USING (true);
CREATE POLICY "temp_open_credits"             ON credits             FOR ALL USING (true);
CREATE POLICY "temp_open_credit_transactions" ON credit_transactions FOR ALL USING (true);
CREATE POLICY "temp_open_analytics_events"    ON analytics_events    FOR ALL USING (true);
