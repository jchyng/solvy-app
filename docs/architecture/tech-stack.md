# Tech Stack

> **주로 참조하는 주차**: Week 0(계정 준비), Week 1(백엔드 골격). 그 외에는 라이브러리 추가 결정할 때만.

---

## 프론트엔드

- **프레임워크**: React 18 + TypeScript
- **빌드**: Vite
- **상태관리**: Zustand
- **스타일링**: Tailwind v4 (CSS 변수 + `@theme` 활용) — 세부 토큰은 `design-system.md`
- **수식 렌더링**: react-markdown + remark-math + rehype-katex
- **애니메이션**: motion
- **라우팅**: React Router v6
- **이벤트 트래킹**: PostHog JS SDK

---

## 백엔드

- **런타임**: Node.js 20 LTS
- **프레임워크**: Hono (Express보다 빠르고 엣지 배포 용이)
- **배포**: Cloudflare Workers 또는 Vercel Edge Functions
- **DB**: PostgreSQL (Supabase — 무료 티어 관대)
- **캐시**: Cloudflare KV 또는 Upstash Redis
- **파일 저장**: Cloudflare R2 또는 Supabase Storage
- **시크릿 관리**: Cloudflare Secrets 또는 Doppler

---

## AI 프로바이더 (개요)

- **Anthropic Claude** — 문제 분석, 멀티턴 대화 (심장부)
- **Google Gemini** — 멀티모달 OCR, 난이도 분류, 노트 자동 제목
- **OpenRouter** — DeepSeek, Qwen 등 오픈소스 경유
- **Mathpix** — 손글씨 OCR (Phase 1.5+)

→ 역할 매핑, 폴백 체인, 프롬프트 설계는 `architecture/ai-providers.md`

---

## 관측성

- **이벤트 트래킹**: PostHog
- **에러 모니터링**: Sentry
- **로그**: 자체 PostgreSQL `usage_events` 테이블
- **Uptime**: BetterStack 또는 UptimeRobot

---

## 결제 (Week 6+)

- **결제 게이트웨이**: Toss Payments (한국 사용자 최적)
- **구독 관리**: 자체 구현

---

## 왜 이 스택인가

- **Cloudflare Workers + Hono**: 엣지 배포로 한국 응답 속도 최적, 무료 티어 관대, 서버리스로 스케일 걱정 없음
- **Supabase**: DB + Auth + Storage 한 번에, PostgreSQL 직접 접근 가능, 무료 티어로 베타 운영 가능
- **PostHog**: 제품 분석 + 세션 리플레이, 셀프호스트 가능

---

## 환경변수 목록 (`.env.example`)

```
# Core
NODE_ENV=development
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=solvy-uploads

# AI Providers
ANTHROPIC_API_KEY=
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=
OPENROUTER_API_KEY=
MATHPIX_APP_ID=
MATHPIX_APP_KEY=

# Observability
POSTHOG_KEY=
POSTHOG_HOST=
SENTRY_DSN=

# Email
RESEND_API_KEY=

# Payments (Week 6+)
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Security
JWT_SECRET=
CORS_ORIGINS=https://solvy.kr
```
