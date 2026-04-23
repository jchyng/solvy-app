import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import app from '../../index.js'

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

async function authedRequest(count: string | null) {
  const token = await sign({ sub: 'user-abc' }, TEST_SECRET, 'HS256')
  mockKV.get.mockResolvedValue(count)
  mockKV.put.mockResolvedValue(undefined)
  return app.request(
    '/api/v1/users/me',
    { headers: { Authorization: `Bearer ${token}` } },
    testEnv as never,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('rateLimitMiddleware', () => {
  it('first request (count=null) → passes through and increments KV', async () => {
    const res = await authedRequest(null)
    expect(res.status).toBe(501)
    expect(mockKV.put).toHaveBeenCalledOnce()
    const [key, value] = mockKV.put.mock.calls[0] as [string, string, unknown]
    expect(key).toMatch(/^rl:user-abc:\d+$/)
    expect(value).toBe('1')
  })

  it('59th request (count=58) → passes through', async () => {
    const res = await authedRequest('58')
    expect(res.status).toBe(501)
    expect(mockKV.put).toHaveBeenCalledOnce()
  })

  it('60th request (count=60) → 429 RATE_LIMITED', async () => {
    const res = await authedRequest('60')
    expect(res.status).toBe(429)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('RATE_LIMITED')
  })

  it('429 response includes Retry-After header', async () => {
    const res = await authedRequest('60')
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})
