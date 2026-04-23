# Data Model

> **주로 참조하는 주차**: Week 1(스키마 마이그레이션), Week 3(problem_sessions·conversations·messages), Week 5(note_folders·conversation_folders), Week 7(소유권 체크).

---

## PostgreSQL 스키마 전체

```sql
-- 사용자 (학생 단일 역할)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'light', 'pro')),
  tier_started_at TIMESTAMPTZ,
  is_beta_tester BOOLEAN DEFAULT false
);

-- 문제 세션 (사진 업로드 + 인식 + 메인 분석 결과)
CREATE TABLE problem_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  original_image_url TEXT,
  status TEXT CHECK (status IN ('uploading','analyzing','confirming','done','error')),
  recognized_problem JSONB,
  classification JSONB,
  analysis_result JSONB,   -- intent / concepts / optimal_solution / exam_tips / follow_up_questions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 대화방 (각 문제당 1개, 후속 대화가 쌓이는 곳)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  problem_session_id UUID REFERENCES problem_sessions(id) UNIQUE,
  title TEXT,                          -- 사용자가 직접 입력
  auto_title TEXT,                     -- AI 자동 생성 (폴백)
  is_favorite BOOLEAN DEFAULT false,   -- ★ 즐겨찾기
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_conversations_user_recent ON conversations(user_id, last_message_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_user_fav ON conversations(user_id, last_message_at DESC) WHERE is_favorite = true AND deleted_at IS NULL;

-- 대화 메시지 (학생·AI 모두)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system','assistant','user')),
  content TEXT NOT NULL,               -- 마크다운
  structured_payload JSONB,            -- analyze/chat 구조화 출력 보존
  follow_up_questions JSONB,           -- 현재 메시지에 붙은 꼬리 질문 칩
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- 사용자가 만든 목록 (폴더)
CREATE TABLE note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_note_folders_user ON note_folders(user_id, position);

-- 대화 ↔ 목록 (다대다)
CREATE TABLE conversation_folders (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, folder_id)
);
CREATE INDEX idx_conv_folders_folder ON conversation_folders(folder_id, added_at DESC);

-- 비용 추적
CREATE TABLE usage_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID,                     -- problem_session_id 또는 conversation_id
  role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cached_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6),
  latency_ms INTEGER,
  success BOOLEAN,
  error_type TEXT,
  fallback_depth INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_usage_events_user_time ON usage_events(user_id, created_at DESC);
CREATE INDEX idx_usage_events_role ON usage_events(role, created_at DESC);

-- 크레딧 (광고 리워드)
CREATE TABLE credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_earned_at TIMESTAMPTZ
);

CREATE TABLE credit_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER,
  type TEXT CHECK (type IN ('ad_reward','problem_spent','chat_spent','bonus','refund')),
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이벤트 트래킹
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_events_name_time ON analytics_events(event_name, created_at DESC);
```

---

## 테이블별 핵심 책임

| 테이블 | 책임 | 처음 사용되는 주차 |
|---|---|---|
| `users` | 인증, 티어 관리 | Week 1 |
| `problem_sessions` | 이미지 업로드 + OCR + 분석 결과 보관 | Week 3 |
| `conversations` | 문제당 1개 대화방, 즐겨찾기·제목 | Week 3~5 |
| `messages` | 학생·AI 메시지 시계열, 꼬리 질문 칩 | Week 3~4 |
| `note_folders` | 사용자 생성 폴더 | Week 5 |
| `conversation_folders` | 대화 ↔ 폴더 다대다 | Week 5 |
| `usage_events` | 모든 AI 호출 기록 (비용·지연·실패) | Week 2부터 |
| `credits`, `credit_transactions` | 광고 리워드 (베타 후 활성) | Week 6 stub |
| `analytics_events` | 제품 분석 이벤트 (PostHog 보조) | Week 1부터 |

---

## 이벤트 규약

모든 이벤트는 `user_id`, `session_id`, `timestamp`를 필수 속성으로 포함합니다.

```
problem.uploaded
problem.recognized
problem.confirmed
problem.analyzed

conversation.created
conversation.message_sent
conversation.followup_tapped
conversation.renamed
conversation.favorited
conversation.unfavorited
conversation.deleted

folder.created
folder.renamed
folder.deleted
folder.conversation_added
folder.conversation_removed

subscription.tier_selected
credit.ad_watched
credit.spent

error.ai_failure
error.ocr_low_confidence
```

---

## 소유권 체크 (Week 7 필독)

모든 엔드포인트에서 요청자(JWT) 소유인지 검증 필수:

- `GET/PATCH/DELETE /conversations/:id` → `conversations.user_id == jwt.user_id`
- `GET /problems/:id` → `problem_sessions.user_id == jwt.user_id`
- `POST/DELETE /folders/:id/conversations` → 폴더와 대화 **둘 다** 소유자 일치 확인
- `PATCH /folders/:id` → `note_folders.user_id == jwt.user_id`

소유권 체크 미들웨어를 공용화하여 엔드포인트마다 수동으로 작성하지 말 것.
