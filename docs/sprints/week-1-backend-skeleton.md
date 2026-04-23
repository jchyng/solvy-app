# Week 1 — Foundation 1: 백엔드 골격

## 📖 이번 주 필독
- `architecture/tech-stack.md`
- `architecture/data-model.md` (스키마 파악, SQL 파일 작성)
- `architecture/prototype-migration.md`
- `design-system.md` §디자인 토큰 (CSS 토큰 이식 참고)

## 📕 이번 주 건드리지 말 것
- AI 호출 구현 (Week 2)
- 문제 분석·대화 기능 (Week 3~4)
- 노트·폴더 기능 (Week 5)
- **실제 배포·인프라 세팅** — Cloudflare Workers 배포, Supabase 마이그레이션 실행, 도메인 설정 등은 Week 8
- **신규 비즈니스 로직** — 이번 주는 **골격 코드**만

## 🎯 이번 주 목표
**빈 요청이 들어와서 빈 응답이 나가는 완전한 파이프라인 코드**를 완성한다.
실제 인프라 없이 타입 체크·빌드·로컬 dev 서버가 통과하면 완료.

---

## 백엔드 체크리스트

- [x] Hono 프로젝트 셋업 코드 (`server/`)
- [x] `wrangler.toml` 작성 (KV ID 등 실제 값은 Week 8에 채움)
- [x] 라우팅 구조: `/api/v1/{problems,conversations,folders,users,webhooks}` (501 반환)
- [x] Supabase 클라이언트 코드 (`server/src/lib/supabase.ts`)
- [x] **마이그레이션 SQL 파일 작성** — `supabase/migrations/001_initial_schema.sql` (실행은 Week 8)
- [x] JWT 인증 미들웨어 (학생 단일 역할)
- [x] 레이트리밋 미들웨어 (Cloudflare KV 기반)
- [x] 에러 핸들링 표준화 (`AppError` 클래스)
- [x] Sentry 연동 코드 스텁 (실제 DSN은 Week 8)
- [x] 헬스체크 엔드포인트 `/health`

## 프론트엔드 체크리스트

- [x] 기존 프로토타입 코드를 `legacy/` 폴더로 이동 (없으면 생략)
- [x] 새 프로젝트 구조 생성:
  ```
  src/
  ├── features/
  │   ├── problem/
  │   ├── conversation/
  │   └── notes/
  ├── shared/
  ├── pages/
  ├── services/
  └── stores/
  ```
- [x] React Router 세팅 — `/`, `/chat/:id`, `/notes`, `/notes/folders/:id`
- [x] API 클라이언트 레이어 (`services/api.ts`)
- [x] Zustand 스토어 재구성 (현재 대화 · 노트 목록 · 유저 분리)
- [x] PostHog 초기화 코드 (VITE_POSTHOG_KEY 없으면 no-op)
- [x] `index.css` 디자인 토큰 이식
- [x] `MarkdownView`, `InteractiveAreaIntegral` 구현

## 품질 기준

- [x] GitHub Actions 워크플로우 파일 작성 (Secrets 등록은 Week 8)
- [x] `.env.example` 파일 작성 (실제 값 채우기는 Week 8)
- [x] 기본 e2e 테스트 스켈레톤 (Playwright) — 샘플 1개
- [x] `npm run type-check` → 에러 없음 (로컬 검증 완료)
- [x] `npm run build` → 성공 (로컬 검증 완료)

## 완료 판정

백엔드와 프론트엔드 **코드가 타입 체크·빌드를 통과**하고,
`npm run dev`(프론트) + `wrangler dev`(백엔드, 로컬)에서
인증·레이트리밋·에러 핸들링이 작동하지만 실제 기능은 하나도 없는 상태.
Supabase·Cloudflare 실제 연결은 Week 8에서 처리.
