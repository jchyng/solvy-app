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

- [ ] `server/lib/ai/types.ts` — `UnifiedLLMResponse`, `Role`, `LLMError` 정의
- [ ] `server/lib/ai/adapters/base.ts` — `LLMAdapter` 인터페이스 (`generate(params) → UnifiedLLMResponse`)
- [ ] `adapters/anthropic.ts` — 프롬프트 캐싱 (`cache_control`) 지원
- [ ] `adapters/gemini.ts`
- [ ] `adapters/openrouter.ts`
- [ ] `adapters/mathpix.ts`
- [ ] 각 어댑터 에러를 공통 `LLMError` 타입으로 정규화

### 라우터 레이어

- [ ] `router/config.ts` — `roleRoutes` 매핑 (`architecture/ai-providers.md` §역할-모델 매핑표 그대로)
- [ ] `router/router.ts` — `callWithFallback` 구현
- [ ] `router/tracker.ts` — 매 호출을 `usage_events`에 비동기 기록 (실패해도 호출에 영향 없음)
- [ ] 재시도 로직 (지수 백오프, 일시 장애 구분)

### 역할 레이어 (스텁만, 본격 구현은 해당 주차)

- [ ] `roles/ocrPrinted.ts`
- [ ] `roles/classify.ts`
- [ ] `roles/analyze.ts` (기본 구현, Week 3에서 프롬프트 튜닝)
- [ ] `roles/chat.ts` (기본 구현, Week 4에서 프롬프트 튜닝)
- [ ] 나머지 역할(`ocrHandwriting`, `generateSimilar`, `nameNote`)은 파일만 생성
- [ ] 각 역할의 프롬프트를 별도 `prompts/` 폴더로 분리
- [ ] `index.ts` — public API (`ai.analyze()`, `ai.chat()`, ...)

### 테스트

- [ ] 역할별 단위 테스트 (mock 프로바이더)
- [ ] **4개 프로바이더 실제 호출 통합 테스트 통과**
- [ ] **Anthropic 장애 주입 → DeepSeek R1 자동 폴백 확인** (필수)
- [ ] `usage_events` 테이블에 호출 내역 정확히 기록되는지 검증

## 품질 기준

- [ ] 비즈니스 로직이 프로바이더 SDK를 직접 호출하는 부분이 0개 (전부 `ai.XXX()` 경유)
- [ ] 각 역할별 예상 비용 실측 값 문서화 (이 주 끝에 `docs/architecture/ai-providers.md`에 추가)
- [ ] Anthropic 프롬프트 캐싱이 `usage_events.cached_tokens`에 기록됨

## 완료 판정

`await ai.analyze({ problem })` 한 줄로 Claude Sonnet이 호출되고, Anthropic을 죽이면 자동으로 DeepSeek R1이 응답한다. 모든 호출이 `usage_events`에 들어온다.
