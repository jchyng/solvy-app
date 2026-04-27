import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Section {
  title: string
  body: string[]
}

const privacySections: Section[] = [
  {
    title: '1. 수집하는 개인정보',
    body: [
      '이메일 주소 (회원가입·대기열 등록 시)',
      '업로드한 수학 문제 이미지 (분석 후 저장, 삭제 요청 가능)',
      '서비스 이용 기록 (분석 횟수, 접속 일시, 기기 정보)',
    ],
  },
  {
    title: '2. 수집 목적',
    body: [
      '서비스 제공 및 계정 관리',
      '서비스 품질 개선 및 오류 분석',
      '베타 초대 및 운영 공지',
    ],
  },
  {
    title: '3. 보유 및 이용 기간',
    body: [
      '회원탈퇴 시까지 보유합니다.',
      '탈퇴 후 30일 이내 파기합니다 (관련 법령에서 보존 의무를 부과하는 경우 해당 기간까지 보유).',
    ],
  },
  {
    title: '4. 제3자 제공',
    body: [
      '이용자의 개인정보를 제3자에게 제공하지 않습니다.',
      '단, 법령에 따른 수사기관 요청의 경우 예외적으로 제공될 수 있습니다.',
    ],
  },
  {
    title: '5. AI 학습 사용 금지',
    body: [
      '이용자의 노트, 풀이 기록, 대화 내역은 AI 모델 학습에 절대 사용하지 않습니다.',
      '이는 이용약관 제4조에서도 명문화한 약속입니다.',
    ],
  },
  {
    title: '6. 만 14세 미만 보호자 동의',
    body: [
      '만 14세 미만 이용자는 보호자(법정대리인)의 동의가 필요합니다.',
      '보호자 동의 없이 수집된 만 14세 미만의 개인정보는 즉시 파기합니다.',
    ],
  },
  {
    title: '7. 이용자의 권리',
    body: [
      '이용자는 언제든지 자신의 개인정보를 조회·수정·삭제를 요청할 수 있습니다.',
      '서비스 탈퇴 시 모든 개인정보는 30일 이내에 파기됩니다.',
      '데이터 삭제 또는 내보내기 요청: solvy.contact@gmail.com',
    ],
  },
  {
    title: '8. 개인정보 보호책임자',
    body: [
      '개인정보 관련 문의·삭제 요청: solvy.contact@gmail.com',
    ],
  },
]

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)', padding: '0 0 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={backBtn} data-testid="back-btn">
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: 'var(--text-h2)', fontWeight: 700 }}>개인정보처리방침</h1>
        </div>

        <section style={{ paddingTop: '32px' }}>
          <p style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)', marginBottom: '24px' }}>시행일: 2026년 5월 1일</p>
          {privacySections.map((s, i) => (
            <div key={i} style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>{s.title}</h3>
              {s.body.map((line, j) => (
                <p key={j} style={{ margin: '0 0 6px', color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.7 }}>
                  • {line}
                </p>
              ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-2)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
}
