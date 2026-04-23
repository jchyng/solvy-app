# Week 1 — Foundation 1: 백엔드 골격

## 📖 이번 주 필독
- `architecture/tech-stack.md`
- `architecture/data-model.md` (스키마 마이그레이션 실행)
- `architecture/prototype-migration.md`
- `design-system.md` §디자인 토큰 (CSS 토큰 이식 참고)

## 📕 이번 주 건드리지 말 것
- AI 호출 구현 (Week 2)
- 문제 분석·대화 기능 (Week 3~4)
- 노트·폴더 기능 (Week 5)
- **신규 비즈니스 로직** — 이번 주는 **골격**만

## 🎯 이번 주 목표
**빈 요청이 들어와서 빈 응답이 나가는 완전한 파이프라인**을 완성한다. 기능 없음, 뼈대만.

---

## 백엔드 체크리스트

- [ ] Hono 프로젝트 셋업, Cloudflare Workers 배포 파이프라인
- [ ] 라우팅 구조: `/api/v1/{problems,conversations,folders,users,webhooks}`
  - 이 시점엔 각 엔드포인트가 501 Not Implemented 반환해도 OK
- [ ] Supabase 클라이언트 세팅
- [ ] **스키마 마이그레이션 실행** — `architecture/data-model.md` 전체 (conversations, messages, note_folders, conversation_folders 포함)
- [ ] JWT 인증 미들웨어 (학생 단일 역할)
- [ ] 레이트리밋 미들웨어 (Cloudflare KV 기반)
- [ ] 에러 핸들링 표준화 (`AppError` 클래스)
- [ ] Sentry 연동
- [ ] 헬스체크 엔드포인트 `/health`

## 프론트엔드 체크리스트

- [ ] 기존 프로토타입 코드를 `legacy/` 폴더로 이동 (참고용 보존, import 금지)
- [ ] 새 프로젝트 구조 생성:
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
- [ ] React Router 세팅 — `/`, `/chat/:id`, `/notes`, `/notes/folders/:id`
- [ ] API 클라이언트 레이어 (`services/api.ts`)
- [ ] Zustand 스토어 재구성 (현재 대화 · 노트 목록 · 유저 분리)
- [ ] PostHog 초기화
- [ ] `index.css` 디자인 토큰 이식 (`design-system.md` §디자인 토큰)
- [ ] `MarkdownView`, `InteractiveAreaIntegral` 프로토타입에서 이식

## 품질 기준

- [ ] GitHub Actions: PR마다 lint + type check + test 자동 실행
- [ ] Preview 배포 자동화
- [ ] 기본 e2e 테스트 스켈레톤 (Playwright) — 샘플 1개면 충분
- [ ] `curl /health` → `200 OK`

## 완료 판정

백엔드와 프론트엔드가 각각 배포되어 있고, 인증·레이트리밋·에러 핸들링이 작동하지만 실제 기능은 하나도 없는 상태. 여기서부터 Week 2로.
