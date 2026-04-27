import { useState, useEffect } from 'react'
import posthog from 'posthog-js'

const STORAGE_KEY = 'solvy_tracking_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  if (!visible) return null

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    try { posthog.opt_in_capturing() } catch { /* posthog 미초기화 환경 */ }
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  return (
    <div
      data-testid="cookie-banner"
      role="dialog"
      aria-label="쿠키 및 트래킹 동의"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--line)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1000,
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      <p style={{ margin: 0, fontSize: 'var(--text-small)', color: 'var(--ink-2)', lineHeight: 1.6 }}>
        Solvy는 서비스 품질 개선을 위해 익명 사용 통계를 수집합니다.
        수집된 데이터는 광고·AI 학습에 사용되지 않습니다.{' '}
        <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          개인정보처리방침
        </a>
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={decline}
          data-testid="cookie-decline"
          style={{
            background: 'none',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: 'var(--text-small)',
            color: 'var(--ink-2)',
            cursor: 'pointer',
          }}
        >
          거부
        </button>
        <button
          onClick={accept}
          data-testid="cookie-accept"
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: 'var(--text-small)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          동의
        </button>
      </div>
    </div>
  )
}

export function getTrackingConsent(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'accepted'
}
