import { create } from 'zustand'

interface Conversation {
  id: string
  title: string
  autoTitle: string | null
  isFavorite: boolean
  lastMessageAt: string
}

interface NoteFolder {
  id: string
  name: string
  color: string
  position: number
}

interface NotesState {
  conversations: Conversation[]
  folders: NoteFolder[]
  isLoading: boolean
  setConversations: (conversations: Conversation[]) => void
  setFolders: (folders: NoteFolder[]) => void
  setLoading: (isLoading: boolean) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  conversations: [],
  folders: [],
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  setFolders: (folders) => set({ folders }),
  setLoading: (isLoading) => set({ isLoading }),
}))
