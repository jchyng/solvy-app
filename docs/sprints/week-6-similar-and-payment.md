# Week 6 — Polish 2: 유사 문제 생성 + 결제 준비

## 📖 이번 주 필독
- `architecture/ai-providers.md` §`generateSimilar` 역할 매핑
- `context/02-business-model.md` §구독 플랜, §베타 참여자 혜택
- `architecture/data-model.md` §messages (생성된 문제를 어디에 저장하는지)

## 📕 이번 주 건드리지 말 것
- 결제 로직 **활성화** (베타 후)
- 새 제품 기능 (Week 7은 Hardening, 추가 금지)
- 과목 확장 (Phase 2)

## 🎯 이번 주 목표
**유사 문제 생성이 대화 안에서 자연스럽게 이어진다**, 그리고 **결제 스택이 세팅되어 있어 베타 후 즉시 활성화 가능**하다.

---

## 유사 문제 생성

### 백엔드
- [ ] `roles/generateSimilar.ts` — OpenRouter DeepSeek V3
- [ ] 요청 파라미터: `conversation_id`, `difficulty` (`same` | `up` | `down`)
- [ ] 출력: 문제 텍스트 + 정답 + 풀이 (구조화 JSON)
- [ ] 생성 결과를 **현재 대화**의 assistant 메시지로 추가 (`structured_payload`에 보존)
- [ ] 엔드포인트: `POST /api/v1/conversations/:id/similar-problem`
  - 꼬리 질문 칩 탭이 내부적으로 이 엔드포인트를 호출하게 할 수도 있고, 채팅 엔드포인트에서 분기할 수도 있음 — **구현 방식 문서화 필수**

### 프론트엔드
- [ ] "비슷한 문제 만들어줘" 꼬리 질문 칩 탭 → 난이도 선택 (`같은 / 한 단계 위 / 한 단계 아래`) 칩 노출 → 선택 시 생성
- [ ] 생성된 문제를 말풍선 안에 카드 형태로 렌더 (문제 / 답 토글 / 풀이 토글)
- [ ] "이 문제도 새 대화로 시작하기" 버튼 → 신규 `problem_sessions` + `conversations` 생성
  - 이 경우 원본 이미지가 없으므로 `original_image_url`은 null 허용 (스키마 확인)

## 결제 준비 (stub만)

### 백엔드
- [ ] `subscriptions` 테이블 추가 — `user_id`, `plan` (`free`/`light`/`pro`), `status`, `current_period_end`
- [ ] Toss Payments 테스트 키로 SDK 설치 및 webhook 엔드포인트 스캐폴딩
- [ ] 결제 로직은 비활성 (웹훅 수신해도 DB 갱신 안 함, 로그만)

### 프론트엔드
- [ ] 요금제 선택 화면 UI — Free / Light / Pro
- [ ] 금액은 플레이스홀더 (`context/02-business-model.md` §구독 플랜 참조)
- [ ] "베타 기간 무료" 뱃지 노출
- [ ] Founding Member 혜택 설명 페이지 (`context/02-business-model.md` §베타 참여자 혜택 기반)

## 품질 기준

- [ ] 유사 문제 평균 생성 비용 < $0.01
- [ ] 생성된 유사 문제 개념 일치도 내부 평가 4.0/5.0 (10개 샘플)
- [ ] 결제 UI가 베타 기간 동안 사용자에게 혼동을 주지 않음 — "무료" 메시지가 명확

## 완료 판정

학생이 대화 안에서 유사 문제를 3단계 난이도로 받아볼 수 있고, 요금제 화면은 존재하되 베타 기간임을 명확히 안내한다. Toss 테스트 결제가 스모크 테스트 수준으로 흐른다.
