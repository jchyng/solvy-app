# AI Providers

> **주로 참조하는 주차**: Week 2(추상화), Week 3(analyze), Week 4(chat), Week 6(generateSimilar).

---

## 핵심 원칙

**"각 프로바이더와 직접 계약"** 전략 확정. OpenRouter 단일 게이트웨이는 다음 이유로 기각:

1. Claude Sonnet에 100% 마크업 → 제품의 심장에 2배 비용
2. 프롬프트 캐싱·배치 API 직접 활용 불가 (50~90% 절감 기회 상실)
3. 한국 리전 라우팅 제약 → 응답 속도 저하
4. 자체 통합 대시보드 구축 예정 → OpenRouter 편의성 불필요

---

## 4개 프로바이더

| 프로바이더 | 역할 | 왜 직접? |
|---|---|---|
| **Anthropic Claude** | 문제 분석 · 멀티턴 대화 (핵심) | 교육 톤 섬세함 최상, 마크업 회피로 비용 50% 절감, 프롬프트 캐싱 |
| **Google Gemini** | 멀티모달 OCR, 난이도·개념 분류, 노트 자동 제목 | Flash 가격 대비 멀티모달 성능 우수, 한국 리전 지원 |
| **OpenRouter** | DeepSeek V3/R1, Qwen 등 오픈소스 | 중국·오픈소스 직접 계약 복잡, 게이트웨이가 합리적 |
| **Mathpix** | 손글씨 수학 OCR (Phase 1.5+) | 상업 표준, 대체 불가 |

---

## 역할-모델 매핑표

| 역할 | 주 프로바이더 | 주 모델 | 폴백 1 | 폴백 2 |
|---|---|---|---|---|
| 이미지 OCR (인쇄) | Google | gemini-flash | OpenRouter → gemini-flash | Anthropic → claude-haiku |
| 난이도·개념 분류 | Google | gemini-flash | OpenRouter → qwen3-8b | - |
| **문제 분석 + 최적 풀이** | **Anthropic** | **claude-sonnet** | OpenRouter → deepseek-r1 | Google → gemini-pro |
| **대화 후속 응답** | **Anthropic** | **claude-sonnet** | OpenRouter → deepseek-r1 | Google → gemini-pro |
| 유사 문제 생성 | OpenRouter | deepseek-v3 | Google → gemini-flash | - |
| 노트 자동 제목 생성 | Google | gemini-flash | Anthropic → claude-haiku | - |

**모델명은 API 호출 시점에 최신 버전 확인 필수.** 여기 적힌 모델명은 설계 시점 기준.

---

## 라우팅 로직

```
[문제 이미지 입력]
      ↓
[OCR: Gemini Flash]
      ↓
[난이도·개념 분류: Gemini Flash or Qwen3-8B]
      ↓
[메인 분석: Claude Sonnet]
  - 출제 의도 / 활용 개념 / 최적 풀이 / 실전 팁 / 꼬리 질문
      ↓
[셀프체크] confidence < 0.8이면 재풀이
      ↓
[대화 저장, 채팅방 생성]
      ↓
[이후 모든 대화 턴 — Claude Sonnet]
```

---

## 추상화 레이어 설계

4개 프로바이더가 단일 인터페이스로 호출되고, 모든 호출이 `usage_events`에 기록되는 구조.

```
server/lib/ai/
├── types.ts                    # UnifiedLLMResponse, Role, LLMError
├── adapters/
│   ├── base.ts                 # LLMAdapter 인터페이스
│   ├── anthropic.ts
│   ├── gemini.ts
│   ├── openrouter.ts
│   └── mathpix.ts
├── router/
│   ├── config.ts               # role → provider/model 매핑
│   ├── router.ts               # callWithFallback
│   └── tracker.ts              # usage_events 기록
├── roles/
│   ├── ocrPrinted.ts
│   ├── ocrHandwriting.ts
│   ├── classify.ts
│   ├── analyze.ts              # 문제 분석 (제품의 심장)
│   ├── chat.ts                 # 대화 후속 응답
│   ├── generateSimilar.ts
│   └── nameNote.ts
└── index.ts
```

### 비즈니스 로직은 역할 이름으로만 호출

```typescript
// ❌ 나쁜 예
const anthropic = new Anthropic({ apiKey: ... });
const res = await anthropic.messages.create({ model: 'claude-sonnet-4.6', ... });

// ✅ 좋은 예
const res = await ai.analyze({ problem, recognizedText });
const reply = await ai.chat({ conversationHistory, userMessage });
```

---

## 공통 응답 포맷

