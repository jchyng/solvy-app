// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import type { ConversationSummary, Folder } from '@/types/api'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ id: 'folder-1' }),
}))

vi.mock('@/services/api')

vi.mock('@/features/notes', () => ({
  NoteCard: ({ conversation, onFavoriteToggle }: {
    conversation: ConversationSummary
    onFavoriteToggle?: (id: string, value: boolean) => void
  }) => (
    <div data-testid="folder-note-card" data-id={conversation.id}>
      <span>{conversation.id}</span>
      <button
        data-testid={`fav-btn-${conversation.id}`}
        onClick={() => onFavoriteToggle?.(conversation.id, !conversation.is_favorite)}
      >★</button>
    </div>
  ),
  FolderBottomSheet: ({ onSave, onClose }: {
    folder: Folder
    onSave: (d: { name: string; color: string }) => void
    onClose: () => void
  }) => (
    <div data-testid="folder-edit-sheet">
      <button data-testid="sheet-save" onClick={() => onSave({ name: 'Updated Name', color: '#00FF00' })}>저장</button>
      <button data-testid="sheet-close" onClick={onClose}>닫기</button>
    </div>
  ),
}))

import { api } from '@/services/api'
import FolderPage from '@/pages/FolderPage'

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-1',
    user_id: 'user-1',
    name: '오답노트',
    color: '#FF6B6B',
    position: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeConversation(id: string, overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id,
    problem_session_id: `sess-${id}`,
    title: null,
    auto_title: `제목 ${id}`,
    is_favorite: false,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  }
}

function ok(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data) } as unknown as Response
}

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  vi.clearAllMocks()
})

afterEach(() => {
  act(() => { root.unmount() })
  container.remove()
  vi.unstubAllGlobals()
})

async function render(folder: Folder, conversations: ConversationSummary[]) {
  vi.mocked(api.folders.list).mockResolvedValue(ok({ data: [folder] }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: conversations })))
  await act(async () => { root.render(<FolderPage />) })
  await act(async () => { await Promise.resolve() })
}

describe('FolderPage', () => {
  it('로딩 중 텍스트 표시', () => {
    vi.mocked(api.folders.list).mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    act(() => { root.render(<FolderPage />) })
    expect(container.textContent).toContain('불러오는 중')
  })

  it('폴더명 헤더에 표시', async () => {
    await render(makeFolder({ name: '오답노트' }), [])
    expect(container.textContent).toContain('오답노트')
  })

  it('빈 폴더 — 빈 상태 메시지 표시', async () => {
    await render(makeFolder(), [])
    expect(container.textContent).toContain('이 폴더에 노트가 없어요')
  })

  it('대화 목록 렌더링', async () => {
    const convs = [makeConversation('c1'), makeConversation('c2')]
    await render(makeFolder(), convs)
    const cards = container.querySelectorAll('[data-testid="folder-note-card"]')
    expect(cards.length).toBe(2)
  })

  it('편집 버튼 클릭 → FolderBottomSheet 표시', async () => {
    await render(makeFolder(), [])
    expect(container.querySelector('[data-testid="folder-edit-sheet"]')).toBeNull()
    act(() => {
      ;(container.querySelector('[data-testid="edit-folder-btn"]') as HTMLElement).click()
    })
    expect(container.querySelector('[data-testid="folder-edit-sheet"]')).not.toBeNull()
  })

  it('FolderBottomSheet 저장 → api.folders.update 호출', async () => {
    const updated = makeFolder({ name: 'Updated Name', color: '#00FF00' })
    vi.mocked(api.folders.update).mockResolvedValue(ok(updated))
    await render(makeFolder(), [])

    act(() => {
      ;(container.querySelector('[data-testid="edit-folder-btn"]') as HTMLElement).click()
    })
    await act(async () => {
      ;(container.querySelector('[data-testid="sheet-save"]') as HTMLElement).click()
    })
    await act(async () => { await Promise.resolve() })

    expect(api.folders.update).toHaveBeenCalledWith('folder-1', { name: 'Updated Name', color: '#00FF00' })
    // 시트가 닫혔는지 확인
    expect(container.querySelector('[data-testid="folder-edit-sheet"]')).toBeNull()
  })

  it('즐겨찾기 토글 → api.conversations.update 호출', async () => {
    vi.mocked(api.conversations.update).mockResolvedValue(ok({}))
    await render(makeFolder(), [makeConversation('c1')])

    await act(async () => {
      ;(container.querySelector('[data-testid="fav-btn-c1"]') as HTMLElement).click()
    })
    await act(async () => { await Promise.resolve() })

    expect(api.conversations.update).toHaveBeenCalledWith('c1', { is_favorite: true })
  })
})
