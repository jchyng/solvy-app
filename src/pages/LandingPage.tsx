import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, BookOpen, Brain, ChevronRight, Award, Gift, Lock, CreditCard } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export default function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [position, setPosition] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        let msg = '등록에 실패했습니다'
        try {
          const data = await res.json() as { error?: string }
          msg = data.error ?? msg
        } catch { /* non-JSON body (서버 다운 또는 프록시 오류) */ }
        throw new Error(msg)
      }
      const data = await res.json() as { position: number }
      setPosition(data.position)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '오류가 발생했습니다')
      setStatus('error')
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* 네비게이션 */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--line)',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'var(--text-brand)', color: 'var(--accent)' }}>
          Solvy
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('/faq')} style={ghostLink}>FAQ</button>
          <button onClick={() => navigate('/terms')} style={ghostLink}>이용약관</button>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: 'var(--text-small)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            로그인
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
        {/* 히어로 */}
        <section style={{ padding: '64px 0 48px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: 'var(--text-small)',
            fontWeight: 600,
            marginBottom: '24px',
          }}>
            <Sparkles size={13} />
            베타 참여자 모집 중
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: 700,
            lineHeight: 1.25,
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}>
            답을 가르치는 앱이 아닙니다.
            <br />
            <span style={{ color: 'var(--accent)' }}>답을 설명하게 하는 앱입니다.</span>
          </h1>

          <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.7, marginBottom: '40px' }}>
            수학 문제 사진 한 장으로 — 출제 의도, 핵심 개념, 단계별 풀이법, 실전 팁까지.
            <br />
            AI가 정답 대신 <strong>이해의 경로</strong>를 만들어드립니다.
          </p>

          {/* 이메일 등록 폼 */}
          {status === 'done' ? (
            <div
              data-testid="waitlist-success"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <Award size={32} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
              <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>대기열에 등록되었습니다!</p>
              <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-small)' }}>
                현재 대기 순번: <strong style={{ color: 'var(--accent)' }}>#{position}</strong>
                <br />
                초대 코드 발급 시 입력하신 이메일로 알려드립니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소를 입력하세요"
                  required
                  data-testid="waitlist-email-input"
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !email.trim()}
                  data-testid="waitlist-submit"
                  style={primaryBtn}
                >
                  {status === 'loading' ? '등록 중...' : '참여하기'}
                </button>
              </div>
              {status === 'error' && (
                <p style={{ color: 'var(--warn)', fontSize: 'var(--text-small)', textAlign: 'center' }} data-testid="waitlist-error">
                  {errorMsg}
                </p>
              )}
              <p style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)', textAlign: 'center' }}>
                베타 참여 = Founding Member 혜택 자동 부여
              </p>
              <p style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)', textAlign: 'center', margin: 0 }}>
                이미 초대 코드가 있으신가요?{' '}
                <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  지금 가입하기
                </Link>
              </p>
            </form>
          )}
        </section>

        {/* 특징 */}
        <section style={{ padding: '32px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} style={featureCard}>
                <f.Icon size={22} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 'var(--text-h3)', fontWeight: 600 }}>{f.title}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Founding Member 혜택 */}
        <section style={{ padding: '32px 0' }}>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
            Founding Member 혜택
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {benefits.map((b, i) => (
              <div key={i} style={benefitRow}>
                <b.Icon size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-body)', color: 'var(--ink-2)' }}>{b.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/founding-member')}
              style={{ ...ghostLink, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              혜택 전체 보기 <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* 하단 */}
        <footer style={{
          borderTop: '1px solid var(--line)',
          padding: '32px 0',
          textAlign: 'center',
          color: 'var(--ink-3)',
          fontSize: 'var(--text-small)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'var(--accent)' }}>Solvy</span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/terms')} style={footerLink}>이용약관</button>
            <button onClick={() => navigate('/privacy')} style={footerLink}>개인정보처리방침</button>
            <button onClick={() => navigate('/faq')} style={footerLink}>FAQ</button>
          </div>
          <p style={{ margin: 0 }}>© 2026 Solvy. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

const features = [
  {
    Icon: Brain,
    title: '출제 의도 분석',
    desc: '이 문제가 왜 나왔는지, 무엇을 확인하려는지부터 파악합니다.',
  },
  {
    Icon: BookOpen,
    title: '단계별 풀이법',
    desc: '정답이 아닌 풀이의 흐름을 설명합니다. 다음에 스스로 풀 수 있도록.',
  },
  {
    Icon: Sparkles,
    title: '멀티턴 대화',
    desc: '"왜?" 라고 물으면 AI가 단계를 쪼개 설명합니다. 꼬리 질문으로 이해를 깊게 만드는 대화.',
  },
]

const benefits = [
  { Icon: Gift,       text: '정식 출시 시 50% 할인 (첫 12개월)' },
  { Icon: Lock,       text: 'Pro 평생 20% 할인 lock-in' },
  { Icon: CreditCard, text: '크레딧 30일치 선지급' },
  { Icon: Award,      text: 'Founding Member 뱃지 영구 부여' },
]

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid var(--line)',
  borderRadius: '9999px',
  padding: '12px 20px',
  fontSize: 'var(--text-body)',
  background: 'var(--bg-sunken)',
  color: 'var(--ink)',
  outline: 'none',
  minWidth: 0,
}

const primaryBtn: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '9999px',
  padding: '12px 24px',
  fontSize: 'var(--text-body)',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const featureCard: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--line)',
  borderRadius: '16px',
  padding: '16px',
}

const benefitRow: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--line)',
  borderRadius: '12px',
}

const ghostLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-2)',
  fontSize: 'var(--text-small)',
  cursor: 'pointer',
  padding: 0,
}

const footerLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-3)',
  fontSize: 'var(--text-small)',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}
