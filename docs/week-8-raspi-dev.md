# Week 8 (Phase 1) — 라즈베리파이 개발 서버 세팅

> **목적**: 클라우드 계정·비용 없이 실제 인프라와 동등한 환경에서 모든 기능을 검증한다.
> 이 단계를 통과한 뒤 `week-8-infra-checklist.md`(Phase 2)로 넘어간다.

---

## 전략 요약

| 항목 | Phase 1 (라즈베리파이) | Phase 2 (클라우드) |
|---|---|---|
| 백엔드 런타임 | `wrangler dev` (로컬 시뮬레이션) | Cloudflare Workers |
| DB | Supabase 프리 티어 | Supabase 프리 티어 (동일) |
| 파일 저장 | 로컬 디스크 (R2 mock) | Cloudflare R2 |
| Rate Limit KV | wrangler dev 로컬 KV | Cloudflare KV |
| 도메인 | Pi IP 직접 접근 또는 ngrok | solvy.kr |
| AI 키 | Anthropic 1개 (최소) | 전체 프로바이더 |
| 관측성 | 콘솔 로그 | Sentry · PostHog |
| CI/CD | 없음 | GitHub Actions |

---

## 1. 라즈베리파이 환경 준비

```bash
# Node.js 20 LTS 설치 (nvm 권장)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20
nvm use 20

# 프로젝트 클론
git clone https://github.com/<your-repo>/solvy-app.git
cd solvy-app

# 의존성 설치
npm install
cd server && npm install && cd ..
```

---

## 2. Supabase 설정 (DB만 — 필수 최소)

클라우드 계정이지만 **프리 티어 무료, 5분이면 끝**.

- [ ] [supabase.com](https://supabase.com) 계정 생성 → 프로젝트 생성 (리전: `ap-northeast-2 Seoul`)
- [ ] SQL 에디터에서 마이그레이션 실행:
  ```
  supabase/migrations/001_initial_schema.sql
  supabase/migrations/002_subscriptions.sql
  supabase/migrations/003_waitlist.sql
  ```
- [ ] 환경변수 확보 (Settings → API):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY` (Service Role Key)
  - `JWT_SECRET` (Settings → API → JWT Secret)

---

## 3. AI API 키 (최소 1개)

핵심 기능(분석·채팅) 검증을 위해 **Anthropic 키 하나만 있으면 충분**.
Gemini·OpenRouter·Mathpix는 Phase 2에서 추가.

- [ ] [console.anthropic.com](https://console.anthropic.com) → API 키 발급 (결제 정보 등록 필요, $5 크레딧으로 충분)

---

## 4. wrangler dev 로컬 실행

### 4-1. KV namespace ID 임시 처리

`wrangler dev`는 로컬 KV를 자동 생성하므로 실제 ID 불필요.
`server/wrangler.toml`의 placeholder 값을 임의 값으로 채운다:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "local-dev-placeholder"
preview_id = "local-dev-placeholder"
```

### 4-2. 로컬 환경변수 파일 작성

`server/.dev.vars` 파일 생성 (wrangler dev가 자동으로 읽음, 절대 커밋 금지):

```
SUPABASE_URL=<위에서 확보한 값>
SUPABASE_SERVICE_KEY=<위에서 확보한 값>
JWT_SECRET=<위에서 확보한 값>
ANTHROPIC_API_KEY=<위에서 확보한 값>
IMAGES_PUBLIC_URL=http://localhost:8787
ENVIRONMENT=development
```

### 4-3. R2 로컬 대체

Phase 1에서는 파일 업로드를 로컬 디스크로 저장.
`server/src/lib/r2.ts`의 업로드 함수는 `ENVIRONMENT=development`일 때 로컬 `/tmp/solvy-uploads/`를 사용하도록 분기가 필요함.

→ **이 분기 구현이 Phase 1에서 유일한 코드 작업**. `week-8-infra-checklist.md`로 넘어가기 전에 처리.

### 4-4. 백엔드 실행

```bash
cd server
npm run dev
# → http://localhost:8787
```

헬스 체크:
```bash
curl http://localhost:8787/health
# → {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

## 5. 프론트엔드 실행

```bash
# 루트 디렉토리에서
echo "VITE_API_URL=http://localhost:8787/api/v1" > .env.local
npm run dev
# → http://localhost:5173 (또는 Pi IP:5173)
```

외부에서 접근하려면 ngrok 사용:
```bash
ngrok http 5173
```

---

## 6. 검증 체크리스트 (Phase 1 완료 판정)

### 인증 플로우
- [ ] Supabase에 초대 코드 1개 수동 생성 (`invite_codes` 테이블)
- [ ] `/signup` → 초대 코드 입력 → JWT 발급 확인
- [ ] `/app` 접근 → 인증된 사용자 진입 확인

### 핵심 기능 (실제 AI 호출)
- [ ] 수학 문제 사진 업로드 → OCR 텍스트 추출 확인
- [ ] 분석 카드 렌더링 (intent · steps · hints · tip)
- [ ] 채팅 후속 질문 → AI 응답 확인
- [ ] 노트 즐겨찾기 → 폴더 저장 확인

### 화면 전체
- [ ] 랜딩 `/` → 대기열 등록 → Supabase `waitlist` 테이블 확인
- [ ] `/pricing` · `/founding-member` · `/terms` · `/faq` 렌더링 확인

### 에러 처리
- [ ] 네트워크 끊긴 상태에서 업로드 시도 → 에러 UI 표시 확인
- [ ] 잘못된 초대 코드 입력 → 에러 메시지 확인

---

## 7. Phase 2 전환 조건

아래 항목이 모두 초록이면 `week-8-infra-checklist.md`(클라우드 배포)로 이동:

- [ ] 헬스 체크 `200 OK`
- [ ] 초대 코드 → 가입 → 문제 업로드 → 채팅 → 노트 저장 전 플로우 통과
- [ ] 24시간 무중단 운영 (Pi 재시작 없음)
- [ ] AI 응답 품질 주관적으로 만족 (분석 결과가 실제로 도움이 됨)

---

## 참고: 알려진 제약

| 항목 | Phase 1 제약 | Phase 2 해결 |
|---|---|---|
| OCR (손글씨) | Mathpix 키 없어 비활성 | Mathpix 계정 발급 후 활성화 |
| 이미지 영구 저장 | 서버 재시작 시 `/tmp` 초기화 | Cloudflare R2로 교체 |
| 이메일 발송 | 미작동 (Resend 키 없음) | Resend 계정 발급 후 연결 |
| 외부 접근 | ngrok 세션 끊기면 URL 변경 | 고정 도메인 |
| 비용 알림 | Slack webhook 없어 미작동 | Phase 2에서 설정 |
