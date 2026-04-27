# Solvy 프로젝트 문서

> **이 문서의 역할**: 작업 단계별로 어떤 문서를 읽어야 하는지 알려주는 **인덱스**입니다. 여기서 본인이 지금 할 일을 찾고, 해당 문서만 읽으세요. 전체 문서를 통독할 필요는 없습니다.
>
> **작성일 기준**: 2026년 4월 22일

---

## 🎯 빠른 시작

프로젝트에 처음 합류한 경우 이 순서로 읽으세요:

1. `context/00-vision.md` — 제품 정체성 · 타깃 · 차별화 (10분)
2. `context/01-principles.md` — 제품 원칙 · 금기 사항 (5분)
3. `sprints/week-0-setup.md` — 지금 해야 할 일

그 다음부터는 현재 주차의 스프린트 문서만 보면 됩니다.

---

## 📂 문서 구조

```
docs/
├── README.md                      (이 파일)
├── context/                       (전 단계 공통 참조)
│   ├── 00-vision.md               제품 정체성 · 타깃 · 차별화
│   ├── 01-principles.md           제품 원칙 · 금기 사항
│   ├── 02-business-model.md       베타 운영 · 구독 · 혜택 약속
│   └── 03-risks.md                기술·비즈니스 위험 관리
├── architecture/                  (기술 설계. 여러 주차가 참조)
│   ├── tech-stack.md              프론트·백엔드 스택
│   ├── ai-providers.md            프로바이더 전략 · 역할 매핑 · 프롬프트
│   ├── data-model.md              PostgreSQL 스키마 · 이벤트 규약
│   └── prototype-migration.md     기존 코드 유지/폐기 가이드
├── design-system/                 디자인 시스템 (INDEX.md → AI 빠른 참조)
├── week-8-raspi-dev.md            Week 8 Phase 1 — 라즈베리파이 개발 서버 검증
├── week-8-infra-checklist.md      Week 8 Phase 2 — 클라우드 배포 (Phase 1 통과 후)
└── sprints/                       (주차별 작업 지시)
    ├── week-0-setup.md
    ├── week-1-backend-skeleton.md
    ├── week-2-ai-abstraction.md
    ├── week-3-problem-analysis.md
    ├── week-4-multiturn-chat.md
    ├── week-5-notes.md
    ├── week-6-similar-and-payment.md
    ├── week-7-hardening.md
    └── week-8-launch.md
```

---

## 🗺️ 단계별 읽을 문서 매핑

각 스프린트 파일 상단에도 **필독 문서 목록**이 있지만, 여기서도 한눈에 볼 수 있게 정리합니다.

| 주차 | 단계 파일 | 필독 참조 문서 |
|---|---|---|
| Week 0 | `sprints/week-0-setup.md` | `context/00-vision.md` · `architecture/tech-stack.md` · `architecture/ai-providers.md` (계정 목록만) |
| Week 1 | `sprints/week-1-backend-skeleton.md` | `architecture/tech-stack.md` · `architecture/data-model.md` · `architecture/prototype-migration.md` |
| Week 2 | `sprints/week-2-ai-abstraction.md` | `architecture/ai-providers.md` (전체) · `architecture/data-model.md` §usage_events |
| Week 3 | `sprints/week-3-problem-analysis.md` | `context/00-vision.md` §3 · `architecture/ai-providers.md` §`analyze` · `architecture/data-model.md` §problem_sessions · conversations · messages · `design-system/INDEX.md` |
| Week 4 | `sprints/week-4-multiturn-chat.md` | `architecture/ai-providers.md` §`chat` · `architecture/data-model.md` §messages · `design-system/INDEX.md` |
| Week 5 | `sprints/week-5-notes.md` | `context/00-vision.md` §3.3 · `architecture/data-model.md` §note_folders · conversation_folders · `design-system/INDEX.md` |
| Week 6 | `sprints/week-6-similar-and-payment.md` | `architecture/ai-providers.md` §`generateSimilar` · `context/02-business-model.md` §구독 플랜 |
| Week 7 | `sprints/week-7-hardening.md` | `context/03-risks.md` · `architecture/data-model.md` (권한 체크) |
| Week 8 Phase 1 | `sprints/week-8-launch.md` + `week-8-raspi-dev.md` | `context/02-business-model.md` §베타 혜택 약속 · `context/01-principles.md` |
| Week 8 Phase 2 | `week-8-infra-checklist.md` | Phase 1 검증 완료 후 진행 |

---

## 🧭 상황별 "어디를 봐야 하나?"

막막할 때 이 표로 찾으세요.

| 상황 | 문서 |
|---|---|
| "제품이 뭔지부터 모르겠다" | `context/00-vision.md` |
| "하면 안 되는 건 뭐지?" | `context/01-principles.md` |
| "이 기능을 넣어도 될까?" | `context/01-principles.md` §절대 하지 말 것 |
| "어떤 라이브러리를 써야 하지?" | `architecture/tech-stack.md` |
| "어떤 AI 모델 호출하지?" | `architecture/ai-providers.md` §역할 매핑표 |
| "DB 스키마가 뭐였지?" | `architecture/data-model.md` |
| "이벤트 이름 규칙?" | `architecture/data-model.md` §이벤트 규약 |
| "기존 프로토타입에서 뭘 가져와?" | `architecture/prototype-migration.md` |
| "색상·폰트·컴포넌트 스타일?" | `design-system/INDEX.md` (빠른 참조) · `design-system/README.md` (전체) |
| "가격·플랜은 어떻게?" | `context/02-business-model.md` |
| "장애 대응 · 폴백?" | `context/03-risks.md` · `architecture/ai-providers.md` §폴백 |

---

## ✅ 각 스프린트 문서 공통 구조

모든 `sprints/week-N-*.md`는 동일한 형식을 따릅니다:

```
# Week N — 제목

## 📖 이번 주 필독
- (최소한으로 읽어야 할 문서 목록)

## 📕 이번 주 건드리지 말 것
- (다른 주차 범위)

## 🎯 이번 주 목표
- (한 문장 목표)

## 체크리스트
- [ ] ...

## 품질 기준
- (완료 판정 기준)
```

**건드리지 말 것** 섹션을 반드시 확인하세요. 이번 주 범위를 벗어난 기능을 선제적으로 구현하는 것은 이 프로젝트에서 **안티 패턴**입니다.

---

## 📝 문서 관리 원칙

1. **결정이 바뀌면 해당 문서를 바로 업데이트** — "나중에 반영"하지 않음
2. **스프린트 문서 내용이 아키텍처 문서와 충돌하면 아키텍처 문서가 단일 진실**
3. **이 README의 매핑 표는 파일 이름이 바뀌면 즉시 갱신**
4. **새 문서를 추가하면 여기 인덱스와 매핑 표 둘 다 업데이트**

---

**이 README는 10분 안에 훑을 수 있는 진입점입니다. 본론은 하위 문서에 있습니다.**
