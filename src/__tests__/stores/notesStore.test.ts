import { describe, it, expect, beforeEach } from 'vitest'
import { useNotesStore } from '@/stores/notesStore'

beforeEach(() => {
  useNotesStore.setState({ conversations: [], folders: [], isLoading: false })
})

describe('useNotesStore', () => {
  it('초기 상태', () => {
    const s = useNotesStore.getState()
    expect(s.conversations).toEqual([])
    expect(s.folders).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('setConversations: 목록 교체', () => {
    const conv = { id: 'c1', title: '제목', autoTitle: null, isFavorite: false, lastMessageAt: '' }
    useNotesStore.getState().setConversations([conv])
    expect(useNotesStore.getState().conversations).toEqual([conv])
  })

  it('setFolders: 목록 교체', () => {
    const folder = { id: 'f1', name: '오답노트', color: '#FF0000', position: 0 }
    useNotesStore.getState().setFolders([folder])
    expect(useNotesStore.getState().folders).toEqual([folder])
  })

  it('setLoading: true → false 토글', () => {
    useNotesStore.getState().setLoading(true)
    expect(useNotesStore.getState().isLoading).toBe(true)
    useNotesStore.getState().setLoading(false)
    expect(useNotesStore.getState().isLoading).toBe(false)
  })
})
