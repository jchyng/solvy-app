# Week 4 — Core Loop 2: 멀티턴 대화

## 📖 이번 주 필독
- `context/00-vision.md` §3.2 대화형 후속 질문
- `architecture/ai-providers.md` §`chat` 프롬프트 설계, §비용 최적화 (캐싱)
- `architecture/data-model.md` §messages, §conversations
- `design-system.md` §채팅 UI, §꼬리 질문 칩

## 📕 이번 주 건드리지 말 것
- 즐겨찾기·폴더·이름 지정 (Week 5)
- 유사 문제 생성 칩은 보이되 실제 동작은 Week 6
- 손글씨 · 음성 · 이미지 메시지 입력 (Phase 1.5+)

## 🎯 이번 주 목표
**학생이 꼬리 질문 칩을 탭하거나 자유 텍스트를 입력하면 대화가 이어지고, 새 꼬리 질문 칩이 갱신된다.** 대화 히스토리가 누적되어도 비용·속도가 관리된다.

---

## 플로우

```
[분석 결과 카드 = conversation의 첫 assistant 메시지]
    ↓
[학생 입력]
    ├─ 꼬리 질문 칩 탭 → 해당 label을 user 메시지로 전송
    └─ 자유 텍스트 입력
    ↓
[messages에 role=user 추가]
    ↓
[ai.chat] — Claude Sonnet, 이전 N턴 포함 (토큰 한도 관리)
    ↓
[응답: answer + 새 follow_up_questions]
    ↓
[messages에 role=assistant 추가, conversations.last_message_at 갱신]
    ↓
[스트리밍으로 UI에 출력, 꼬리 질문 칩 갱신]
    ↓
[무한 반복 가능]
```

---

## 백엔드 체크리스트

- [x] `GET /api/v1/conversations` — 내 대화방 목록 (최근순, `?favorite=true` 필터, 페이지네이션)
- [x] `GET /api/v1/conversations/:id` — 대화 전체 (problem + messages)
- [x] `POST /api/v1/conversations/:id/messages` — 학생 메시지 전송, AI 응답 **SSE 스트리밍**
- [x] 메시지 저장은 스트리밍 완료 후 (중간 끊김 시 부분 저장 정책 결정·문서화)
- [x] **히스토리 토큰 관리** — 오래된 메시지 단순 자르기 허용, 주석으로 Phase 1.5에 요약 압축 전환 예정 명시
- [x] `ai.chat` 프롬프트 튜닝 (`architecture/ai-providers.md` §`chat` 참조)
  - 학생 요청 톤 인식: "힌트만 줘" / "내 풀이 봐줘" / "변형 문제 만들어줘"
- [x] 새 follow_up_questions를 `messages.follow_up_questions`에 저장
- [x] 메시지 중복 전송 방지 (클라이언트 `idempotency_key`)
- [x] Anthropic 프롬프트 캐싱 활용 — 시스템 프롬프트 + 초기 컨텍스트 캐시

## 프론트엔드 체크리스트

- [x] 챗 UI — 말풍선, 마크다운 + 수식 렌더링, 단계별 풀이 접기/펼치기
- [x] 꼬리 질문 칩 — 가장 최근 assistant 메시지 하단에 표시, 탭하면 자동 전송
- [x] 입력창 — 텍스트 전송 (Phase 1)
- [x] 타이핑 인디케이터 + 스트리밍 토큰 애니메이션
- [x] 스크롤 — 신규 메시지에서 자동 하단 이동, 사용자가 위로 올리면 자동 스크롤 일시 정지
- [x] 네트워크 끊김·응답 에러 시 재시도 버튼 UI

## 테스트 기준 (완료 조건)

> Week 8 이전 실제 API 키 없음 → **테스트 코드만이 기능 검증 수단**

- [x] `POST /api/v1/conversations/:id/messages` 단위 테스트 — 메시지 저장, AI 호출 mock
- [x] SSE 스트리밍 핸들러 테스트 — `EventSource` mock으로 청크 수신·조립 검증
- [x] 히스토리 토큰 관리 테스트 — 오래된 메시지 자르기 로직 경계값 검증
- [x] 꼬리 질문 칩 업데이트 테스트 — 새 `follow_up_questions`가 마지막 메시지에 반영되는지
- [x] 중복 메시지 방지 테스트 — `idempotency_key` 동일 요청 2회 전송 시 1회만 저장
- [x] 5턴 대화 히스토리 누락·중복 없음 테스트 (mock DB)
- [x] 프론트 챗 UI 컴포넌트 테스트 — 말풍선 렌더, 스크롤 동작, 에러 재시도 버튼
- [x] `npm test` 에러 없음

스트리밍 < 3초, 캐싱 적중률 40%, 내부 품질 평가는 Week 8에서 실측.

## 품질 기준

- [x] 히스토리 토큰 관리 로직이 테스트로 보장됨
- [x] 중복 메시지 방지가 테스트로 보장됨
- [ ] 실측 지표(캐싱 적중률, 응답 속도, 품질 평가)는 Week 8 항목

## 완료 판정

`npm test` 통과 — 멀티턴 대화 저장·히스토리 관리·중복 방지·꼬리 질문 갱신이 mock으로 검증된 상태.
실제 스트리밍 속도 및 캐싱 적중률 측정은 Week 8에서 확인.
