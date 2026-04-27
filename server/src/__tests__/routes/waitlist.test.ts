import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../../index.js'

vi.mock('../../lib/db/client.js')
import { createDbClient } from '../../lib/db/client.js'

const testEnv = {
  JWT_SECRET: 'test-secret',
  RATE_LIMIT_KV: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  },
  ENVIRONMENT: 'development',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'test',
  GEMINI_API_KEY: 'test',
  OPENROUTER_API_KEY: 'test',
  MATHPIX_APP_ID: 'test',
  MATHPIX_APP_KEY: 'test',
  IMAGES_BUCKET: { put: vi.fn() },
  IMAGES_PUBLIC_URL: 'https://r2.test',
}

function makeEntry(email: string) {
  return {
    id: 'wl-uuid-1',
    email,
    invited_at: null,
    joined_at: null,
    created_at: new Date().toISOString(),
  }
}

function buildMockDb(email: string, count = 42) {
  return {
    waitlist: {
      register: vi.fn().mockResolvedValue(makeEntry(email)),
      findByEmail: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(count),
    },
    usageEvents: { sumCostToday: vi.fn(), errorRateLast10Min: vi.fn(), topUsersByCallsToday: vi.fn() },
    sessions: { create: vi.fn(), update: vi.fn(), findById: vi.fn() },
    conversations: { create: vi.fn(), findBySessionId: vi.fn(), findById: vi.fn(), list: vi.fn(), update: vi.fn(), updateLastMessageAt: vi.fn() },
    messages: { create: vi.fn(), listByConversation: vi.fn(), findByIdempotencyKey: vi.fn() },
    folders: { create: vi.fn(), list: vi.fn(), findById: vi.fn(), update: vi.fn(), delete: vi.fn(), addConversation: vi.fn(), removeConversation: vi.fn(), listConversations: vi.fn() },
  }
}

function post(body: unknown) {
  return app.request('/api/v1/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, testEnv as never)
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/v1/waitlist', () => {
  it('유효한 이메일 → 201 + position 반환', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb('test@example.com') as never)

    const res = await post({ email: 'test@example.com' })
    expect(res.status).toBe(201)
    const body = await res.json() as { email: string; position: number }
    expect(body.email).toBe('test@example.com')
    expect(typeof body.position).toBe('number')
  })

  it('이메일 없음 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb('') as never)
    const res = await post({})
    expect(res.status).toBe(400)
  })

  it('잘못된 이메일 형식 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb('') as never)
    const res = await post({ email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('이메일 대소문자 → 소문자로 정규화', async () => {
    const mockDb = buildMockDb('user@example.com')
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    await post({ email: 'USER@EXAMPLE.COM' })
    expect(mockDb.waitlist.register).toHaveBeenCalledWith('user@example.com')
  })

  it('이메일 앞뒤 공백 → trim 처리', async () => {
    const mockDb = buildMockDb('user@example.com')
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    await post({ email: '  user@example.com  ' })
    expect(mockDb.waitlist.register).toHaveBeenCalledWith('user@example.com')
  })

  it('중복 이메일 → 201 (멱등 처리)', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb('dup@example.com') as never)
    const res = await post({ email: 'dup@example.com' })
    expect(res.status).toBe(201)
  })

  it('인증 없이도 접근 가능 (공개 엔드포인트)', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb('open@example.com') as never)
    const res = await post({ email: 'open@example.com' })
    expect(res.status).toBe(201)
  })
})
