# Week 8 — 직접 해야 하는 인프라·운영 체크리스트

> 코드 작업은 Claude가 처리했습니다. 아래는 **사람이 직접 계정·결제·등록·검토**해야 하는 항목입니다.
> 체크박스를 순서대로 따라가면 배포까지 완료됩니다.

---

## 1. API 키 발급 (반나절~1일 소요)

| 서비스 | 작업 | 예상 소요 | URL |
|---|---|---|---|
| **Anthropic** | API 키 발급, 결제 정보 등록, Tier 2 신청 | 30분 (Tier 승급은 사용량 누적 필요) | console.anthropic.com |
| **Google Cloud** | 프로젝트 생성 → Vertex AI / Gemini API 활성화 | 1시간 | console.cloud.google.com |
| **OpenRouter** | 계정 생성, 크레딧 $50 충전 | 30분 | openrouter.ai |
| **Mathpix** | 상업용 요금제 가입, API 키 발급 | 1시간 | mathpix.com |
| **PostHog** | 프로젝트 생성, JS SDK 키(VITE_POSTHOG_KEY) 확보 | 30분 | posthog.com |
| **Sentry** | 프로젝트 생성(Cloudflare Workers), DSN 확보 | 30분 | sentry.io |
| **Resend** | 계정 생성, 도메인 인증, API 키 발급 | 반나절 (DNS 전파 대기) | resend.com |

> **Google Cloud 주의**: 리전은 반드시 `asia-northeast3 (서울)` 선택

---

## 2. Supabase 세팅

- [ ] **프로젝트 생성** — 리전: `ap-northeast-2 (Seoul)`
- [ ] **마이그레이션 실행** (SQL 에디터에서 순서대로):
  ```
  supabase/migrations/001_initial_schema.sql
  supabase/migrations/002_subscriptions.sql
  supabase/migrations/003_waitlist.sql
  ```
- [ ] 환경변수 확보:
  - `SUPABASE_URL` (프로젝트 설정 → API)
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY` (Service Role Key — 절대 프론트에 노출 금지)
- [ ] **Auth 설정**:
  - 이메일 확인 활성화 (Authentication → Settings → Email)
  - JWT Secret 확인 (Settings → API → JWT Secret)
- [ ] **RLS 정책 강화** (현재 temp_open 정책 → user 소유권 기반으로 교체):
  ```sql
  -- 예시: problem_sessions
  DROP POLICY "temp_open_problem_sessions" ON problem_sessions;
  CREATE POLICY "owner_only" ON problem_sessions
    FOR ALL USING (user_id = auth.uid());
  ```

---

## 3. Cloudflare 세팅

### R2 스토리지
- [ ] R2 버킷 생성: `solvy-uploads`
- [ ] 퍼블릭 액세스 URL 설정 (Custom Domain 또는 Public Bucket URL)
- [ ] `IMAGES_PUBLIC_URL` 값 확보

### KV 네임스페이스
- [ ] KV 네임스페이스 생성: `SOLVY_RATE_LIMIT_KV`
- [ ] `server/wrangler.toml` 업데이트:
  ```toml
  [[kv_namespaces]]
  binding = "RATE_LIMIT_KV"
  id = "<발급된 KV ID>"
  preview_id = "<preview KV ID>"
  ```

### Workers 배포
- [ ] Workers 프로젝트 연결 (`wrangler.toml`의 `name` 확인)
- [ ] Cloudflare Pages 프로젝트 생성 (프론트엔드 배포용)

---

## 4. 시크릿·환경변수 등록

### .env 파일 작성 (로컬 개발용, 절대 커밋 금지)
```
VITE_API_URL=http://localhost:8787/api/v1
VITE_POSTHOG_KEY=<PostHog JS SDK 키>
```

### Cloudflare Workers 시크릿 등록
터미널에서 아래 명령어를 `server/` 디렉토리에서 실행:
```bash
cd server
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put JWT_SECRET
wrangler secret put SENTRY_DSN
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put MATHPIX_APP_ID
wrangler secret put MATHPIX_APP_KEY
wrangler secret put SLACK_WEBHOOK_URL
wrangler secret put RESEND_API_KEY
```

### GitHub Actions Secrets 등록
GitHub 레포 → Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- 위 Cloudflare 시크릿들 동일하게 등록

---

## 5. 도메인 구매 및 DNS 설정

- [ ] `solvy.kr` 도메인 구매 (후이즈, 가비아 등)
- [ ] 네임서버를 Cloudflare로 이전 (DNS 전파 1~48시간 소요)
- [ ] Cloudflare에서 Workers 커스텀 도메인 연결: `api.solvy.kr`
- [ ] Cloudflare Pages 커스텀 도메인 연결: `solvy.kr` / `www.solvy.kr`
- [ ] `server/src/index.ts` CORS 설정 확인:
  ```typescript
  // production에서 'https://solvy.kr' 허용 이미 설정됨
  ```

---

## 6. 첫 배포

```bash
# 백엔드 배포
cd server
npm run deploy

