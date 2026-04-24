import { useState } from 'react'
import { useProblemStore } from '@/stores/problemStore'

export function ConfirmView() {
  const { recognizedText, confirm, phase } = useProblemStore()
  const [text, setText] = useState(recognizedText ?? '')

  const isSubmitting = phase === 'uploading' || phase === 'polling'

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh p-6 gap-6">
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--ink)', fontSize: 'var(--text-h2)', marginBottom: '8px' }}>
            문제 텍스트 확인
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-small)' }}>
            수식이 이상한가요? 직접 수정하고 분석을 시작하세요.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          style={{
            width: '100%',
            borderRadius: '12px',
            border: '1px solid var(--ink-3)',
            padding: '16px',
            fontSize: 'var(--text-body)',
            color: 'var(--ink)',
            background: 'var(--bg-sunken)',
            resize: 'vertical',
            fontFamily: 'var(--font-mono, monospace)',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={() => confirm(text)}
          disabled={isSubmitting || !text.trim()}
          style={{
            background: 'var(--accent)',
            color: 'var(--interactive-primary-text)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: 'var(--text-body)',
            fontWeight: 600,
            cursor: isSubmitting || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: isSubmitting || !text.trim() ? 0.6 : 1,
          }}
        >
          {isSubmitting ? '분석 중...' : '분석 시작'}
        </button>
      </div>
    </main>
  )
}
