import { useNavigate } from 'react-router-dom'

const benefits = [
  {
    icon: '🎁',
    title: '정식 출시 시 50% 할인',
    description: '첫 12개월간 모든 요금제 50% 할인 적용.',
  },
  {
    icon: '🔒',
    title: 'Pro 평생 20% 할인 lock-in',
    description: 'Pro 구독 해지 전까지 영구 20% 할인 유지.',
  },
  {
    icon: '💳',
    title: '크레딧 30일치 선지급',
    description: '정식 출시 시 사용 가능한 크레딧 30일치를 미리 지급합니다.',
  },
  {
    icon: '🏅',
    title: 'Solvy Founding Member 뱃지',
    description: '베타 참여자임을 증명하는 특별 뱃지가 프로필에 표시됩니다.',
  },
  {
    icon: '📚',
    title: '노트·목록 영구 보존 보장',
    description:
      '베타 중 만든 모든 노트와 목록은 정식 출시 후에도 삭제되지 않고 완전히 보존됩니다.',
  },
]

export default function FoundingMemberPage() {
  const navigate = useNavigate()

  return (
    <main style={{ minHeight: '100dvh', padding: '32px 16px', maxWidth: '640px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={backBtn} data-testid="back-btn">
        ← 뒤로
      </button>

      <div style={{ marginTop: '24px', marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏅</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
          Solvy Founding Member
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>
          콴다의 "무료였던 게 유료가 됐다" 실수를 반복하지 않겠습니다.
          <br />
          베타 참여자분들께 아래 혜택을 약속드립니다.
        </p>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        data-testid="benefits-list"
      >
        {benefits.map((b, i) => (
          <div
            key={i}
            data-testid={`benefit-${i}`}
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '16px',
              background: 'var(--bg-elevated)',
            }}
          >
            <span style={{ fontSize: '28px', flexShrink: 0 }}>{b.icon}</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>{b.title}</h3>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.5 }}>
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: '32px',
          textAlign: 'center',
          color: 'var(--ink-3)',
          fontSize: 'var(--text-small)',
          lineHeight: 1.6,
        }}
      >
        이 약속은 베타 가입 시 이용약관에 명문화되며,
        <br />
        Solvy가 서비스를 운영하는 한 반드시 이행됩니다.
      </p>
    </main>
  )
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-2)',
  fontSize: 'var(--text-body)',
  cursor: 'pointer',
  padding: '0',
}
