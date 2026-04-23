# Week 8 — Launch: 인프라 세팅 + 베타 런칭

## 📖 이번 주 필독
- `context/00-vision.md` §1 한 줄 정의, §3 핵심 차별화 (랜딩 메시지 원본)
- `context/01-principles.md` (런칭 메시지가 원칙과 충돌하지 않는지 최종 검증)
- `context/02-business-model.md` §베타 참여자 혜택
- `design-system.md` §랜딩 페이지, §온보딩

## 📕 이번 주 건드리지 말 것
- 신규 기능 추가 (Week 7·8 연속 금지)
- 제품 축 재검토 (이미 확정)
- 결제 활성화 (베타 후)

## 🎯 이번 주 목표
**인프라·계정·배포를 한 번에 세팅하고 실제 사용자에게 제품을 연다.**
첫 사용자가 랜딩 → 가입 → 첫 문제 업로드까지 막힘없이 도달하고,
초기 버그·피드백에 즉시 대응할 수 있는 운영 체계가 작동한다.

---

## 1. 인프라 세팅 체크리스트 (코드 배포 전 선행)

### 계정 · API 키 발급

| 항목 | 작업 | 소요 | 비고 |
|---|---|---|---|
| Anthropic | API 키 발급, Tier 2 신청 | 반나절 | 결제 정보 필수, Tier 승급은 사용량 누적 필요 |
| Google Cloud | Vertex AI 프로젝트 생성, Gemini API 활성화 | 반나절 | **asia-northeast3 (서울) 리전 선택** |
| Mathpix | 상업용 요금제 가입, API 키 발급 | 반나절 | Phase 1.5 활용이지만 계정만 미리 확보 |
| OpenRouter | 계정 생성, 크레딧 $50 충전 | 30분 | |
| PostHog | 프로젝트 생성, 클라이언트 SDK 키 | 1시간 | |
| Sentry | 프로젝트 생성, DSN 발급 | 30분 | |
| Resend | 계정 생성, 도메인 인증 | 반나절 | 베타 초대장 발송용 |

### Supabase

- [ ] Supabase 프로젝트 생성 (리전: ap-northeast-2 서울)
- [ ] `supabase/migrations/001_initial_schema.sql` 실행
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` 확보
- [ ] Auth 설정 (이메일 확인, JWT secret)

### Cloudflare

- [ ] Cloudflare 계정 준비
- [ ] R2 버킷 생성 (`solvy-uploads`)
- [ ] KV 네임스페이스 생성 → `server/wrangler.toml`의 `id`, `preview_id` 채우기
- [ ] Workers 프로젝트 생성

### 시크릿 · 환경변수 등록

- [ ] `.env` 파일 작성 (`.env.example` 기준으로 실제 값 채우기)
- [ ] `wrangler secret put`으로 Workers 시크릿 등록:
  ```
  wrangler secret put SUPABASE_URL
  wrangler secret put SUPABASE_SERVICE_KEY
  wrangler secret put JWT_SECRET
  wrangler secret put SENTRY_DSN
  ```
- [ ] GitHub Actions Secrets 등록 (CI/CD용)
- [ ] Cloudflare Secrets에 AI 프로바이더 키 등록

### 도메인 · DNS

- [ ] `solvy.kr` 또는 유사 도메인 구매
- [ ] DNS를 Cloudflare로 이전
- [ ] Workers 커스텀 도메인 연결

### 배포

- [ ] `cd server && npm run deploy` — Cloudflare Workers 첫 배포
- [ ] `curl https://solvy.kr/health` → `200 OK` 확인
- [ ] 프론트엔드 빌드 + CDN 배포 (Cloudflare Pages 또는 Vercel)
- [ ] CI/CD Preview 배포 자동화 연결 (GitHub Actions → Cloudflare)
- [ ] CORS_ORIGINS을 실제 도메인으로 업데이트

---

## 2. 런칭 전 체크리스트

### 랜딩 · 온보딩
- [ ] 랜딩 페이지 — **"풀이 노트"** 메시지 전면
  - 한 줄 정의, 스크린샷, Founding Member 혜택, CTA ("베타 대기열 참여")
- [ ] 베타 초대 시스템 — 대기열 + 초대 코드
- [ ] 온보딩 플로우 — 첫 문제 업로드까지 **3단계 이내**

### 법무 · 개인정보
- [ ] 이용약관 · 개인정보처리방침 (법무 검토 필수)
  - **노트 데이터 영구 보존 약속** 명시
  - **노트 데이터 학습 사용 금지** 명시
- [ ] **만 14세 미만 보호자 동의 절차** (한국 개인정보보호법)
- [ ] 쿠키 · 트래킹 동의 배너 (PostHog)

### 혜택 · 뱃지
- [ ] 베타 참여자 Founding Member 뱃지 발급 로직
- [ ] 베타 참여자 전용 메시지

### 지원 채널
- [ ] 실시간 지원 채널 (디스코드 또는 카카오 오픈채팅)
- [ ] 앱 내 "문의하기" → 지원 채널 링크
- [ ] FAQ 페이지 (최소 10개)

---

## 3. 런칭 전략 (Day 1~7)

| 일정 | 범위 | 목적 |
|---|---|---|
| Day 1~2 | 내부 50명 (지인 · 직접 접촉) | 최종 버그 확인, 런칭 메시지 검증 |
| Day 3~5 | 대기열 상위 500명 초대 | 부하 · 비용 실측, 피드백 밀도 확보 |
| Day 6~7 | 학생 커뮤니티 · 수험 블로그 시딩, 남은 대기열 순차 초대 | 자연 유입 테스트 |

---

## 4. 런칭 직후 운영

- [ ] **첫 24시간**: 실시간 대시보드 주시 (Sentry · PostHog · 비용 알림)
- [ ] **첫 주 매일 Stand-up**: 버그 우선순위 조정, Hot-fix 즉시 배포
- [ ] 신규 사용자별 Day-0 퍼널 체크 (가입 → 첫 업로드 → 첫 노트화)
- [ ] "답이 틀렸어요" 신고 24시간 내 1차 대응
- [ ] Week 8 종료 시 중간 회고 + 베타 기간(Week 9~16) 운영 계획 수립

## 완료 판정

- `curl https://solvy.kr/health` → `200 OK`
- 첫 500명이 **평균 1.5분 내** 랜딩 → 첫 문제 업로드 도달
- 24시간 내 Critical 버그 0건 또는 1건 이내 Hot-fix 완료
- Founding Member 뱃지·혜택이 베타 참여자 계정에 정확히 귀속됨
- 지원 채널에서 질문이 올라오고 평균 1시간 이내 답변
