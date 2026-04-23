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

## 테스트 기준 (완료 조건)

> Week 8 이전 실제 인프라·API 키 없음 → **테스트 코드만이 기능 검증 수단**

- [ ] `POST /api/v1/conversations/:id/similar-problem` 단위 테스트 — `ai.generateSimilar` mock으로 3단계 난이도 분기 검증
- [ ] 생성 결과 저장 테스트 — assistant 메시지로 추가, `structured_payload` 포함 확인 (DB mock)
- [ ] "이 문제도 새 대화로 시작하기" 테스트 — `original_image_url = null` 허용, 신규 `problem_sessions` + `conversations` 생성 확인
- [ ] 결제 webhook 스캐폴딩 테스트 — Toss Payments 웹훅 수신 시 로그만 기록, DB 갱신 없음 확인
- [ ] 유사 문제 카드 컴포넌트 테스트 — 문제·답·풀이 토글 렌더링, 난이도 선택 칩 상태
- [ ] 요금제 화면 컴포넌트 테스트 — Free/Light/Pro 플랜 렌더, "베타 기간 무료" 뱃지 표시
- [ ] `npm test` 에러 없음

비용($0.01/문제), 개념 일치도(4.0/5.0), Toss 결제 스모크 테스트는 Week 8에서 실제 API 키로 진행.

## 품질 기준

- [ ] 유사 문제 3단계 난이도 분기가 테스트로 보장됨
- [ ] 결제 stub이 DB를 건드리지 않음이 테스트로 보장됨
- [ ] 실측 지표(생성 비용, 개념 일치도)는 Week 8 항목

## 완료 판정

`npm test` 통과 — 유사 문제 생성·저장·난이도 분기·결제 stub이 mock으로 검증된 상태.
실제 AI 생성 품질 및 Toss 결제 스모크 테스트는 Week 8에서 확인.
