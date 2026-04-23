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

- [ ] `PATCH /api/v1/conversations/:id` — `is_favorite`, `title` 수정
- [ ] **자동 제목 생성** — 사용자가 한 번도 수동 지정하지 않은 대화에 대해 `ai.nameNote` (Gemini Flash) **배치 호출**로 `auto_title` 저장
  - 주기: 분석 완료 직후 1회 + 야간 배치로 미생성분 보강
- [ ] 목록 표시 우선순위: `title` > `auto_title` > "제목 없음"
- [ ] 소프트 삭제 — `DELETE /api/v1/conversations/:id` → `deleted_at` 설정

### 목록 (폴더)

- [ ] `POST /api/v1/folders` — 생성 (`name`, `color`)
- [ ] `GET /api/v1/folders` — 내 폴더 목록 (`position` 순, 각 폴더별 대화 개수 포함)
- [ ] `PATCH /api/v1/folders/:id` — 이름 · 색상 · 순서
- [ ] `DELETE /api/v1/folders/:id` — 폴더만 삭제 (안의 대화는 보존)
- [ ] `POST /api/v1/folders/:id/conversations` — 대화를 폴더에 추가 (바디: `conversation_id`)
- [ ] `DELETE /api/v1/folders/:id/conversations/:convId` — 폴더에서 대화 제거
- [ ] 한 대화가 여러 폴더 소속 가능 (다대다)
- [ ] **소유권 체크 필수**: 폴더·대화 둘 다 `user_id == jwt.user_id`

## 프론트엔드 체크리스트

### 노트 홈 `/notes`

- [ ] 탭: **최근** / **즐겨찾기** / **목록**
- [ ] 카드 리스트 요소: 썸네일(원본 이미지), 제목, 개념 칩, 마지막 활동 시각
- [ ] 카드 탭 → 대화방 이동
- [ ] 목록 탭: 폴더 카드 그리드 (색상 · 이름 · 개수), 탭하면 `/notes/folders/:id` 진입
- [ ] 폴더 내부 뷰: 해당 폴더 대화 카드 리스트

### 편집 플로우

- [ ] 폴더 생성·편집 바텀시트 (이름 · 색상 팔레트 6~8개)
- [ ] 대화방 내 `⎘ 목록에 추가` → 폴더 멀티 선택 바텀시트 (체크박스, "+ 새 폴더" 버튼 포함)
- [ ] 대화방 내 `★` 토글 · `✎ 이름 변경` 모달
- [ ] 길게 누르기 → 다중 선택 → 일괄 즐겨찾기·목록 추가·삭제

### Week 3에서 비워 둔 자리 채우기

- [ ] 분석 카드 상단의 `★` · `✎` · `⎘` 버튼 실제 동작 연결

## 품질 기준

- [ ] 내부 테스터 10명이 베타 5일 차에 평균 **3개 이상 즐겨찾기**, **1개 이상 폴더 생성**
- [ ] 노트 홈 첫 로드 < 1.5초 (대화 20개 기준)
- [ ] 폴더 100개 · 대화 1000개 기준 목록 탐색 렉 없음 (페이지네이션 또는 가상 스크롤)

## 완료 판정

앱이 **풀이 노트**로 작동한다. 학생이 3번 이상 문제를 풀고 노트 홈을 열었을 때, "내가 푼 것들이 쌓이고 있다"는 감각을 느낀다. 즐겨찾기·목록·이름 지정 모두 **한 번의 탭/입력**으로 완료된다.
