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
| 현재 스프린트 작업 | `docs/sprints/week-7-hardening.md` |
| 색상·타이포·컴포넌트 | `design-system/INDEX.md` |
| 전체 문서 인덱스 | `docs/README.md` |

---

## 현재 스프린트: Week 7 — Hardening: 테스트 · 보안 · 모니터링

**목표**: 베타 런칭 전 안정화. 보안·테스트·모니터링이 프로덕션 수준.

**이번 주 해야 할 것**
- 사용자 간 데이터 격리 테스트 (A의 JWT로 B 리소스 접근 시 403)
- Rate limit 로직 단위 테스트 (역할별 임계값, KV mock)
- 이미지 업로드 용량·포맷 제한 단위 테스트
- gitleaks CI 통합 (`.github/workflows/ci.yml`)
- Sentry 알림 임계치 설정
- 비용 알림 (일일 $100 초과 시 Slack)
- 앱 내 피드백 버튼 ("이 풀이가 도움됐나요?")
- subscriptions 테이블 SQL 마이그레이션 추가 (Week 6 미완료 이월)

**이번 주 금지**
- 신규 기능 추가
- UI 디자인 대규모 변경
- 프롬프트 대규모 재작성

작업 전 `docs/sprints/week-7-hardening.md` 체크리스트를 확인하세요.

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
- **TDD로 기능 검증** — Week 8 전까지 실제 인프라·키가 없으므로, 구현한 기능은 반드시 테스트 코드로 동작을 검증하고 넘어갈 것. 테스트 없이 "될 것 같다"로 완료 처리 금지
