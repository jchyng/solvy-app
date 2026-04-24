import { useNavigate } from 'react-router-dom'
import type { ConversationSummary } from '@/types/api'
import { getDisplayTitle } from '@/types/api'

interface Props {
  conversation: ConversationSummary
  onFavoriteToggle?: (id: string, value: boolean) => void
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function NoteCard({ conversation, onFavoriteToggle }: Props) {
  const navigate = useNavigate()
  const title = getDisplayTitle(conversation)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.(conversation.id, !conversation.is_favorite)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="note-card"
      onClick={() => navigate(`/chat/${conversation.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/chat/${conversation.id}`)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-4)' }}>
          {formatRelativeTime(conversation.last_message_at)}
        </p>
      </div>
      <button
        data-testid="favorite-btn"
        onClick={handleFavorite}
        aria-label={conversation.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: conversation.is_favorite ? '#F5A623' : 'var(--ink-4)',
          padding: 4,
          flexShrink: 0,
        }}
      >
        ★
      </button>
    </div>
  )
}
