-- Week 6 이월: Toss Payments 연동을 위한 구독 테이블
-- subscriptions는 users.tier의 소스 오브 트루스 역할

CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL CHECK (plan IN ('light', 'pro')),
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'past_due', 'canceled', 'paused')),
  toss_customer_key    TEXT UNIQUE,
  toss_billing_key     TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  canceled_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 활성 구독은 사용자당 1개만 허용
CREATE UNIQUE INDEX idx_subscriptions_user_active
  ON subscriptions(user_id) WHERE status = 'active';

-- users 테이블에 구독 참조 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);

-- RLS: 서비스 키로만 접근 (백엔드 전용)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_key_bypass_subscriptions" ON subscriptions
  USING (true)
  WITH CHECK (true);
