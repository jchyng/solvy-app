import { describe, it, expect, beforeEach } from 'vitest'
import { useConversationStore } from '@/stores/conversationStore'

const msg = (id: string) => ({ id, role: 'user' as const, content: 'hi', createdAt: '2024-01-01' })

beforeEach(() => {
  useConversationStore.setState({ currentConversationId: null, messages: [] })
})

describe('useConversationStore', () => {
  it('initial state is empty', () => {
    const { currentConversationId, messages } = useConversationStore.getState()
    expect(currentConversationId).toBeNull()
    expect(messages).toHaveLength(0)
  })

  it('setCurrentConversation updates id and clears messages', () => {
    useConversationStore.setState({ messages: [msg('m1')] })
    useConversationStore.getState().setCurrentConversation('conv-1')
    const { currentConversationId, messages } = useConversationStore.getState()
    expect(currentConversationId).toBe('conv-1')
    expect(messages).toHaveLength(0)
  })

  it('addMessage appends to messages list', () => {
    useConversationStore.getState().addMessage(msg('m1'))
    useConversationStore.getState().addMessage(msg('m2'))
    expect(useConversationStore.getState().messages).toHaveLength(2)
    expect(useConversationStore.getState().messages[1].id).toBe('m2')
  })

  it('clearMessages empties messages', () => {
    useConversationStore.setState({ messages: [msg('m1'), msg('m2')] })
    useConversationStore.getState().clearMessages()
    expect(useConversationStore.getState().messages).toHaveLength(0)
  })
})
