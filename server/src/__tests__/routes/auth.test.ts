import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verify } from 'hono/jwt'
import { app } from '../../index.js'

vi.mock('../../lib/db/client.js')
import { createDbClient } from '../../lib/db/client.js'

const TEST_SECRET = 'test-jwt-secret'

const testEnv = {
  JWT_SECRET: TEST_SECRET,
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

const now = new Date()
const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
const past = new Date(now.getTime() - 1000).toISOString()

function makeInvite(overrides: Partial<{
  id: string; code: string; email: string | null; used_at: string | null; expires_at: string
}> = {}) {
  return {
    id: 'inv-1',
    code: 'BETA-CODE',
    email: 'user@example.com',
    used_at: null,
    expires_at: future,
    created_at: now.toISOString(),
    ...overrides,
  }
}

function makeUser(email = 'user@example.com') {
  return {
    id: 'user-uuid-1',
    email,
    name: 'user',
    tier: 'free',
    is_beta_tester: true,
    created_at: now.toISOString(),
  }
}

function buildMockDb(opts: {
  invite?: ReturnType<typeof makeInvite> | null
  existingUser?: ReturnType<typeof makeUser> | null
  createdUser?: ReturnType<typeof makeUser>
}) {
  const { invite = makeInvite(), existingUser = null, createdUser = makeUser() } = opts
  return {
    inviteCodes: {
      findByCode: vi.fn().mockResolvedValue(invite),
      markUsed: vi.fn().mockResolvedValue(undefined),
    },
    users: {
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn().mockResolvedValue(createdUser),
    },
    waitlist: { register: vi.fn(), findByEmail: vi.fn(), count: vi.fn() },
    usageEvents: { sumCostToday: vi.fn(), errorRateLast10Min: vi.fn(), topUsersByCallsToday: vi.fn() },
    sessions: { create: vi.fn(), update: vi.fn(), findById: vi.fn() },
    conversations: { create: vi.fn(), findBySessionId: vi.fn(), findById: vi.fn(), list: vi.fn(), update: vi.fn(), updateLastMessageAt: vi.fn() },
    messages: { create: vi.fn(), listByConversation: vi.fn(), findByIdempotencyKey: vi.fn() },
    folders: { create: vi.fn(), list: vi.fn(), findById: vi.fn(), update: vi.fn(), delete: vi.fn(), addConversation: vi.fn(), removeConversation: vi.fn(), listConversations: vi.fn() },
  }
}

function post(body: unknown) {
  return app.request('/api/v1/auth/redeem-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, testEnv as never)
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/v1/auth/redeem-invite', () => {
  it('정상 가입 → 201 + token + user', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({}) as never)

    const res = await post({ code: 'BETA-CODE', email: 'user@example.com' })
    expect(res.status).toBe(201)
    const body = await res.json() as { token: string; user: { id: string; is_beta_tester: boolean } }
    expect(typeof body.token).toBe('string')
    expect(body.user.id).toBe('user-uuid-1')
    expect(body.user.is_beta_tester).toBe(true)
  })

  it('JWT 검증 가능 (HS256)', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({}) as never)

    const res = await post({ code: 'BETA-CODE', email: 'user@example.com' })
    const { token } = await res.json() as { token: string }
    const payload = await verify(token, TEST_SECRET, 'HS256')
    expect(payload.sub).toBe('user-uuid-1')
    expect(payload.tier).toBe('free')
  })

  it('코드 없음 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({}) as never)
    const res = await post({ email: 'user@example.com' })
    expect(res.status).toBe(400)
  })

  it('이메일 형식 오류 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({}) as never)
    const res = await post({ code: 'BETA-CODE', email: 'not-email' })
    expect(res.status).toBe(400)
  })

  it('없는 코드 → 404', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({ invite: null }) as never)
    const res = await post({ code: 'WRONG', email: 'user@example.com' })
    expect(res.status).toBe(404)
  })

  it('만료된 코드 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(
      buildMockDb({ invite: makeInvite({ expires_at: past }) }) as never,
    )
    const res = await post({ code: 'BETA-CODE', email: 'user@example.com' })
    expect(res.status).toBe(400)
  })

  it('이미 사용된 코드 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(
      buildMockDb({ invite: makeInvite({ used_at: past }) }) as never,
    )
    const res = await post({ code: 'BETA-CODE', email: 'user@example.com' })
    expect(res.status).toBe(400)
  })

  it('이메일 불일치 → 400', async () => {
    vi.mocked(createDbClient).mockReturnValue(buildMockDb({}) as never)
    const res = await post({ code: 'BETA-CODE', email: 'other@example.com' })
    expect(res.status).toBe(400)
  })

  it('이메일 null 초대 코드 → 어떤 이메일이든 허용', async () => {
    vi.mocked(createDbClient).mockReturnValue(
      buildMockDb({ invite: makeInvite({ email: null }), createdUser: makeUser('any@test.com') }) as never,
    )
    const res = await post({ code: 'BETA-CODE', email: 'any@test.com' })
    expect(res.status).toBe(201)
  })

  it('중복 가입 → 200 + 기존 유저 token', async () => {
    const existingUser = makeUser()
    vi.mocked(createDbClient).mockReturnValue(
      buildMockDb({ existingUser }) as never,
    )
    const res = await post({ code: 'BETA-CODE', email: 'user@example.com' })
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { id: string } }
    expect(body.user.id).toBe('user-uuid-1')
  })

  it('name 파라미터 포함 → 그 이름으로 생성', async () => {
    const mockDb = buildMockDb({})
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    await post({ code: 'BETA-CODE', email: 'user@example.com', name: '홍길동' })
    expect(mockDb.users.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '홍길동' }),
    )
  })

  it('name 없으면 이메일 앞부분을 이름으로', async () => {
    const mockDb = buildMockDb({ invite: makeInvite({ email: null }), createdUser: makeUser('alice@example.com') })
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    await post({ code: 'BETA-CODE', email: 'alice@example.com' })
    expect(mockDb.users.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'alice' }),
    )
  })
})
