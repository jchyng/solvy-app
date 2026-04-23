import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/userStore'
import { api } from '@/services/api'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  useUserStore.setState({ user: null, token: null })
  mockFetch.mockResolvedValue(new Response('{}', { status: 200 }))
})

describe('api client', () => {
  it('request without token omits Authorization header', async () => {
    await api.users.me()
    const init = mockFetch.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('request with token includes Authorization: Bearer header', async () => {
    useUserStore.getState().setToken('my-jwt')
    await api.users.me()
    const init = mockFetch.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-jwt')
  })

  it('api.conversations.list uses GET (no method set)', async () => {
    await api.conversations.list()
    const init = mockFetch.mock.calls[0][1] as RequestInit
    expect(init.method).toBeUndefined()
  })

  it('api.problems.upload uses POST method with JSON body', async () => {
    await api.problems.upload({ image: 'base64' })
    const init = mockFetch.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ image: 'base64' }))
  })
})
