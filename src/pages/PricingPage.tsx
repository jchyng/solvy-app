import { useNavigate } from 'react-router-dom'

interface Plan {
  id: 'free' | 'light' | 'pro'
  name: string
  price: string
  priceNote: string
  features: string[]
  cta: string
  highlighted: boolean
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0원',
    priceNote: '영원히 무료',
    features: ['하루 3문제', '노트 최대 20개', '풀이 분석 + 채팅', '폴더 기본 기능'],
    cta: '무료로 시작',
    highlighted: false,
  },
  {
    id: 'light',
    name: 'Light',
    price: '4,900원~',
    priceNote: '/ 월 (베타 후 확정)',
    features: ['하루 10문제', '노트 최대 200개', '풀이 분석 + 채팅', '폴더 무제한', '유사 문제 생성'],
    cta: '베타 후 구독',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,900원~',
    priceNote: '/ 월 (베타 후 확정)',
    features: [
      '문제·대화·노트 무제한',
      '폴더 무제한',
      '유사 문제 생성',
      '광고 없음',
      '우선 지원',
    ],
    cta: '베타 후 구독',
    highlighted: true,
  },
]

export default function PricingPage() {
  const navigate = useNavigate()

  return (
    <main style={{ minHeight: '100dvh', padding: '32px 16px', maxWidth: '640px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={backBtn}
        data-testid="back-btn"
      >
        ← 뒤로
      </button>

      <div style={{ marginTop: '24px', marginBottom: '8px', textAlign: 'center' }}>
        <span
          data-testid="beta-badge"
          style={{
            display: 'inline-block',
            background: 'var(--accent, #6366f1)',
            color: '#fff',
            borderRadius: '20px',
            padding: '6px 18px',
            fontSize: 'var(--text-small, 13px)',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          베타 기간 무료
        </span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink-1, #111)', margin: '0 0 8px' }}>
          요금제
        </h1>
        <p style={{ color: 'var(--ink-2, #6b7280)', fontSize: 'var(--text-body, 15px)', margin: 0 }}>
          베타 기간 동안 모든 기능이 무료입니다.
          <br />
          정식 출시 시 베타 참여자 특별 혜택이 제공됩니다.
        </p>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}
        data-testid="plan-list"
      >
        {plans.map((plan) => (
          <div
            key={plan.id}
            data-testid={`plan-${plan.id}`}
            style={{
              border: plan.highlighted
                ? '2px solid var(--accent, #6366f1)'
                : '1px solid var(--surface-2, #f3f4f6)',
              borderRadius: '16px',
              padding: '20px',
              background: plan.highlighted
                ? 'var(--surface-1, #fff)'
                : 'var(--surface-1, #fff)',
              position: 'relative',
            }}
          >
            {plan.highlighted && (
              <span
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent, #6366f1)',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '4px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                추천
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>{plan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #6366f1)' }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--ink-3, #9ca3af)' }}>
                    {plan.priceNote}
                  </span>
                </div>
              </div>
            </div>

            <ul style={{ margin: '16px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {plan.features.map((f) => (
                <li key={f} style={{ color: 'var(--ink-2, #6b7280)', fontSize: 'var(--text-body, 15px)' }}>
                  {f}
                </li>
              ))}
            </ul>

            <button
              style={{
                width: '100%',
                background: plan.highlighted ? 'var(--accent, #6366f1)' : 'transparent',
                color: plan.highlighted ? '#fff' : 'var(--accent, #6366f1)',
                border: '1px solid var(--accent, #6366f1)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: 'var(--text-body, 15px)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid={`plan-cta-${plan.id}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/founding-member')}
          data-testid="founding-member-link"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent, #6366f1)',
            fontSize: 'var(--text-body, 15px)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Founding Member 혜택 보기 →
        </button>
      </div>
    </main>
  )
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-2, #6b7280)',
  fontSize: 'var(--text-body, 15px)',
  cursor: 'pointer',
  padding: '0',
}
