-- Week 8: 베타 대기열 + 초대 코드

CREATE TABLE waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ,
  joined_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created ON waitlist(created_at);

CREATE TABLE invite_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT UNIQUE NOT NULL,
  email      TEXT REFERENCES waitlist(email) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_email ON invite_codes(email);

ALTER TABLE waitlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Service key로만 접근 (공개 API는 백엔드 경유)
CREATE POLICY "service_only_waitlist"     ON waitlist     FOR ALL USING (false);
CREATE POLICY "service_only_invite_codes" ON invite_codes FOR ALL USING (false);
