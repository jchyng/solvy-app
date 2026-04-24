import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { ConversationSummary, Folder } from '@/types/api'
import { api } from '@/services/api'
import { NoteCard, FolderBottomSheet } from '@/features/notes'

export default function FolderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditSheet, setShowEditSheet] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        // folder 정보는 목록에서 가져오거나 별도 GET이 없으면 folders.list로 찾음
        const [folderRes, convRes] = await Promise.all([
          api.folders.list(),
          fetch(`/api/v1/folders/${id}/conversations`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
          }).catch(() => null),
        ])
        if (folderRes.ok) {
          const data = await folderRes.json() as { data: Folder[] }
          const found = data.data.find((f) => f.id === id) ?? null
          setFolder(found)
        }
        if (convRes?.ok) {
          const data = await convRes.json() as { data: ConversationSummary[] }
          setConversations(data.data ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const handleEditFolder = async (data: { name: string; color: string }) => {
    if (!id) return
    const res = await api.folders.update(id, data)
    if (res.ok) {
      const updated = await res.json() as Folder
      setFolder(updated)
    }
    setShowEditSheet(false)
  }

  const handleFavoriteToggle = async (convId: string, value: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_favorite: value } : c)),
    )
    await api.conversations.update(convId, { is_favorite: value })
  }

  return (
    <main style={{ padding: '16px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: 'var(--ink)',
            padding: 4,
          }}
        >
          ←
        </button>

        {folder && (
          <>
            <h1
              style={{
                flex: 1,
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {folder.name}
            </h1>
            <button
              data-testid="edit-folder-btn"
              onClick={() => setShowEditSheet(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                color: 'var(--ink-3)',
                cursor: 'pointer',
              }}
            >
              편집
            </button>
          </>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink-4)', textAlign: 'center', marginTop: 40 }}>불러오는 중…</p>
      ) : conversations.length === 0 ? (
        <p style={{ color: 'var(--ink-4)', textAlign: 'center', marginTop: 40 }}>
          이 폴더에 노트가 없어요
        </p>
      ) : (
        <div data-testid="folder-note-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {conversations.map((conv) => (
            <NoteCard
              key={conv.id}
              conversation={conv}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      {showEditSheet && folder && (
        <FolderBottomSheet
          folder={folder}
          onSave={handleEditFolder}
          onClose={() => setShowEditSheet(false)}
        />
      )}
    </main>
  )
}
