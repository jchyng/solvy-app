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
| 현재 스프린트 작업 | `docs/sprints/week-8-launch.md` |
| 색상·타이포·컴포넌트 | `design-system/INDEX.md` |
| 전체 문서 인덱스 | `docs/README.md` |

---

## 현재 스프린트: Week 8 — Launch: 인프라 세팅 + 베타 런칭

**목표**: 인프라·계정·배포를 세팅하고 실제 사용자에게 제품을 연다.

**코드 완료 항목**
- ✅ 베타 대기열 API (POST /api/v1/waitlist) + DB 마이그레이션
- ✅ 랜딩 페이지 (`/`) + 이용약관(`/terms`) + FAQ(`/faq`)
- ✅ 앱 라우트 `/app`으로 이동 (비인증 사용자는 랜딩으로)

**배포 2단계 전략**
- **Phase 1** (현재): 라즈베리파이 개발 서버에서 기능 전체 검증 → `docs/week-8-raspi-dev.md`
- **Phase 2** (Phase 1 통과 후): 클라우드 전환 → `docs/week-8-infra-checklist.md`

**이번 주 금지**
- 신규 기능 추가 (Week 7·8 연속 금지)
- 제품 축 재검토
- 결제 활성화 (베타 후)

작업 전 `docs/sprints/week-8-launch.md` 및 `docs/week-8-infra-checklist.md` 확인하세요.

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

---

## 테스트 기준

### 레이어 결정 — 무엇을 언제 쓸지

| 레이어 | 도구 | 언제 |
|---|---|---|
| **단위** | Vitest + jsdom | 비동기 스토어 로직, 비즈니스 로직이 있는 페이지/컴포넌트 |
| **통합 (백엔드)** | Vitest + `app.request()` | Hono route handler — 이미 충분히 작성됨 |
| **E2E** | Playwright | 공개 퍼널(랜딩→대기열), 핵심 골든패스(업로드→채팅) 2-3개만 |
| **시스템** | — | **Skip** — `wrangler dev` + Supabase 로컬 셋업 비용이 팀 규모 대비 과다 |

### 단위 테스트 — 반드시 작성

- **비동기 상태 머신** — Zustand store에 `setInterval` 폴링·타이머·다단계 phase 전환이 있을 때
- **비즈니스 로직이 있는 페이지** — API 호출·상태 분기·사용자 인터랙션이 결합된 페이지 컴포넌트
- **공개 퍼널** — 가입·결제·대기열처럼 전환율이 중요한 흐름

### 단위 테스트 — 작성하지 않아도 됨

- 순수 정적 마크업 페이지 (`TermsPage`, `FoundingMemberPage` 등 — 로직 없음)
- 표현형(presentational) 컴포넌트 — props를 그대로 렌더링하는 컴포넌트
- 단순 switch/if 렌더링 컴포넌트 — 로직이 이미 store 테스트로 커버될 때 (`HomePage` 등)

### 프론트엔드 단위 테스트 패턴

```ts
// React 제어 입력값 변경 — el.value = '...' 은 React 내부 tracker를 갱신하지 않음
const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
nativeSetter?.call(input, value)
input.dispatchEvent(new Event('input', { bubbles: true }))

// fetch → json() 비동기 체인 플러시 — 각 Promise.resolve()가 마이크로태스크 1단계
await act(async () => { await Promise.resolve() })
await act(async () => { await Promise.resolve() })
await act(async () => { await Promise.resolve() })

// setInterval 폴링 테스트
vi.useFakeTimers()
await vi.advanceTimersByTimeAsync(2000) // 폴링 1틱
// afterEach: store.reset() + vi.useRealTimers()

// 모킹 패턴
vi.mock('@/services/api')
import { api } from '@/services/api'
vi.mocked(api.problems.upload).mockResolvedValue(...)

// react-router-dom 부분 모킹 (실제 모듈 + 일부 override)
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn().mockReturnValue(vi.fn()) }
})
```

### E2E 인증 주입

`userStore`가 `persist` 미들웨어를 쓰지 않으므로 localStorage 주입은 동작하지 않는다.
`page.addInitScript()`로 페이지 JS 실행 전 `window.__E2E_AUTH`를 설정하면 `userStore` 초기화 시 읽는다.

```ts
await page.addInitScript((user) => {
  ;(window as Record<string, unknown>).__E2E_AUTH = { user, token: 'e2e-fake-token' }
}, E2E_USER)
```

### E2E 대상 (현재 2개, 이게 전부)

| 파일 | 검증 내용 |
|---|---|
| `e2e/landing-waitlist.spec.ts` | 랜딩 대기열 등록 성공·실패 |
| `e2e/upload-to-chat.spec.ts` | 파일 업로드 → 폴링 → `/chat/:id` 이동 → AnalysisCard 렌더링 |

새 E2E를 추가하기 전에 단위 테스트로 커버할 수 없는지 먼저 확인할 것.
