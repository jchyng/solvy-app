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
  IMAGES_BUCKET: { put: vi.fn() },
  IMAGES_PUBLIC_URL: 'https://r2.test',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'test',
  GEMINI_API_KEY: 'test',
  OPENROUTER_API_KEY: 'test',
  MATHPIX_APP_ID: 'test',
  MATHPIX_APP_KEY: 'test',
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

// Problems routes tested in __tests__/routes/problems.test.ts

// GET /api/v1/conversations, PATCH/DELETE, POST /:id/messages
// — Week 4~5에서 구현 완료. 상세 테스트는 conversations.test.ts / folders.test.ts 참조.

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
