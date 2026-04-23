import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/userStore'

beforeEach(() => {
  useUserStore.setState({ user: null, token: null })
})

describe('useUserStore', () => {
  it('initial state is empty', () => {
    const { user, token } = useUserStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
  })

  it('setToken stores the token', () => {
    useUserStore.getState().setToken('my-token')
    expect(useUserStore.getState().token).toBe('my-token')
  })

  it('setUser stores the user', () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Alice', tier: 'free' as const }
    useUserStore.getState().setUser(user)
    expect(useUserStore.getState().user).toEqual(user)
  })

  it('logout clears user and token', () => {
    useUserStore.setState({ user: { id: 'u1', email: 'a@b.com', name: 'Alice', tier: 'free' }, token: 'tok' })
    useUserStore.getState().logout()
    expect(useUserStore.getState().user).toBeNull()
    expect(useUserStore.getState().token).toBeNull()
  })
})
