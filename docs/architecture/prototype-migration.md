# Prototype Migration

> **주로 참조하는 주차**: Week 1. 이후에는 프로토타입 코드를 이식할 때만.

---

## 프로토타입 개요

- **구성**: React + TypeScript + Gemini API
- **출처**: Google AI Studio에서 만들었기 때문에 Gemini만 사용
- **특징**: `USE_MOCK = true`로 하드코딩된 응답 반환
- **위치**: 기존 `src/` 폴더 → Week 1 시작 시 `legacy/`로 이동

---

## ✅ 유지할 것 (이식 대상)

### 디자인 토큰 구조
- **Tailwind v4 + CSS 변수 + `@theme`** 구조 (`index.css`) 그대로 유지
- 상세 토큰은 `docs/design-system.md` 참조

### 상태관리
- **Zustand 패턴** — 가볍고 확장 가능. 단 스토어는 **재구성** (현재 대화 · 노트 목록 · 유저 분리)

### 컴포넌트
- **`MarkdownView`** — react-markdown + remark-math + rehype-katex 조합
- **`InteractiveAreaIntegral`** SVG 시각화 — 시각화 확장의 레퍼런스

### 타입
- **`AnalysisResult`** 구조 — `intent`, `steps`, `hints`, `tip` 등 교육학적 필드가 신규 `analyze` 역할의 출력 스키마 기반이 됨

---

## ❌ 버릴/바꿀 것

| 프로토타입 | 이유 | 대체 |
|---|---|---|
| `USE_MOCK = true` 하드코딩 | 실 API 호출 필요 | 제거 |
| `gemini.ts` 단일 파일 | 다중 프로바이더·폴백 필요 | `server/lib/ai/` 추상화 레이어 (`architecture/ai-providers.md`) |
| `process.env.GEMINI_API_KEY` 프론트 노출 | 보안 위반 | 서버사이드로 이동 |
| `"gemini-3.1-pro-preview"` 모델명 하드코딩 | 모델 교체 비용 증가 | `roleRoutes` config로 이동 |
| `history: []` 인메모리 저장 | 영속성 없음 | Supabase `conversations` + `messages` 테이블 |
| `alert()` 에러 처리 | UX 저하 | 디자인 시스템 에러 UI (`design-system.md` 참조) |
| 모드 선택 화면 (설명하기/힌트/전체풀이) | 제품 축 변경 | 전부 제거. 바로 분석 결과 카드로 |
| 설명하기 모드 관련 컴포넌트 | 제품 축 변경 | 새 채팅 UI로 대체 |
| 학부모 관련 코드·라우트·컴포넌트 (있다면) | Phase 1 범위 밖 | 전부 삭제 |

---

## 마이그레이션 순서 (Week 1 작업)

1. 기존 `src/` → `legacy/` 이동 (참고용 보존)
2. 새 `src/` 생성, `features/` 기반 구조
   ```
   src/
   ├── features/
   │   ├── problem/        # 업로드, 인식 확인, 분석 카드
   │   ├── conversation/   # 채팅 UI, 꼬리 질문 칩
   │   └── notes/          # 노트 홈, 폴더, 즐겨찾기
   ├── shared/             # 공용 컴포넌트, 유틸
   ├── pages/              # 라우트 페이지
   ├── services/           # API 클라이언트
   └── stores/             # Zustand 스토어
   ```
3. `index.css` 디자인 토큰 재사용
4. `MarkdownView`, `InteractiveAreaIntegral` 이식
5. 타입을 새 스키마로 재작성 (`Conversation`, `Message`, `NoteFolder`, `AnalysisResult`)

---

## 주의사항

- **프로토타입의 UX 흐름을 그대로 따라가면 안 됨** — 제품 축이 "설명하기" → "풀이 노트"로 바뀜
- `legacy/` 폴더는 **절대 import하지 않음**. 코드 참고만 허용
- 프로토타입에 남은 Gemini 단독 호출 패턴을 습관적으로 복사하지 말 것 → `architecture/ai-providers.md`의 추상화 레이어 통과
