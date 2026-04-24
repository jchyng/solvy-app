import { useState } from 'react'
import type { Folder } from '@/types/api'

interface Props {
  folders: Folder[]
  selectedFolderIds: string[]
  onToggle: (folderId: string) => void
  onCreateNew: () => void
  onClose: () => void
}

export function AddToFolderSheet({ folders, selectedFolderIds, onToggle, onCreateNew, onClose }: Props) {
  const [selected, setSelected] = useState(new Set(selectedFolderIds))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    onToggle(id)
  }

  return (
    <div
      data-testid="add-to-folder-sheet"
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
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>
          목록에 추가
        </h2>

        {folders.length === 0 ? (
          <p style={{ color: 'var(--ink-4)', fontSize: 14, margin: '0 0 16px' }}>폴더가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0 }}>
            {folders.map((folder) => (
              <li key={folder.id}>
                <label
                  data-testid={`folder-option-${folder.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 4px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(folder.id)}
                    onChange={() => toggle(folder.id)}
                    data-testid={`folder-checkbox-${folder.id}`}
                    style={{ width: 18, height: 18, accentColor: folder.color }}
                  />
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: folder.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{folder.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <button
          data-testid="create-new-folder-btn"
          onClick={onCreateNew}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: '1.5px dashed var(--line)',
            background: 'transparent',
            color: 'var(--accent)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          + 새 폴더
        </button>
      </div>
    </div>
  )
}
