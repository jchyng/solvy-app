import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { AnalysisCard } from '@/features/problem/AnalysisCard'
import { AddToFolderSheet, RenameModal } from '@/features/notes'
import { MarkdownView } from '@/shared/components/MarkdownView'
import { useUserStore } from '@/stores/userStore'
import { api } from '@/services/api'
import type { MessageResponse, FollowUpQuestion, SSEEvent, ConversationWithMessages, Folder } from '@/types/api'

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

function isAnalysisResult(v: unknown): v is import('@/types/api').AnalysisResult {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return typeof r['intent'] === 'string' && Array.isArray(r['concepts'])
}

function TypingIndicator() {
  return (
    <div
      style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}
      data-testid="typing-indicator"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--ink-3, #9ca3af)',
            display: 'inline-block',
            opacity: 0.6,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [lastFailed, setLastFailed] = useState<{ content: string; key: string } | null>(null)

  const [isFavorite, setIsFavorite] = useState(false)
  const [convTitle, setConvTitle] = useState<string | null>(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showAddToFolder, setShowAddToFolder] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [convFolderIds, setConvFolderIds] = useState(new Set<string>())

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const token = useUserStore((s) => s.token)

  useEffect(() => {
    if (!id) return
    fetch(`${BASE}/conversations/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ConversationWithMessages>
      })
      .then((data) => {
        setMessages(Array.isArray(data.messages) ? data.messages : [])
        setIsFavorite(data.is_favorite)
        setConvTitle(data.title)
        setLoading(false)
      })
      .catch(() => {
        setLoadError('대화를 불러오지 못했습니다')
        setLoading(false)
      })
  }, [id, token])

  // 새 메시지 / 스트리밍 중 자동 스크롤
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, isAtBottom])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setIsAtBottom(distFromBottom < 50)
  }, [])

  const sendMessage = useCallback(
    async (content: string, idempotencyKey?: string) => {
      if (!id || !content.trim() || isStreaming) return

      const key = idempotencyKey ?? crypto.randomUUID()

      const tempUserMsg: MessageResponse = {
        id: `temp-${Date.now()}`,
        conversation_id: id,
        role: 'user',
        content: content.trim(),
        structured_payload: null,
        follow_up_questions: [],
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, tempUserMsg])
      setStreamingContent('')
      setStreamError(null)
      setLastFailed(null)
      setIsStreaming(true)
      setIsAtBottom(true)

      try {
        const res = await fetch(`${BASE}/conversations/${id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: content.trim(), idempotency_key: key }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (!res.body) throw new Error('응답 스트림이 없습니다')

        let accumulated = ''
        let finalFollowUps: FollowUpQuestion[] = []
        let finalMsgId = `msg-${Date.now()}`

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent
              if (event.type === 'token' && event.content) {
                accumulated += event.content
                setStreamingContent(accumulated)
              } else if (event.type === 'done') {
                finalFollowUps = event.follow_up_questions ?? []
                finalMsgId = event.message_id ?? finalMsgId
              } else if (event.type === 'error') {
                throw new Error(event.message ?? 'AI 응답 오류')
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue
              throw parseErr
            }
          }
        }

        const assistantMsg: MessageResponse = {
          id: finalMsgId,
          conversation_id: id,
          role: 'assistant',
          content: accumulated,
          structured_payload: null,
          follow_up_questions: finalFollowUps,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        setStreamingContent('')
      } catch (err) {
        setStreamError(err instanceof Error ? err.message : 'AI 응답 오류')
        setLastFailed({ content, key })
      } finally {
        setIsStreaming(false)
      }
    },
    [id, isStreaming, token],
  )

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    sendMessage(trimmed)
  }

  const handleFollowUp = (q: FollowUpQuestion) => {
    sendMessage(q.label)
  }

  const handleRetry = () => {
    if (lastFailed) {
      setStreamError(null)
      sendMessage(lastFailed.content, lastFailed.key)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!id) return
    const next = !isFavorite
    setIsFavorite(next)
    await api.conversations.update(id, { is_favorite: next })
  }

  const handleRename = async (title: string) => {
    if (!id) return
    await api.conversations.update(id, { title })
    setConvTitle(title)
    setShowRenameModal(false)
  }

  const handleOpenAddToFolder = async () => {
    const res = await api.folders.list()
    if (res.ok) {
      const data = await res.json() as { data: Folder[] }
      setFolders(data.data ?? [])
    }
    setShowAddToFolder(true)
  }

  const handleFolderToggle = async (folderId: string) => {
    if (!id) return
    const isAdding = !convFolderIds.has(folderId)
    if (isAdding) {
      setConvFolderIds((prev) => new Set([...prev, folderId]))
      await api.folders.addConversation(folderId, id)
    } else {
      setConvFolderIds((prev) => { const s = new Set(prev); s.delete(folderId); return s })
      await api.folders.removeConversation(folderId, id)
    }
  }

  const lastAssistantIdx = messages.reduce(
    (acc, msg, i) => (msg.role === 'assistant' ? i : acc),
    -1,
  )

  if (loading) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <p style={{ color: 'var(--ink-2)' }}>불러오는 중...</p>
      </main>
    )
  }

  if (loadError) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <p style={{ color: 'var(--error, #e53e3e)' }}>{loadError}</p>
      </main>
    )
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      {/* 메시지 목록 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-testid="message-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {messages.map((msg, idx) => {
          if (msg.role === 'system') return null

          if (msg.role === 'assistant' && isAnalysisResult(msg.structured_payload)) {
            return (
              <div key={msg.id}>
                <AnalysisCard
                  result={msg.structured_payload}
                  onFollowUp={
                    idx === lastAssistantIdx && !isStreaming ? handleFollowUp : undefined
                  }
                  isFavorite={isFavorite}
                  onFavoriteToggle={handleFavoriteToggle}
                  onRename={() => setShowRenameModal(true)}
                  onAddToFolder={handleOpenAddToFolder}
                />
              </div>
            )
          }

          if (msg.role === 'assistant') {
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={assistantBubble}>
                  <MarkdownView content={msg.content} />
                </div>
                {idx === lastAssistantIdx && !isStreaming && msg.follow_up_questions.length > 0 && (
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    data-testid="followup-chips"
                  >
                    {msg.follow_up_questions.map((q) => (
                      <button key={q.id} onClick={() => handleFollowUp(q)} style={chipStyle}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={userBubble}>
                <span style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--text-body, 15px)' }}>
                  {msg.content}
                </span>
              </div>
            </div>
          )
        })}

        {/* 스트리밍 중 말풍선 */}
        {isStreaming && (
          <div style={assistantBubble} data-testid="streaming-bubble">
            {streamingContent ? (
              <MarkdownView content={streamingContent} />
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}

        {/* 에러 + 재시도 버튼 */}
        {streamError && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}
            data-testid="stream-error"
          >
            <p style={{ color: 'var(--error, #e53e3e)', fontSize: 'var(--text-small, 13px)' }}>
              오류: {streamError}
            </p>
            <button onClick={handleRetry} style={retryBtn} data-testid="retry-btn">
              다시 시도
            </button>
          </div>
        )}

        {messages.filter((m) => m.role !== 'system').length === 0 && !isStreaming && (
          <p style={{ color: 'var(--ink-3)', textAlign: 'center' }}>아직 메시지가 없습니다</p>
        )}

        <div ref={bottomRef} />
      </div>

      {showRenameModal && (
        <RenameModal
          initialTitle={convTitle ?? ''}
          onSave={handleRename}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      {showAddToFolder && (
        <AddToFolderSheet
          folders={folders}
          selectedFolderIds={[...convFolderIds]}
          onToggle={handleFolderToggle}
          onCreateNew={() => setShowAddToFolder(false)}
          onClose={() => setShowAddToFolder(false)}
        />
      )}

      {/* 입력창 */}
      <div
        style={{
          borderTop: '1px solid var(--surface-2, #f3f4f6)',
          padding: '12px 16px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="질문을 입력하세요..."
          disabled={isStreaming}
          data-testid="chat-input"
          style={inputStyle}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          data-testid="send-btn"
          style={sendBtn}
        >
          전송
        </button>
      </div>
    </main>
  )
}

const assistantBubble: React.CSSProperties = {
  background: 'var(--surface-2, #f3f4f6)',
  color: 'var(--ink-1, #111)',
  borderRadius: '16px',
  padding: '12px 16px',
  maxWidth: '80%',
  alignSelf: 'flex-start',
}

const userBubble: React.CSSProperties = {
  background: 'var(--accent, #6366f1)',
  color: '#fff',
  borderRadius: '16px',
  padding: '12px 16px',
  maxWidth: '80%',
}

const chipStyle: React.CSSProperties = {
  background: 'var(--surface-2, #f3f4f6)',
  color: 'var(--accent, #6366f1)',
  border: '1px solid var(--accent, #6366f1)',
  borderRadius: '20px',
  padding: '8px 16px',
  fontSize: 'var(--text-small, 13px)',
  cursor: 'pointer',
}

const retryBtn: React.CSSProperties = {
  background: 'none',
  color: 'var(--accent, #6366f1)',
  border: '1px solid var(--accent, #6366f1)',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: 'var(--text-small, 13px)',
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid var(--surface-2, #f3f4f6)',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: 'var(--text-body, 15px)',
  background: 'var(--surface-1, #fff)',
  color: 'var(--ink-1, #111)',
  outline: 'none',
}

const sendBtn: React.CSSProperties = {
  background: 'var(--accent, #6366f1)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '12px 20px',
  fontSize: 'var(--text-body, 15px)',
  cursor: 'pointer',
  fontWeight: 600,
}
