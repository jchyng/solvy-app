# Week 0 — 사전 준비 (베타 시작 1주 전)

## 📖 이번 주 필독
- `context/00-vision.md` §5 프로젝트 상태
- `architecture/tech-stack.md` §환경변수 목록
- `architecture/ai-providers.md` §4개 프로바이더 (계정 목록 확인만)

## 📕 이번 주 건드리지 말 것
- 코드 작성 금지 (Week 1부터)
- 데이터 모델 설계 결정 재검토 (이미 확정)

## 🎯 이번 주 목표
**계정·인프라·CI/CD가 전부 세팅되어 Week 1 첫 커밋부터 막힘없이 시작할 수 있는 상태**

---

## 계정 체크리스트

| 항목 | 작업 | 소요 | 비고 |
|---|---|---|---|
| Anthropic | API 키 발급, Tier 2 신청 | 반나절 | 결제 정보 필수, Tier 승급은 사용량 누적 필요 |
| Google Cloud | Vertex AI 프로젝트 생성, Gemini API 활성화 | 반나절 | **asia-northeast3 (서울) 리전 선택** |
| Mathpix | 상업용 요금제 가입, API 키 발급 | 반나절 | Phase 1.5 활용이지만 계정만 미리 확보 |
| OpenRouter | 계정 생성, 크레딧 $50 충전 | 30분 | |
| Supabase | 프로젝트 생성 | 반나절 | DB 마이그레이션은 Week 1에 실행 |
| Cloudflare | 계정, R2 버킷, Workers 프로젝트 | 반나절 | |
| PostHog | 프로젝트 생성, 클라이언트 SDK 키 | 1시간 | |
| Sentry | 프로젝트 생성, DSN 발급 | 30분 | |
| GitHub | 리포지토리, Actions 워크플로우, 환경 시크릿 | 반나절 | |
| 도메인 | solvy.kr 또는 유사 도메인 구매, DNS 설정 | 1시간 | |
| 이메일 | Resend/Postmark 계정, 도메인 인증 | 반나절 | 베타 초대장 발송용 |

---

## 산출물

- [ ] `.env.example` 파일 — `architecture/tech-stack.md` §환경변수 목록 그대로
- [ ] GitHub 리포 생성 + Actions 기본 워크플로우
- [ ] 모든 시크릿이 Cloudflare Secrets / GitHub Actions Secrets에 등록됨
- [ ] `README.md`에 각 환경변수 용도 간단 설명
- [ ] 각 계정의 관리자·결제 연락처 팀 위키에 공유

## 완료 판정

Week 1 첫 작업자가 `git clone` 후 `.env`만 채우면 `npm run dev`가 뜨도록 **시크릿과 인프라가 준비되어 있다**.
