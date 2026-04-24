import { useState } from 'react'
import type { Folder } from '@/types/api'

const PRESET_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F45', '#06D6A0', '#EF476F']

interface Props {
  folder?: Folder
  onSave: (data: { name: string; color: string }) => void
  onClose: () => void
}

export function FolderBottomSheet({ folder, onSave, onClose }: Props) {
  const [name, setName] = useState(folder?.name ?? '')
  const [color, setColor] = useState(folder?.color ?? PRESET_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
  }

  return (
    <div
      data-testid="folder-bottom-sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        role="presentation"
      />
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
          {folder ? '폴더 편집' : '새 폴더'}
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
              폴더 이름
            </span>
            <input
              data-testid="folder-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 오답노트"
              maxLength={20}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--bg-sunken)',
                color: 'var(--ink)',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </label>

          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', display: 'block', marginBottom: 10 }}>
              색상
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`color-${c}`}
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                  aria-pressed={color === c}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            data-testid="folder-save-btn"
            disabled={!name.trim()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: name.trim() ? 'var(--accent)' : 'var(--line)',
              color: name.trim() ? '#fff' : 'var(--ink-4)',
              fontSize: 16,
              fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            저장
          </button>
        </form>
      </div>
    </div>
  )
}
