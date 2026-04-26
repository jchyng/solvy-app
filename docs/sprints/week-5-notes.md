# Week 5 — Polish 1: 풀이 노트 (핵심 차별점)

> **이번 주가 Solvy를 "콴다 대체재"에서 "학생 자산"으로 바꾸는 주입니다.**

## 📖 이번 주 필독
- `context/00-vision.md` §3.3 풀이 노트
- `context/01-principles.md` §5대 원칙 1번
- `architecture/data-model.md` §conversations (title, is_favorite), §note_folders, §conversation_folders
- `architecture/ai-providers.md` §`nameNote` 역할 (자동 제목)
- `design-system.md` §노트 홈, §폴더 카드, §폴더 바텀시트

## 📕 이번 주 건드리지 말 것
- 유사 문제 생성 (Week 6)
- 결제 UI (Week 6)
- 노트 공유 링크 (Phase 2)

## 🎯 이번 주 목표
**대화방이 즐겨찾기·이름·목록으로 개인 자산이 된다.** 노트 홈에서 학생이 자기가 모은 풀이들을 탐색할 수 있다.

---

## 백엔드 체크리스트

### 즐겨찾기 + 이름 지정

- [x] `PATCH /api/v1/conversations/:id` — `is_favorite`, `title` 수정
- [x] **자동 제목 생성** — 사용자가 한 번도 수동 지정하지 않은 대화에 대해 `ai.nameNote` (Gemini Flash) **배치 호출**로 `auto_title` 저장
  - 주기: 분석 완료 직후 1회 + 야간 배치로 미생성분 보강
- [x] 목록 표시 우선순위: `title` > `auto_title` > "제목 없음"
- [x] 소프트 삭제 — `DELETE /api/v1/conversations/:id` → `deleted_at` 설정

### 목록 (폴더)

- [x] `POST /api/v1/folders` — 생성 (`name`, `color`)
- [x] `GET /api/v1/folders` — 내 폴더 목록 (`position` 순, 각 폴더별 대화 개수 포함)
- [x] `PATCH /api/v1/folders/:id` — 이름 · 색상 · 순서
- [x] `DELETE /api/v1/folders/:id` — 폴더만 삭제 (안의 대화는 보존)
- [x] `POST /api/v1/folders/:id/conversations` — 대화를 폴더에 추가 (바디: `conversation_id`)
- [x] `DELETE /api/v1/folders/:id/conversations/:convId` — 폴더에서 대화 제거
- [x] 한 대화가 여러 폴더 소속 가능 (다대다)
- [x] **소유권 체크 필수**: 폴더·대화 둘 다 `user_id == jwt.user_id`

## 프론트엔드 체크리스트

### 노트 홈 `/notes`

- [x] 탭: **최근** / **즐겨찾기** / **목록**
- [x] 카드 리스트 요소: 썸네일(원본 이미지), 제목, 개념 칩, 마지막 활동 시각
- [x] 카드 탭 → 대화방 이동
- [x] 목록 탭: 폴더 카드 그리드 (색상 · 이름 · 개수), 탭하면 `/notes/folders/:id` 진입
- [x] 폴더 내부 뷰: 해당 폴더 대화 카드 리스트

### 편집 플로우

- [x] 폴더 생성·편집 바텀시트 (이름 · 색상 팔레트 6~8개)
- [x] 대화방 내 `⎘ 목록에 추가` → 폴더 멀티 선택 바텀시트 (체크박스, "+ 새 폴더" 버튼 포함)
- [x] 대화방 내 `★` 토글 · `✎ 이름 변경` 모달
- [x] 길게 누르기 → 다중 선택 → 일괄 즐겨찾기·목록 추가·삭제

### Week 3에서 비워 둔 자리 채우기

- [x] 분석 카드 상단의 `★` · `✎` · `⎘` 버튼 실제 동작 연결

## 테스트 기준 (완료 조건)

> Week 8 이전 실제 인프라·API 키 없음 → **테스트 코드만이 기능 검증 수단**

- [x] `PATCH /api/v1/conversations/:id` 단위 테스트 — `is_favorite`, `title` 필드 갱신 검증 (DB mock)
- [x] 자동 제목 생성 테스트 — `ai.nameNote` mock으로 `auto_title` 저장 확인
- [x] 목록 우선순위 테스트 — `title` > `auto_title` > "제목 없음" 분기 검증
- [x] 소프트 삭제 테스트 — DELETE 시 `deleted_at` 설정, 목록 조회에서 제외 확인
- [x] 폴더 CRUD 단위 테스트 — 생성·수정·삭제·순서 변경 (DB mock)
- [x] 대화-폴더 다대다 관계 테스트 — 하나의 대화가 여러 폴더에 추가·제거
- [x] **소유권 체크 테스트** — 다른 사용자 JWT로 폴더·대화 수정 시 403 반환 확인
- [x] 노트 홈 컴포넌트 테스트 — 탭(최근/즐겨찾기/목록) 전환, 카드 렌더링
- [x] 폴더 바텀시트 컴포넌트 테스트 — 생성·멀티 선택·체크박스 상태
- [x] `npm test` 에러 없음

성능(노트 홈 로드 < 1.5초, 폴더 100개 렉 없음) 및 사용자 행동 지표(즐겨찾기 3개+)는 Week 8에서 실측.

## 품질 기준

- [x] 소유권 체크 로직이 테스트로 보장됨
- [x] 자동 제목 생성 분기 로직이 테스트로 보장됨
- [ ] 실측 지표(노트 홈 로드 속도, 즐겨찾기·폴더 생성률)는 Week 8 항목

## 완료 판정

`npm test` 통과 — 즐겨찾기·이름 지정·폴더 CRUD·소유권 체크·다대다 관계가 mock으로 검증된 상태.
노트 홈 체감 속도 및 사용자 행동 지표 측정은 Week 8에서 확인.
