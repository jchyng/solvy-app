import { useNavigate } from 'react-router-dom'
import type { Folder } from '@/types/api'

interface Props {
  folder: Folder
  count?: number
}

export function FolderCard({ folder, count = 0 }: Props) {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="folder-card"
      onClick={() => navigate(`/notes/folders/${folder.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/notes/folders/${folder.id}`)}
      style={{
        background: 'var(--bg-elevated)',
        border: `2px solid ${folder.color}`,
        borderRadius: 12,
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        aspectRatio: '1',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: folder.color,
          opacity: 0.3,
        }}
      />
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {folder.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-4)' }}>
          {count}개
        </p>
      </div>
    </div>
  )
}
