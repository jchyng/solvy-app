# Solvy

수학 문제 사진 → AI가 출제 의도·풀이법·실전 팁을 제공하는 모바일 웹 서비스.
"답을 가르치는 앱이 아닙니다. 답을 설명하게 하는 앱입니다."

---

## 문서 읽기

| 필요한 것 | 파일 |
|---|---|
| 제품 정체성·타깃 | `docs/context/00-vision.md` |
| 하면 안 되는 것 | `docs/context/01-principles.md` |
| 기술 스택·환경변수 | `docs/architecture/tech-stack.md` |
| AI 프로바이더·역할 | `docs/architecture/ai-providers.md` |
| DB 스키마 | `docs/architecture/data-model.md` |
| 현재 스프린트 작업 | `docs/sprints/week-1-backend-skeleton.md` |
| 색상·타이포·컴포넌트 | `design-system/INDEX.md` |
| 전체 문서 인덱스 | `docs/README.md` |

---

## 현재 스프린트: Week 1 — Backend Skeleton

**목표**: 빈 요청이 들어와서 빈 응답이 나가는 완전한 파이프라인 완성

**이번 주 해야 할 것**
- Hono 프로젝트 코드 + API 라우팅 뼈대 (`/api/v1/{problems,conversations,folders,users}` → 501)
- Supabase 마이그레이션 SQL 파일 작성 (실행은 Week 8)
- JWT 인증 미들웨어, 레이트리밋, 에러 핸들링, Sentry 스텁
- 프론트: 새 프로젝트 구조·라우팅·API 클라이언트 코드 작성

**이번 주 금지**
- AI 호출 구현 (Week 2)
- 문제 분석·대화 기능 (Week 3~4)
- 노트·폴더 기능 (Week 5)
- 결제 관련 코드 (Week 6)

작업 전 `docs/sprints/week-1-backend-skeleton.md` 체크리스트를 확인하세요.

---

## 기술 스택

| 영역 | 선택 |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind v4 + Zustand |
| Backend | Hono + Cloudflare Workers |
| DB | Supabase (PostgreSQL) + Cloudflare R2 (파일) |
| AI | Anthropic(분석·채팅) · Gemini(OCR·분류) · OpenRouter(fallback) |
| 관측성 | PostHog (이벤트) · Sentry (에러) |
| 결제 | Toss Payments (Week 6+) |

---

## 절대 하지 말 것

- **API 키를 프론트엔드에 노출** — 모든 AI 호출은 백엔드 경유
- **학부모 UI·API·데이터 모델** — Phase 2 이후, 지금은 범위 밖
- **OCR 검증 없이 AI 호출** — Mathpix/Gemini OCR 결과 confidence 체크 필수
- **팝업·모달에 X 버튼 없음** — 학생 루틴 방해 금지
- **사용자 노트 데이터를 AI 학습에 사용**
- **스프린트 범위 이탈 구현** — 선제적 구현은 이 프로젝트의 안티패턴

---

## 작업 규칙

- 코드 작성 전 현재 스프린트 문서의 **"건드리지 말 것"** 섹션 확인
- 아키텍처 문서와 스프린트 문서 충돌 시 **아키텍처 문서가 진실**
- UI 작업 시 `design-system/INDEX.md`를 먼저 읽고 토큰·컴포넌트 클래스 사용
- 스프린트가 바뀌면 이 파일의 **"현재 스프린트"** 섹션을 업데이트
- **작업 단위마다 커밋** — 커밋은 원자적이어야 함 (한 태스크 = 한 커밋)