```typescript
interface UnifiedLLMResponse {
  content: string;
  structuredOutput?: unknown;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
  cost: {
    amountUsd: number;
    provider: string;
    model: string;
  };
  metadata: {
    latencyMs: number;
    finishReason: 'stop' | 'length' | 'error';
  };
}
```

`cost` 필드는 반드시 채움. 통합 대시보드의 단일 진실 소스.

---

## `analyze` 프롬프트 설계 (제품의 핵심 자산)

```
당신은 'Solvy'라는 이름의 수학 튜터입니다.
학생이 방금 문제 사진을 올렸습니다. 당신의 역할은 이 문제 하나에 대해
학생이 "이 풀이는 두고두고 봐야겠다"고 느낄 만한 분석을 제공하는 것입니다.

원칙:
1. 출제 의도를 먼저 말합니다 — 이 문제가 무엇을 테스트하려는지.
2. 활용 개념을 명시합니다 — 학교 교육과정 단원명 기준.
3. 최적 풀이를 단계별로 제시합니다 — 불필요한 단계는 합치고, 핵심 도약은 설명합니다.
4. 실전 팁을 덧붙입니다 — 시험장에서 시간 단축, 실수 회피, 기억 트릭.
5. 다른 풀이법이 있다면 본문에 쏟아붓지 말고, 꼬리 질문 칩으로 유도합니다.
   (예: "Q1. 다른 풀이 방법도 알려줘?")
6. 학생이 처음 보는 개념이 있으면 선행 학습 질문도 칩으로 제안합니다.

출력 형식 (JSON):
{
  "intent": "출제 의도 (1~2문장)",
  "concepts": ["활용 개념 1", "활용 개념 2", ...],
  "optimal_solution": {
    "steps": [
      { "title": "단계 제목", "detail": "상세 설명 (수식 가능)", "visualization_hint": "선택" },
      ...
    ]
  },
  "exam_tips": ["실전 팁 1", "실전 팁 2", ...],
  "follow_up_questions": [
    { "id": "Q1", "label": "다른 풀이 방법도 알려줘?" },
    { "id": "Q2", "label": "비슷한 유형 하나만 만들어줘" },
    ...
  ],
  "confidence": 0.0~1.0
}
```

### 꼬리 질문 생성 규칙
- 실제로 제공 가능한 내용일 때만 칩 생성 (다른 풀이법이 없으면 Q1 생성하지 않음)
- 최대 4개
- 라벨은 학생 입장의 자연어
- AI가 내부적으로 해당 답변을 미리 준비할 필요 없음 (학생이 탭할 때 `ai.chat` 호출)

---

## `chat` 프롬프트 설계

```
당신은 Solvy 수학 튜터입니다. 방금 분석한 문제에 대해 학생과 대화를 이어갑니다.

컨텍스트:
- 원본 문제: {recognized_problem}
- 이전 최적 풀이 요약: {optimal_solution_summary}
- 대화 히스토리: {history}

원칙:
- 학생이 "힌트만 줘"라고 하면 답을 직접 말하지 않고 단계를 쪼개줍니다.
- 학생이 "내가 푼 풀이 봐줘"라고 하면 맞은 부분·놓친 부분을 구분해 말합니다.
- 학생이 "변형 문제 만들어줘"라고 하면 난이도를 명시하고 답과 풀이도 같이 줍니다.
- 대답이 길어지면 꼬리 질문 칩을 다시 제공합니다.

출력 형식 (JSON):
{
  "answer": "답변 본문 (마크다운 + 수식)",
  "follow_up_questions": [ { "id": "Q1", "label": "..." }, ... ]
}
```

---

## 비용 최적화 장치

직접 계약 덕분에 활용 가능한 최적화:

1. **Anthropic 프롬프트 캐싱** (`cache_control`) — 시스템 프롬프트 재사용 시 **입력 토큰 90% 할인**. `ai.chat`에서 대화 히스토리 누적 시 효과 큼.
2. **Google 컨텍스트 캐싱** — 캐시 적중 시 75% 할인
3. **Anthropic Batch API** — 실시간 필요 없는 작업(유사 문제 대량 생성, 노트 자동 제목 일괄) 50% 할인
4. **Google 리전 최적화** — asia-northeast3 (서울), 지연 대폭 감소
5. **볼륨 할인** — 베타 후 월 $2,000+ 시 직접 협상 가능

---

## 폴백 체인 작동 원칙

- 주 프로바이더 장애·timeout 시 순차적으로 폴백
- 각 단계마다 `fallback_depth`를 `usage_events`에 기록
- 응답 구조는 동일하게 정규화 (`UnifiedLLMResponse`)
- **Anthropic 장애 주입 → DeepSeek R1 자동 폴백**을 통합 테스트로 검증 필수 (Week 2)
