import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../index.js'

const TEST_SECRET = 'test-jwt-secret'

const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  getWithMetadata: vi.fn(),
}

const testEnv = {
  JWT_SECRET: TEST_SECRET,
  RATE_LIMIT_KV: mockKV,
  ENVIRONMENT: 'development',
}

async function makeToken(payload: Record<string, unknown> = { sub: 'user-abc' }) {
  return sign(payload, TEST_SECRET, 'HS256')
}

beforeEach(() => {
  vi.clearAllMocks()
  mockKV.get.mockResolvedValue(null)
  mockKV.put.mockResolvedValue(undefined)
})

describe('authMiddleware', () => {
  it('valid JWT → request reaches route handler (501)', async () => {
    const token = await makeToken()
    const res = await app.request(
      '/api/v1/users/me',
      { headers: { Authorization: `Bearer ${token}` } },
      testEnv as never,
    )
    expect(res.status).toBe(501)
  })

  it('missing Authorization header → 401', async () => {
    const res = await app.request('/api/v1/users/me', {}, testEnv as never)
    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('wrong scheme (Token xxx) → 401', async () => {
    const token = await makeToken()
    const res = await app.request(
      '/api/v1/users/me',
      { headers: { Authorization: `Token ${token}` } },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })

  it('invalid JWT signature → 401', async () => {
    const res = await app.request(
      '/api/v1/users/me',
      { headers: { Authorization: 'Bearer not.a.valid.jwt' } },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })

  it('JWT without sub claim → 401', async () => {
    const token = await makeToken({ userId: 'user-abc' })
    const res = await app.request(
      '/api/v1/users/me',
      { headers: { Authorization: `Bearer ${token}` } },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })
})
