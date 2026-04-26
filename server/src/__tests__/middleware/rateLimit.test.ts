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

async function authedRequest(count: string | null, tier?: string) {
  const payload: Record<string, string> = { sub: 'user-abc' }
  if (tier) payload.tier = tier
  const token = await sign(payload, TEST_SECRET, 'HS256')
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

  it('429 response includes Retry-After header', async () => {
    const res = await authedRequest('30')
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })

  describe('free tier (limit=30)', () => {
    it('count=29 → 통과', async () => {
      const res = await authedRequest('29', 'free')
      expect(res.status).toBe(501)
    })

    it('count=30 → 429', async () => {
      const res = await authedRequest('30', 'free')
      expect(res.status).toBe(429)
      const body = await res.json() as { code: string }
      expect(body.code).toBe('RATE_LIMITED')
    })

    it('tier 클레임 없음 → free limit 적용 (count=30 → 429)', async () => {
      const res = await authedRequest('30')
      expect(res.status).toBe(429)
    })
  })

  describe('light tier (limit=60)', () => {
    it('count=59 → 통과', async () => {
      const res = await authedRequest('59', 'light')
      expect(res.status).toBe(501)
    })

    it('count=60 → 429', async () => {
      const res = await authedRequest('60', 'light')
      expect(res.status).toBe(429)
      const body = await res.json() as { code: string }
      expect(body.code).toBe('RATE_LIMITED')
    })
  })

  describe('pro tier (limit=120)', () => {
    it('count=119 → 통과', async () => {
      const res = await authedRequest('119', 'pro')
      expect(res.status).toBe(501)
    })

    it('count=120 → 429', async () => {
      const res = await authedRequest('120', 'pro')
      expect(res.status).toBe(429)
      const body = await res.json() as { code: string }
      expect(body.code).toBe('RATE_LIMITED')
    })
  })
})
