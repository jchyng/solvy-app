# Design System — AI 빠른 참조

> **AI용 경량 인덱스.** 이 파일 하나로 대부분의 UI 작업이 가능합니다.
> 더 깊은 내용이 필요할 때만 아래 "파일 읽기 가이드"를 따라 특정 파일을 열어 보세요.

---

## 파일 읽기 가이드

| 필요한 상황 | 읽을 파일 |
|---|---|
| 색상 토큰 · 타이포 스케일 | 아래 Quick Reference (이 파일 내) |
| CSS 변수 전체 정의 | `design-system/colors_and_type.css` |
| 컴포넌트 가이드라인 · 보이스&톤 | `design-system/README.md` |
| 실제 컴포넌트 구현체 | `design-system/ui_kits/mobile_app/*.jsx` |
| 부모 대시보드 구현체 | `design-system/ui_kits/parent_dashboard/Dashboard.jsx` |
| **preview/ 폴더** | **AI 읽기 불필요** — 사람용 시각 미리보기 HTML |

---

## Quick Reference: 색상 토큰

### 라이트 모드 (기본)
```
--bg           #F5F2EC   페이지 배경 (따뜻한 베이지)
--bg-elevated  #FBF9F4   카드, 패널
--bg-sunken    #EEEAE1   인풋, 코드블록, 눌린 영역
--ink          #1A1814   주 텍스트, 헤딩
--ink-2        #3C3932   본문 텍스트
--ink-3        #6B675D   3차 텍스트, 플레이스홀더
--ink-4        #9E998E   비활성, 힌트
--line         #E2DDD0   보더, 구분선
--accent       #3D5C4B   포레스트 그린 — 주 강조색
--accent-soft  #E0E8DF   액센트 배경 틴트
--warn         #A65F2E   경고, 에러 (앰버)
```

### 다크 모드 (`prefers-color-scheme: dark`)
```
--bg           #13120F   --bg-elevated  #1C1B17   --bg-sunken    #0E0D0B
--ink          #F0ECE0   --ink-2        #D4D0C3   --ink-3        #95907F   --ink-4  #6B6757
--line         #2A2822   --accent       #8FB89F   --accent-soft  #1F2A23   --warn   #D4925E
```

---

## Quick Reference: 타이포그래피

### 폰트 패밀리
```
serif  Cormorant Garamond, italic  — "Solvy" 로고, 섹션 레이블 (i. Intent)
sans   Pretendard Variable         — 모든 한국어 본문, UI 레이블, 버튼
mono   JetBrains Mono              — 수식, 코드, 단답 표시
```

### 타입 스케일 (모바일 기준)
```
--text-brand  36px   serif italic  "Solvy" 로고
--text-h1     28px   sans 600
--text-h2     20px   sans 600      섹션 제목
--text-h3     17px   sans 500
--text-body   15px   sans 400      기본 본문 (line-height 1.65)
--text-small  13px   sans 500      보조 텍스트, 캡션
--text-xs     11px   mono 500      단답·뱃지 (letter-spacing 0.2em, uppercase)
```

---

## Quick Reference: 스페이싱 · 반경

```
기본 수평 패딩  --space-4  16px
섹션 간격       --space-6  24px

카드 반경   --radius-xl   22px  (메인 카드)
큰 카드     --radius-2xl  32px  (업로드 드롭존)
칩·필       --radius-full 9999px
아이콘 컨테이너 --radius-lg 16px
인라인 코드     --radius-sm  4px
```

---

## 컴포넌트 클래스 (`design-system/colors_and_type.css` 정의)

```
.solvy-card            배경 bg-elevated, 1px border, radius-xl
.solvy-card-sunken     배경 bg-sunken, 1px border, radius-xl
.solvy-btn-primary     검은 배경, 흰 텍스트, radius-full, 12px 24px
.solvy-btn-accent      accent 배경, 흰 텍스트, radius-full
.solvy-btn-ghost       transparent, border, radius-full, 8px 16px
.solvy-chip            bg-elevated, border, radius-full, 4px 12px
.solvy-chip-accent     accent-soft 배경, accent 텍스트
.solvy-input           bg-sunken, radius-full, 14px 20px, focus→border-ink-3
.solvy-math-block      bg-sunken, border, radius-md, mono font, 중앙 정렬
```

---

## 아이콘

**Lucide React** 사용. `lucide-react`에서 import.
- 크기: 네비게이션 `size={20}`, 인라인 `size={18}`, 히어로 `size={32}`
- 색상: `text-ink`, `text-ink-3`, `text-accent` Tailwind 클래스

자주 쓰는 아이콘: `Camera`, `Send`, `ChevronRight`, `Sparkles`, `Lightbulb`, `X`, `Loader2`, `RefreshCcw`

---

## UI 킷 파일 위치

```
design-system/ui_kits/mobile_app/
  Shared.jsx      공통 프리미티브 (TOKENS 변수, Icon 컴포넌트, MobileFrame, Header)
  UploadView.jsx  홈/업로드 화면
  LoadingView.jsx 분석 로딩 화면
  ResultView.jsx  결과 화면 (Intent → Solution → Answer → Tip)
  ChatView.jsx    소크라틱 채팅 Q&A

design-system/ui_kits/parent_dashboard/
  Dashboard.jsx   부모 대시보드 (streak, 주간 차트, 과목별 분석)
```
