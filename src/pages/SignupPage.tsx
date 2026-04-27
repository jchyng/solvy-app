import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { api } from '@/services/api'

export default function SignupPage() {
  const navigate = useNavigate()
  const { setUser, setToken } = useUserStore()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.auth.redeemInvite({ code: code.trim(), email: email.trim(), name: name.trim() || undefined })
      if (!res.ok) {
        const data = await res.json<{ message?: string }>()
        setError(data.message ?? '가입에 실패했습니다. 다시 시도해주세요.')
        return
      }
      const data = await res.json<{ token: string; user: { id: string; email: string; name: string; tier: 'free' | 'light' | 'pro'; is_beta_tester: boolean } }>()
      setToken(data.token)
      setUser(data.user)
      navigate('/app', { replace: true })
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-brand)', color: 'var(--accent)', textAlign: 'center', margin: '0 0 8px' }}>
          Solvy
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 'var(--text-body)', margin: '0 0 32px' }}>
          베타 가입
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>이메일</span>
            <input
              type="email"
              data-testid="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>초대 코드</span>
            <input
              type="text"
              data-testid="signup-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="BETA-XXXX"
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>이름 <span style={{ color: 'var(--ink-3)' }}>(선택)</span></span>
            <input
              type="text"
              data-testid="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              style={inputStyle}
            />
          </label>

          {error && (
            <p data-testid="signup-error" style={{ color: 'var(--error, #e53e3e)', fontSize: 'var(--text-body)', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            data-testid="signup-submit"
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: 'var(--interactive-primary-text)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: 'var(--text-body)',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {loading ? '가입 중…' : '베타 시작하기'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 'var(--text-small)', marginTop: '24px' }}>
          초대 코드가 없으신가요?{' '}
          <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            대기열 등록
          </Link>
        </p>
      </div>
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const labelTextStyle: React.CSSProperties = {
  fontSize: 'var(--text-body)',
  fontWeight: 600,
  color: 'var(--ink)',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--line)',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: 'var(--text-body)',
  color: 'var(--ink)',
  width: '100%',
  boxSizing: 'border-box',
}
