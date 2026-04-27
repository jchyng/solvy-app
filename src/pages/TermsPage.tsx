import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Section {
  title: string
  body: string[]
}

const termsSections: Section[] = [
  {
    title: '제1조 (목적)',
    body: [
      '이 약관은 Solvy(이하 "회사")가 제공하는 수학 AI 학습 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
    ],
  },
  {
    title: '제2조 (정의)',
    body: [
      '"서비스"란 회사가 제공하는 수학 문제 분석·풀이 설명·학습 지원 AI 서비스를 의미합니다.',
      '"이용자"란 이 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.',
      '"콘텐츠"란 이용자가 서비스를 통해 생성·저장한 노트, 풀이 기록, 대화 내역 등 일체를 의미합니다.',
    ],
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body: [
      '이 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.',
      '회사는 관련 법령에 위반되지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 7일 전부터 공지합니다. 중요 변경사항은 30일 전에 공지합니다.',
    ],
  },
  {
    title: '제4조 (이용자의 콘텐츠 보호)',
    body: [
      '회사는 이용자가 서비스를 통해 생성한 모든 노트·풀이 기록을 영구 보존할 것을 약속합니다.',
      '회사는 이용자의 콘텐츠를 AI 학습, 제3자 제공, 광고 목적으로 절대 사용하지 않습니다.',
      '서비스 종료 시 이용자에게 30일 이상의 충분한 데이터 내보내기 기간을 제공합니다.',
    ],
  },
  {
    title: '제5조 (금지 행위)',
    body: [
      '이용자는 서비스를 이용하여 타인의 저작권·초상권 등 지적재산권을 침해하는 행위를 할 수 없습니다.',
      '자동화 도구(봇, 크롤러 등)를 이용한 대량 요청, 서비스 안정성을 저해하는 행위를 금지합니다.',
      '허위 정보 제공, 타인의 계정 도용, 악용 목적의 이용을 금지합니다.',
    ],
  },
  {
    title: '제6조 (서비스 이용 제한)',
    body: [
      '회사는 이용자가 금지 행위를 한 경우 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.',
      '이용 제한 시 이용자에게 사유 및 이의신청 방법을 통보합니다.',
    ],
  },
  {
    title: '제7조 (회사의 의무)',
    body: [
      '회사는 서비스의 안정적 운영을 위해 최선을 다합니다.',
      '이용자의 개인정보를 개인정보처리방침에 따라 안전하게 보호합니다.',
      '서비스 장애 발생 시 신속히 복구하며, 이용자에게 공지합니다.',
    ],
  },
  {
    title: '제8조 (면책)',
    body: [
      'AI가 제공하는 풀이 설명은 학습 보조 목적이며, 정확성을 보장하지 않습니다. 중요한 학습 판단은 교사·전문가와 상담하시기 바랍니다.',
      '회사는 이용자 간, 이용자와 제3자 간의 분쟁에 개입하지 않으며 이로 인한 손해를 배상하지 않습니다.',
    ],
  },
  {
    title: '제9조 (준거법 및 재판 관할)',
    body: [
      '이 약관은 대한민국 법률에 따라 해석됩니다.',
      '서비스 이용과 관련한 분쟁은 서울중앙지방법원을 제1심 관할 법원으로 합니다.',
    ],
  },
]

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)', padding: '0 0 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={backBtn} data-testid="back-btn">
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: 'var(--text-h2)', fontWeight: 700 }}>서비스 이용약관</h1>
        </div>

        <section style={{ paddingTop: '32px' }}>
          <p style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)', marginBottom: '24px' }}>시행일: 2026년 5월 1일</p>
          {termsSections.map((s, i) => (
            <div key={i} style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>{s.title}</h3>
              {s.body.map((line, j) => (
                <p key={j} style={{ margin: '0 0 6px', color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.7 }}>
                  {s.body.length > 1 ? `${j + 1}. ${line}` : line}
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
