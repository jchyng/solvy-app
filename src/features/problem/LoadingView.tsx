import type { UploadPhase } from '@/stores/problemStore'

interface Props {
  phase: UploadPhase
  errorMessage?: string | null
}

const STEPS = [
  { key: 'uploading', label: '이미지 저장 중...' },
  { key: 'ocr', label: '문제 인식 중...' },
  { key: 'polling', label: '분석 중...' },
]

export function LoadingView({ phase, errorMessage }: Props) {
  if (phase === 'error') {
    return (
      <main className="flex flex-col items-center justify-center min-h-dvh p-6 gap-4">
        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--error, #e53e3e)', fontSize: 'var(--text-body)', marginBottom: '8px' }}>
            오류가 발생했습니다
          </p>
          {errorMessage && (
            <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-small)' }}>{errorMessage}</p>
          )}
        </div>
      </main>
    )
  }

  const currentStep = phase === 'uploading' ? 0 : 2

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh p-6 gap-8">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-brand)', color: 'var(--accent)' }}>
        Solvy
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '360px' }}>
        {STEPS.map((step, i) => {
          const active = i === currentStep
          const done = i < currentStep
          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: done || active ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: done ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {done ? '✓' : active ? '…' : ''}
              </div>
              <span
                style={{
                  color: active ? 'var(--ink-1)' : 'var(--ink-2)',
                  fontSize: 'var(--text-body)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
