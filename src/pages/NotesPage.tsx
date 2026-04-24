import { useState, useEffect, useCallback } from 'react'
import type { ConversationSummary, Folder } from '@/types/api'
import { api } from '@/services/api'
import { NoteCard, FolderCard, FolderBottomSheet, AddToFolderSheet } from '@/features/notes'

type Tab = 'recent' | 'favorite' | 'folders'

export default function NotesPage() {
  const [tab, setTab] = useState<Tab>('recent')
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [showFolderSheet, setShowFolderSheet] = useState(false)

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchFolderSheet, setShowBatchFolderSheet] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [convRes, folderRes] = await Promise.all([
        api.conversations.list(),
        api.folders.list(),
      ])
      if (convRes.ok) {
        const data = await convRes.json() as { data: ConversationSummary[] }
        setConversations(data.data)
      }
      if (folderRes.ok) {
        const data = await folderRes.json() as { data: Folder[] }
        setFolders(data.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const handleFavoriteToggle = async (id: string, value: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_favorite: value } : c)),
    )
    await api.conversations.update(id, { is_favorite: value })
  }

  const handleCreateFolder = async (data: { name: string; color: string }) => {
    const res = await api.folders.create(data)
    if (res.ok) {
      const folder = await res.json() as Folder
      setFolders((prev) => [...prev, folder])
    }
    setShowFolderSheet(false)
  }

  const handleLongPress = (id: string) => {
    setIsSelecting(true)
    setSelectedIds(new Set([id]))
  }

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  const handleBatchFavorite = async (value: boolean) => {
    const ids = [...selectedIds]
    setConversations((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, is_favorite: value } : c)),
    )
    await Promise.all(ids.map((id) => api.conversations.update(id, { is_favorite: value })))
    exitSelectMode()
  }

  const handleBatchDelete = async () => {
    const ids = [...selectedIds]
    setConversations((prev) => prev.filter((c) => !ids.includes(c.id)))
    await Promise.all(ids.map((id) => api.conversations.delete(id)))
    exitSelectMode()
  }

  const handleBatchFolderToggle = async (folderId: string) => {
    await Promise.all([...selectedIds].map((convId) =>
      api.folders.addConversation(folderId, convId),
    ))
  }

  const filteredConversations =
    tab === 'favorite' ? conversations.filter((c) => c.is_favorite) : conversations

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'recent', label: '최근' },
    { key: 'favorite', label: '즐겨찾기' },
    { key: 'folders', label: '목록' },
  ]

  return (
    <main style={{ padding: '16px 16px 80px' }}>
      {isSelecting ? (
        <div
          data-testid="select-bar"
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}
        >
          <button
            data-testid="exit-select-btn"
            onClick={exitSelectMode}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink)' }}
          >
            ✕
          </button>
          <span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>
            {selectedIds.size}개 선택됨
          </span>
          <button
            data-testid="batch-favorite-btn"
            onClick={() => handleBatchFavorite(true)}
            disabled={selectedIds.size === 0}
            style={batchBtn}
          >
            ★
          </button>
          <button
            data-testid="batch-folder-btn"
            onClick={() => setShowBatchFolderSheet(true)}
            disabled={selectedIds.size === 0}
            style={batchBtn}
          >
            ⎘
          </button>
          <button
            data-testid="batch-delete-btn"
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0}
            style={{ ...batchBtn, color: 'var(--warn)' }}
          >
            삭제
          </button>
        </div>
      ) : (
        <div
          data-testid="notes-tabs"
          style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              data-testid={`tab-${key}`}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: 15,
                fontWeight: tab === key ? 700 : 400,
                color: tab === key ? 'var(--accent)' : 'var(--ink-3)',
                cursor: 'pointer',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--ink-4)', textAlign: 'center', marginTop: 40 }}>불러오는 중…</p>
      ) : tab === 'folders' && !isSelecting ? (
        <>
          {folders.length === 0 ? (
            <p style={{ color: 'var(--ink-4)', textAlign: 'center', marginTop: 40 }}>
              아직 폴더가 없어요
            </p>
          ) : (
            <div
              data-testid="folder-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
            </div>
          )}
          <button
            data-testid="create-folder-btn"
            onClick={() => setShowFolderSheet(true)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1.5px dashed var(--line)',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 새 폴더 만들기
          </button>
        </>
      ) : (
        <div data-testid="note-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredConversations.length === 0 ? (
            <p style={{ color: 'var(--ink-4)', textAlign: 'center', marginTop: 40 }}>
              {tab === 'favorite' ? '즐겨찾기한 노트가 없어요' : '아직 풀이 노트가 없어요'}
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <NoteCard
                key={conv.id}
                conversation={conv}
                onFavoriteToggle={handleFavoriteToggle}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(conv.id)}
                onSelect={handleSelect}
                onLongPress={handleLongPress}
              />
            ))
          )}
        </div>
      )}

      {showFolderSheet && (
        <FolderBottomSheet
          onSave={handleCreateFolder}
          onClose={() => setShowFolderSheet(false)}
        />
      )}

      {showBatchFolderSheet && (
        <AddToFolderSheet
          folders={folders}
          selectedFolderIds={[]}
          onToggle={handleBatchFolderToggle}
          onCreateNew={() => { setShowBatchFolderSheet(false); setShowFolderSheet(true) }}
          onClose={() => setShowBatchFolderSheet(false)}
        />
      )}
    </main>
  )
}

const batchBtn: React.CSSProperties = {
  background: 'var(--bg-sunken)',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 15,
  cursor: 'pointer',
  color: 'var(--ink)',
}
