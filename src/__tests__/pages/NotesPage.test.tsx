// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
}))

vi.mock('@/stores/userStore', () => {
  const state = { token: 'mock-token', user: null }
  const hook = Object.assign(
    vi.fn((selector: (s: typeof state) => unknown) => selector(state)),
    { getState: () => state },
  )
  return { useUserStore: hook }
})

import NotesPage from '@/pages/NotesPage'
import type { ConversationSummary, Folder } from '@/types/api'

function makeConversation(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'conv-1',
    problem_session_id: 'sess-1',
    title: null,
    auto_title: '이차방정식',
    is_favorite: false,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  }
}

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

function mockApi(conversations: ConversationSummary[], folders: Folder[]) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/conversations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: conversations }),
      })
    }
    if (url.includes('/folders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: folders }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
}

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => { root.unmount() })
  container.remove()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('NotesPage', () => {
  it('탭 3개(최근/즐겨찾기/목록) 렌더링', async () => {
    vi.stubGlobal('fetch', mockApi([], []))
    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.querySelector('[data-testid="tab-recent"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="tab-favorite"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="tab-folders"]')).not.toBeNull()
  })

  it('최근 탭: 대화 목록 카드 렌더링', async () => {
    const conv = makeConversation({ auto_title: '이차방정식' })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const cards = container.querySelectorAll('[data-testid="note-card"]')
    expect(cards.length).toBe(1)
    expect(container.textContent).toContain('이차방정식')
  })

  it('즐겨찾기 탭: is_favorite=true 항목만 표시', async () => {
    const convs = [
      makeConversation({ id: 'c1', auto_title: '즐겨찾기', is_favorite: true }),
      makeConversation({ id: 'c2', auto_title: '일반', is_favorite: false }),
    ]
    vi.stubGlobal('fetch', mockApi(convs, []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const favTab = container.querySelector('[data-testid="tab-favorite"]') as HTMLButtonElement
    await act(async () => { favTab.click() })

    const cards = container.querySelectorAll('[data-testid="note-card"]')
    expect(cards.length).toBe(1)
    expect(container.textContent).toContain('즐겨찾기')
    expect(container.textContent).not.toContain('일반')
  })

  it('목록 탭: 폴더 그리드 렌더링', async () => {
    const folder = makeFolder({ name: '오답노트' })
    vi.stubGlobal('fetch', mockApi([], [folder]))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const foldersTab = container.querySelector('[data-testid="tab-folders"]') as HTMLButtonElement
    await act(async () => { foldersTab.click() })

    const cards = container.querySelectorAll('[data-testid="folder-card"]')
    expect(cards.length).toBe(1)
    expect(container.textContent).toContain('오답노트')
  })

  it('목록 탭: 새 폴더 만들기 버튼 렌더링', async () => {
    vi.stubGlobal('fetch', mockApi([], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const foldersTab = container.querySelector('[data-testid="tab-folders"]') as HTMLButtonElement
    await act(async () => { foldersTab.click() })

    expect(container.querySelector('[data-testid="create-folder-btn"]')).not.toBeNull()
  })

  it('새 폴더 만들기 클릭 → FolderBottomSheet 표시', async () => {
    vi.stubGlobal('fetch', mockApi([], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const foldersTab = container.querySelector('[data-testid="tab-folders"]') as HTMLButtonElement
    await act(async () => { foldersTab.click() })

    const createBtn = container.querySelector('[data-testid="create-folder-btn"]') as HTMLButtonElement
    await act(async () => { createBtn.click() })

    expect(container.querySelector('[data-testid="folder-bottom-sheet"]')).not.toBeNull()
  })

  it('title > auto_title > "제목 없음" 우선순위 — title 있으면 title 표시', async () => {
    const conv = makeConversation({ title: '내 제목', auto_title: '자동 제목' })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('내 제목')
    expect(container.textContent).not.toContain('자동 제목')
  })

  it('title > auto_title > "제목 없음" 우선순위 — auto_title 표시', async () => {
    const conv = makeConversation({ title: null, auto_title: '자동 제목' })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('자동 제목')
  })

  it('title > auto_title > "제목 없음" 우선순위 — 둘 다 없으면 "제목 없음" 표시', async () => {
    const conv = makeConversation({ title: null, auto_title: null })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('제목 없음')
  })

  it('로딩 중 상태 표시', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    await act(async () => { root.render(<NotesPage />) })
    expect(container.textContent).toContain('불러오는 중')
  })

  it('길게 누르기(pointerdown 500ms) → 다중 선택 모드 진입', async () => {
    vi.useFakeTimers()
    const conv = makeConversation({ id: 'c1', auto_title: '이차방정식' })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const card = container.querySelector('[data-testid="note-card"]') as HTMLElement
    act(() => { card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })
    act(() => { vi.advanceTimersByTime(500) })

    expect(container.querySelector('[data-testid="select-bar"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="note-select-checkbox"]')).not.toBeNull()

    vi.useRealTimers()
  })

  it('다중 선택 모드: 카드 클릭으로 선택 토글', async () => {
    vi.useFakeTimers()
    const convs = [
      makeConversation({ id: 'c1', auto_title: '문제1' }),
      makeConversation({ id: 'c2', auto_title: '문제2' }),
    ]
    vi.stubGlobal('fetch', mockApi(convs, []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const cards = container.querySelectorAll('[data-testid="note-card"]')
    // 첫 번째 카드 길게 눌러서 선택 모드 진입
    act(() => { cards[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })
    act(() => { vi.advanceTimersByTime(500) })

    // 두 번째 카드 클릭 → 선택 추가
    await act(async () => { (cards[1] as HTMLElement).click() })

    const selectCount = container.querySelector('[data-testid="select-bar"]')?.textContent
    expect(selectCount).toContain('2개 선택됨')

    vi.useRealTimers()
  })

  it('다중 선택 모드: ✕ 버튼 클릭 → 선택 해제 후 탭 복원', async () => {
    vi.useFakeTimers()
    const conv = makeConversation({ id: 'c1' })
    vi.stubGlobal('fetch', mockApi([conv], []))

    await act(async () => { root.render(<NotesPage />) })
    await act(async () => { await Promise.resolve() })

    const card = container.querySelector('[data-testid="note-card"]') as HTMLElement
    act(() => { card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })
    act(() => { vi.advanceTimersByTime(500) })

    const exitBtn = container.querySelector('[data-testid="exit-select-btn"]') as HTMLButtonElement
    await act(async () => { exitBtn.click() })

    expect(container.querySelector('[data-testid="select-bar"]')).toBeNull()
    expect(container.querySelector('[data-testid="notes-tabs"]')).not.toBeNull()

    vi.useRealTimers()
  })
})
