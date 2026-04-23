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

- [ ] `POST /api/v1/problems` — 이미지 업로드, `problem_sessions` 생성
- [ ] 이미지 압축 + R2 업로드 로직
- [ ] 비동기 처리: 업로드 즉시 응답, 분석은 백그라운드 (Cloudflare Queues 또는 단순 단일 핸들러)
- [ ] `GET /api/v1/problems/:id` — 상태 폴링
- [ ] (선택) SSE 엔드포인트 `/api/v1/problems/:id/stream` — 없으면 폴링
- [ ] `needs_confirmation` 플로우 — OCR confidence 낮으면 `status='confirming'`
- [ ] `POST /api/v1/problems/:id/confirm` — 사용자 수정본으로 재분석 진행
- [ ] 응답 JSON 스키마 강제 (각 프로바이더 structured output 활용)
- [ ] 분석 완료 시점에 `conversations` 생성 + 첫 assistant `messages` 삽입
- [ ] `ai.analyze` 프롬프트 튜닝 (`architecture/ai-providers.md` §`analyze` 참조)
  - 꼬리 질문은 **실제 제공 가능할 때만** 생성 (빈 칩 금지)

## 프론트엔드 체크리스트

- [ ] 업로드 뷰 — 카메라 · 앨범 · 드래그
- [ ] 로딩 뷰 — 진행 단계 표시 ("인식 중...", "분석 중...")
- [ ] 인식 확인 뷰 — confidence 기반 하이라이트, 수학 키보드로 편집 가능
- [ ] **분석 결과 카드**
  - 출제 의도 블록
  - 활용 개념 칩
  - 단계별 최적 풀이 (접기/펼치기)
  - 실전 팁 박스
  - 꼬리 질문 칩 영역
- [ ] 분석 카드 상단에 **자리만 확보**: `★ 즐겨찾기`, `✎ 이름 변경`, `⎘ 목록에 추가` (실제 동작은 Week 5)
- [ ] 에러 상태 UI (`alert()` 금지, 디자인 시스템 기반)

## 품질 기준

- [ ] 벤치마크 문제 100개 분석 품질 내부 평가 평균 4.0/5.0
- [ ] 평균 응답 시간 < 10초 (이미지 업로드 + 분석 포함)
- [ ] 에러율 < 3%
- [ ] 생성된 꼬리 질문 칩 샘플 20개 수동 검수: 빈 칩·무의미 칩 없음

## 완료 판정

학생이 문제 사진 1장 업로드 → 10초 내에 분석 카드가 뜨고, DB에 `problem_sessions`와 `conversations` 한 쌍이 생성되어 있다. 새로고침해도 분석 결과가 남아 있다.
