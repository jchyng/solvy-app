import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/services/api'
import { AnalysisCard } from '@/features/problem/AnalysisCard'
import { MarkdownView } from '@/shared/components/MarkdownView'
import type { MessageResponse, AnalysisResult } from '@/types/api'

function isAnalysisResult(v: unknown): v is AnalysisResult {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return typeof r['intent'] === 'string' && Array.isArray(r['concepts'])
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.conversations.messages(id)
      .then((r) => r.json() as Promise<MessageResponse[]>)
      .then((data) => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setError('메시지를 불러오지 못했습니다'); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-dvh">
        <p style={{ color: 'var(--ink-2)' }}>불러오는 중...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-dvh">
        <p style={{ color: 'var(--error, #e53e3e)' }}>{error}</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {messages.map((msg) => {
          if (msg.role === 'assistant' && isAnalysisResult(msg.structured_payload)) {
            return (
              <div key={msg.id}>
                <AnalysisCard result={msg.structured_payload} />
                {/* 꼬리 질문 칩 클릭 — Week 4에서 연결 */}
              </div>
            )
          }
          if (msg.role !== 'system') {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--ink-1)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  maxWidth: '80%',
                }}
              >
                <MarkdownView content={msg.content} />
              </div>
            )
          }
          return null
        })}

        {messages.length === 0 && (
          <p style={{ color: 'var(--ink-3)', textAlign: 'center' }}>아직 메시지가 없습니다</p>
        )}
      </div>
    </main>
  )
}
