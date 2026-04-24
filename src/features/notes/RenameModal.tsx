import { useState } from 'react'

interface Props {
  initialTitle: string
  onSave: (title: string) => void
  onClose: () => void
}

export function RenameModal({ initialTitle, onSave, onClose }: Props) {
  const [value, setValue] = useState(initialTitle)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(value.trim())
  }

  return (
    <div
      data-testid="rename-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          padding: '24px 20px',
          width: '90%',
          maxWidth: 360,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
          이름 변경
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            data-testid="rename-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            maxLength={40}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--bg-sunken)',
              color: 'var(--ink)',
              fontSize: 15,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              data-testid="rename-cancel-btn"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink-3)',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              data-testid="rename-save-btn"
              disabled={!value.trim()}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: value.trim() ? 'var(--accent)' : 'var(--line)',
                color: value.trim() ? 'var(--interactive-primary-text)' : 'var(--ink-4)',
                fontSize: 15,
                fontWeight: 600,
                cursor: value.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
