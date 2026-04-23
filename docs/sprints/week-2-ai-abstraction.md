# Week 2 — Foundation 2: AI 추상화 레이어

## 📖 이번 주 필독
- `architecture/ai-providers.md` (**전체**)
- `architecture/data-model.md` §usage_events

## 📕 이번 주 건드리지 말 것
- 문제 업로드 · 분석 UI (Week 3)
- 실제 프롬프트 본문을 완성 수준으로 튜닝 (Week 3~4에서 해당 역할과 함께)
- 유사 문제·노트 자동 제목 역할 (Week 5~6에서 각 주차에 구현)

## 🎯 이번 주 목표
**4개 프로바이더가 단일 인터페이스로 호출되고, 모든 호출이 `usage_events`에 자동 기록된다.** 폴백 체인이 실제로 작동한다.

---

## 구현 체크리스트

### 어댑터 레이어

- [x] `server/lib/ai/types.ts` — `UnifiedLLMResponse`, `Role`, `LLMError` 정의
- [x] `server/lib/ai/adapters/base.ts` — `LLMAdapter` 인터페이스 (`generate(params) → UnifiedLLMResponse`)
- [x] `adapters/anthropic.ts` — 프롬프트 캐싱 (`cache_control`) 지원
- [x] `adapters/gemini.ts`
- [x] `adapters/openrouter.ts`
- [x] `adapters/mathpix.ts`
- [x] 각 어댑터 에러를 공통 `LLMError` 타입으로 정규화

### 라우터 레이어

- [x] `router/config.ts` — `roleRoutes` 매핑 (`architecture/ai-providers.md` §역할-모델 매핑표 그대로)
- [x] `router/router.ts` — `callWithFallback` 구현
- [x] `router/tracker.ts` — 매 호출을 `usage_events`에 비동기 기록 (실패해도 호출에 영향 없음)
- [x] 재시도 로직 (지수 백오프, 일시 장애 구분)

### 역할 레이어 (스텁만, 본격 구현은 해당 주차)

- [x] `roles/ocrPrinted.ts`
- [x] `roles/classify.ts`
- [x] `roles/analyze.ts` (기본 구현, Week 3에서 프롬프트 튜닝)
- [x] `roles/chat.ts` (기본 구현, Week 4에서 프롬프트 튜닝)
- [x] 나머지 역할(`ocrHandwriting`, `generateSimilar`, `nameNote`)은 파일만 생성
- [x] 각 역할의 프롬프트를 별도 `prompts/` 폴더로 분리
- [x] `index.ts` — public API (`ai.analyze()`, `ai.chat()`, ...)

### 테스트 (완료 조건)

> Week 8 이전 실제 API 키 없음 → **mock 기반 테스트가 유일한 검증 수단**

- [x] 각 어댑터 단위 테스트 — mock HTTP 응답으로 `UnifiedLLMResponse` 변환 검증
- [x] `callWithFallback` 단위 테스트 — 1차 프로바이더 에러 시 2차로 전환되는지
- [x] **폴백 시나리오 테스트** — Anthropic mock 장애 주입 → DeepSeek R1 자동 전환 확인
- [x] `tracker.ts` 단위 테스트 — `usage_events` insert가 정확한 필드로 호출되는지 (DB mock)
- [x] 각 역할(analyze, chat 등) 단위 테스트 — mock 어댑터 반환값으로 출력 스키마 검증
- [x] `npm test` 에러 없음 (109 PASS)

실제 API 호출 통합 테스트 및 비용 실측은 Week 8에서 진행.

## 품질 기준

- [x] 비즈니스 로직이 프로바이더 SDK를 직접 호출하는 부분이 0개 (전부 `ai.XXX()` 경유)
- [x] 각 역할별 예상 비용 추정치 문서화 (`docs/architecture/ai-providers.md`에 추가)
- [x] Anthropic 프롬프트 캐싱 코드가 `usage_events.cached_tokens`를 기록하도록 구현됨

## 완료 판정

`npm test` 통과 — mock 프로바이더로 폴백 체인이 작동하고, `usage_events` insert가 호출되는 것이 테스트로 검증된 상태.
실제 API 키로 Claude Sonnet 호출 및 비용 실측은 Week 8에서 확인.
