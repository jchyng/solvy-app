import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ConversationSummary } from '@/types/api'
import { getDisplayTitle } from '@/types/api'

interface Props {
  conversation: ConversationSummary
  onFavoriteToggle?: (id: string, value: boolean) => void
  isSelecting?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  onLongPress?: (id: string) => void
}

const LONG_PRESS_MS = 500

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

export function NoteCard({ conversation, onFavoriteToggle, isSelecting, isSelected, onSelect, onLongPress }: Props) {
  const navigate = useNavigate()
  const title = getDisplayTitle(conversation)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      onLongPress?.(conversation.id)
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleClick = () => {
    if (isSelecting) {
      onSelect?.(conversation.id)
    } else {
      navigate(`/chat/${conversation.id}`)
    }
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.(conversation.id, !conversation.is_favorite)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="note-card"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      style={{
        background: isSelected ? 'var(--surface-2)' : 'var(--bg-elevated)',
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        userSelect: 'none',
      }}
    >
      {isSelecting && (
        <input
          type="checkbox"
          data-testid="note-select-checkbox"
          checked={isSelected ?? false}
          onChange={() => onSelect?.(conversation.id)}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0, marginTop: 2 }}
          readOnly
        />
      )}
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
      {!isSelecting && (
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
      )}
    </div>
  )
}
