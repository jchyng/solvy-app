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

- [ ] `GET /api/v1/conversations` — 내 대화방 목록 (최근순, `?favorite=true` 필터, 페이지네이션)
- [ ] `GET /api/v1/conversations/:id` — 대화 전체 (problem + messages)
- [ ] `POST /api/v1/conversations/:id/messages` — 학생 메시지 전송, AI 응답 **SSE 스트리밍**
- [ ] 메시지 저장은 스트리밍 완료 후 (중간 끊김 시 부분 저장 정책 결정·문서화)
- [ ] **히스토리 토큰 관리** — 오래된 메시지 단순 자르기 허용, 주석으로 Phase 1.5에 요약 압축 전환 예정 명시
- [ ] `ai.chat` 프롬프트 튜닝 (`architecture/ai-providers.md` §`chat` 참조)
  - 학생 요청 톤 인식: "힌트만 줘" / "내 풀이 봐줘" / "변형 문제 만들어줘"
- [ ] 새 follow_up_questions를 `messages.follow_up_questions`에 저장
- [ ] 메시지 중복 전송 방지 (클라이언트 `idempotency_key`)
- [ ] Anthropic 프롬프트 캐싱 활용 — 시스템 프롬프트 + 초기 컨텍스트 캐시

## 프론트엔드 체크리스트

- [ ] 챗 UI — 말풍선, 마크다운 + 수식 렌더링, 단계별 풀이 접기/펼치기
- [ ] 꼬리 질문 칩 — 가장 최근 assistant 메시지 하단에 표시, 탭하면 자동 전송
- [ ] 입력창 — 텍스트 전송 (Phase 1)
- [ ] 타이핑 인디케이터 + 스트리밍 토큰 애니메이션
- [ ] 스크롤 — 신규 메시지에서 자동 하단 이동, 사용자가 위로 올리면 자동 스크롤 일시 정지
- [ ] 네트워크 끊김·응답 에러 시 재시도 버튼 UI

## 품질 기준

- [ ] 내부 테스트 10명 대상 대화 품질 평균 4.0/5.0
- [ ] `ai.chat` 스트리밍 시작 < 3초
- [ ] 5턴 이상 이어가도 히스토리 누락·중복 없음
- [ ] **Anthropic 프롬프트 캐싱 적중률 40% 이상** (`usage_events.cached_tokens` 기반)

## 완료 판정

학생이 Week 3의 분석 카드에서 꼬리 질문을 탭하면 2초 안에 스트리밍이 시작되고, 10턴을 이어가도 서비스가 느려지지 않는다. 프롬프트 캐싱으로 토큰 비용이 실측 확인된다.
