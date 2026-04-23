import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

interface ConversationState {
  currentConversationId: string | null
  messages: Message[]
  setCurrentConversation: (id: string | null) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  currentConversationId: null,
  messages: [],
  setCurrentConversation: (id) => set({ currentConversationId: id, messages: [] }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}))