# 헬스 체크
curl https://api.solvy.kr/health
# → {"status":"ok","timestamp":"...","version":"1.0.0"}

# 프론트엔드 빌드
cd ..
npm run build
# → Cloudflare Pages에 자동 배포 (GitHub Actions)
```

- [ ] `curl https://api.solvy.kr/health` → `200 OK` 확인
- [ ] `https://solvy.kr` 접속 → 랜딩 페이지 표시 확인
- [ ] 이메일 등록 폼 테스트 (실제 등록 후 Supabase waitlist 테이블 확인)

---

## 7. Week 8 테스트 (실제 인프라로)

Week 7에서 mock으로만 검증했던 것들을 실제 인프라로 재확인:

- [ ] Playwright e2e: 로그인 → 문제 업로드 → 대화 → 노트 저장
  ```bash
  npx playwright test
  ```
- [ ] Sentry·PostHog 실제 연동 확인 (이벤트 수신 여부)
- [ ] 비용 알림 테스트 (Slack webhook 수신 확인)
- [ ] Rate limit 실제 동작 확인 (동일 IP 과다 요청 시 429)

---

## 8. 법무·개인정보 처리 (전문가 검토 필수)

> 아래 항목은 코드로 해결할 수 없습니다. 법무 전문가 또는 서비스 운영자가 직접 처리해야 합니다.

- [ ] **이용약관 법무 검토** (`/terms` 페이지 내용 변호사 검토)
  - 특히 제4조 (콘텐츠 보호 약속), 제8조 (AI 면책) 조항
- [ ] **개인정보처리방침 신고** (개인정보보호위원회 — 서비스 오픈 전 필수)
- [ ] **만 14세 미만 동의 절차** 구현 확인 (가입 플로우에 생년월일 확인 추가 필요)
- [ ] **쿠키·트래킹 동의 배너** (PostHog 수집 전 동의 받아야 함)
  - Supabase Auth에 생년월일 필드 추가 필요
- [ ] 이용약관의 시행일(2026년 5월 1일) 실제 런칭 일정에 맞게 조정

---

## 9. 지원 채널 준비

- [ ] **실시간 지원 채널** 개설:
  - 카카오 오픈채팅 또는 디스코드 서버 중 선택
  - 채널 URL을 `/faq` 페이지와 앱 내 "문의하기" 링크에 반영
- [ ] `FaqPage.tsx`의 `solvy.contact@gmail.com` → 실제 운영 이메일로 교체
- [ ] **초대 코드 발급 운영**: Supabase 대시보드에서 waitlist 확인 후 수동 또는 스크립트로 invite_codes 생성

---

## 10. 베타 런칭 전략 실행

| 일정 | 범위 | 준비사항 |
|---|---|---|
| Day 1~2 | 내부 50명 (지인) | 초대 코드 50개 생성, Sentry·PostHog 대시보드 주시 |
| Day 3~5 | 대기열 상위 500명 | Resend로 초대 이메일 발송 |
| Day 6~7 | 수험 커뮤니티 시딩 | 오르비, 수학의정석 카페, 수험 블로그 소개 |

---

## 완료 판정 기준

- [ ] `curl https://api.solvy.kr/health` → `200 OK`
- [ ] 랜딩 페이지 정상 표시, 대기열 등록 작동
- [ ] 첫 500명 평균 1.5분 내 첫 문제 업로드 도달
- [ ] 24시간 내 Critical 버그 0건 (또는 1건 이내 핫픽스 완료)
- [ ] Founding Member 뱃지 자동 부여 확인
