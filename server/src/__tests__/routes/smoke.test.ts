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

async function authed(method: string, path: string, body?: unknown) {
  const token = await sign({ sub: 'user-abc' }, TEST_SECRET, 'HS256')
  return app.request(
    path,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    testEnv as never,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockKV.get.mockResolvedValue(null)
  mockKV.put.mockResolvedValue(undefined)
})

describe('GET /health', () => {
  it('returns 200 with status ok (no auth required)', async () => {
    const res = await app.request('/health', {}, testEnv as never)
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string }
    expect(body.status).toBe('ok')
  })
})

describe('Problems routes → 501', () => {
  it('POST /api/v1/problems', async () => {
    const res = await authed('POST', '/api/v1/problems', {})
    expect(res.status).toBe(501)
  })

  it('GET /api/v1/problems/:id', async () => {
    const res = await authed('GET', '/api/v1/problems/some-id')
    expect(res.status).toBe(501)
  })

  it('GET /api/v1/problems/:id/status', async () => {
    const res = await authed('GET', '/api/v1/problems/some-id/status')
    expect(res.status).toBe(501)
  })
})

describe('Conversations routes → 501', () => {
  it('GET /api/v1/conversations', async () => {
    const res = await authed('GET', '/api/v1/conversations')
    expect(res.status).toBe(501)
  })

  it('GET /api/v1/conversations/:id', async () => {
    const res = await authed('GET', '/api/v1/conversations/some-id')
    expect(res.status).toBe(501)
  })

  it('PATCH /api/v1/conversations/:id', async () => {
    const res = await authed('PATCH', '/api/v1/conversations/some-id', {})
    expect(res.status).toBe(501)
  })

  it('DELETE /api/v1/conversations/:id', async () => {
    const res = await authed('DELETE', '/api/v1/conversations/some-id')
    expect(res.status).toBe(501)
  })
})

describe('Users routes → 501', () => {
  it('GET /api/v1/users/me', async () => {
    const res = await authed('GET', '/api/v1/users/me')
    expect(res.status).toBe(501)
  })

  it('PATCH /api/v1/users/me', async () => {
    const res = await authed('PATCH', '/api/v1/users/me', {})
    expect(res.status).toBe(501)
  })
})

describe('Folders routes → 501', () => {
  it('GET /api/v1/folders', async () => {
    const res = await authed('GET', '/api/v1/folders')
    expect(res.status).toBe(501)
  })
})
