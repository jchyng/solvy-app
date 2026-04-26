# Week 3 — Core Loop 1: 문제 인식 + 메인 분석

## 📖 이번 주 필독
- `context/00-vision.md` §3.1 문제 분석 + 최적 풀이 + 실전 팁
- `context/01-principles.md` §5대 원칙, §반드시 할 것 (꼬리 질문 빈 칩 금지)
- `architecture/ai-providers.md` §`analyze` 프롬프트 설계, §라우팅 로직
- `architecture/data-model.md` §problem_sessions, §conversations, §messages
- `design-system.md` §업로드 뷰, §인식 확인 뷰, §분석 카드, §꼬리 질문 칩

## 📕 이번 주 건드리지 말 것
- 대화 후속 턴 (Week 4)
- 즐겨찾기·폴더·이름 지정 (Week 5) — 단, **분석 카드 상단 버튼 자리는 비워 둠**
- 유사 문제 생성 (Week 6)

## 🎯 이번 주 목표
**학생이 문제 사진을 올리면 `analysis_result`까지 나오고, `conversations`가 자동 생성되어 첫 assistant 메시지로 분석 카드가 저장된다.**

---

## 플로우

```
[사진 업로드]
    ↓
[R2 저장, 원본 URL]
    ↓
[ai.ocrPrinted] → recognized_problem
    ↓
[ai.classify] → difficulty, concepts
    ↓
[ai.analyze] → intent / concepts / optimal_solution / exam_tips / follow_up_questions
    ↓
[셀프체크] confidence < 0.8이면 재분석
    ↓
[problem_sessions.analysis_result 저장, status='done']
    ↓
[conversations 생성, 첫 assistant message 저장 (analysis_result를 content + structured_payload로)]
    ↓
[클라이언트 폴링 또는 SSE 알림]
```

---

## 백엔드 체크리스트

- [x] `POST /api/v1/problems` — 이미지 업로드, `problem_sessions` 생성
- [x] 이미지 압축 + R2 업로드 로직
- [x] 비동기 처리: 업로드 즉시 응답, 분석은 백그라운드 (Cloudflare Queues 또는 단순 단일 핸들러)
- [x] `GET /api/v1/problems/:id` — 상태 폴링
- [ ] (선택) SSE 엔드포인트 `/api/v1/problems/:id/stream` — 폴링으로 구현 (SSE 미적용)
- [x] `needs_confirmation` 플로우 — OCR confidence 낮으면 `status='confirming'`
- [x] `POST /api/v1/problems/:id/confirm` — 사용자 수정본으로 재분석 진행
- [x] 응답 JSON 스키마 강제 (각 프로바이더 structured output 활용)
- [x] 분석 완료 시점에 `conversations` 생성 + 첫 assistant `messages` 삽입
- [x] `ai.analyze` 프롬프트 튜닝 (`architecture/ai-providers.md` §`analyze` 참조)
  - 꼬리 질문은 **실제 제공 가능할 때만** 생성 (빈 칩 금지)

## 프론트엔드 체크리스트

- [x] 업로드 뷰 — 카메라 · 앨범 · 드래그
- [x] 로딩 뷰 — 진행 단계 표시 ("인식 중...", "분석 중...")
- [x] 인식 확인 뷰 — confidence 기반 하이라이트, 수학 키보드로 편집 가능
- [x] **분석 결과 카드**
  - 출제 의도 블록
  - 활용 개념 칩
  - 단계별 최적 풀이 (접기/펼치기)
  - 실전 팁 박스
  - 꼬리 질문 칩 영역
- [x] 분석 카드 상단에 **자리만 확보**: `★ 즐겨찾기`, `✎ 이름 변경`, `⎘ 목록에 추가` (실제 동작은 Week 5)
- [x] 에러 상태 UI (`alert()` 금지, 디자인 시스템 기반)

## 테스트 기준 (완료 조건)

> Week 8 이전 실제 인프라·API 키 없음 → **테스트 코드만이 기능 검증 수단**

- [x] `POST /api/v1/problems` 단위 테스트 — R2 업로드·DB insert mock으로 `problem_sessions` 생성 검증
- [x] OCR → classify → analyze 파이프라인 단위 테스트 — 각 단계 mock 입출력 검증
- [x] `confidence < 0.8` 분기 테스트 — `status='confirming'`으로 전환되는지
- [x] `POST /api/v1/problems/:id/confirm` 테스트 — 재분석 트리거 검증
- [x] 분석 완료 시 `conversations` + 첫 `messages` 자동 생성 테스트
- [x] 빈 꼬리 질문 칩 방지 테스트 — `follow_up_questions`가 빈 배열일 때 응답 스키마 검증
- [x] 프론트엔드 컴포넌트 단위 테스트 — 분석 카드 렌더링, 로딩/에러 상태
- [x] `npm test` 에러 없음

성능(응답 < 10초) 및 품질(4.0/5.0) 측정은 Week 8에서 실제 AI 호출로 진행.

## 품질 기준

- [x] 코드 수준: OCR confidence 체크 로직이 테스트로 보장됨
- [x] 꼬리 질문 빈 칩 방지가 테스트로 보장됨
- [ ] 실측 품질 벤치마크(문제 100개, 4.0/5.0)는 Week 8 항목

## 완료 판정

`npm test` 통과 — 업로드→OCR→분석→대화 생성 파이프라인이 mock으로 E2E 검증된 상태.
실제 사진 업로드 및 10초 응답 측정은 Week 8에서 확인.
