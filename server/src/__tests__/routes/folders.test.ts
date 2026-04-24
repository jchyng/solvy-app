import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import app from '../../index.js'
import type { Conversation, Folder } from '../../lib/db/types.js'

vi.mock('../../lib/db/client.js')
vi.mock('../../lib/ai/index.js')
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn().mockReturnValue({}) }))

import { createDbClient } from '../../lib/db/client.js'

const TEST_SECRET = 'test-jwt-secret'
const USER_ID = 'user-abc'
const OTHER_USER_ID = 'user-xyz'
const FOLDER_ID = 'folder-uuid-1'
const CONV_ID = 'conv-uuid-1'

const mockKV = {
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  list: vi.fn(),
  getWithMetadata: vi.fn(),
}

const testEnv = {
  JWT_SECRET: TEST_SECRET,
  RATE_LIMIT_KV: mockKV,
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

function makeFolder(userId = USER_ID): Folder {
  return {
    id: FOLDER_ID,
    user_id: userId,
    name: '오답노트',
    color: '#FF6B6B',
    position: 0,
    created_at: new Date().toISOString(),
  }
}

function makeConversation(userId = USER_ID): Conversation {
  return {
    id: CONV_ID,
    user_id: userId,
    problem_session_id: 'sess-1',
    title: null,
    auto_title: '이차방정식',
    is_favorite: false,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    deleted_at: null,
  }
}

async function authed(method: string, path: string, body?: unknown, userId = USER_ID) {
  const token = await sign({ sub: userId }, TEST_SECRET, 'HS256')
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  let reqBody: BodyInit | undefined

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    reqBody = JSON.stringify(body)
  }

  return app.request(path, { method, headers, body: reqBody }, testEnv as never)
}

function buildMockDb(overrides: Partial<ReturnType<typeof buildMockDb>> = {}) {
  return {
    sessions: { create: vi.fn(), update: vi.fn(), findById: vi.fn() },
    conversations: {
      create: vi.fn().mockResolvedValue(makeConversation()),
      findBySessionId: vi.fn().mockResolvedValue(makeConversation()),
      findById: vi.fn().mockResolvedValue(makeConversation()),
      list: vi.fn().mockResolvedValue([makeConversation()]),
      update: vi.fn().mockResolvedValue(makeConversation()),
      updateLastMessageAt: vi.fn().mockResolvedValue(undefined),
    },
    messages: {
      create: vi.fn(),
      listByConversation: vi.fn().mockResolvedValue([]),
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    },
    folders: {
      create: vi.fn().mockResolvedValue(makeFolder()),
      list: vi.fn().mockResolvedValue([makeFolder()]),
      findById: vi.fn().mockResolvedValue(makeFolder()),
      update: vi.fn().mockImplementation((_id: string, data: Partial<Folder>) =>
        Promise.resolve({ ...makeFolder(), ...data }),
      ),
      delete: vi.fn().mockResolvedValue(undefined),
      addConversation: vi.fn().mockResolvedValue(undefined),
      removeConversation: vi.fn().mockResolvedValue(undefined),
      listConversations: vi.fn().mockResolvedValue([makeConversation()]),
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockKV.get.mockResolvedValue(null)
  mockKV.put.mockResolvedValue(undefined)
})

// ────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/folders', () => {
  it('인증된 요청 → 200 + 폴더 목록', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', '/api/v1/folders')
    expect(res.status).toBe(200)
    const body = await res.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(1)
  })

  it('인증 없음 → 401', async () => {
    const res = await app.request('/api/v1/folders', { method: 'GET' }, testEnv as never)
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/folders', () => {
  it('유효한 요청 → 201 + 생성된 폴더', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', '/api/v1/folders', { name: '오답노트', color: '#FF6B6B' })
    expect(res.status).toBe(201)
    expect(mockDb.folders.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, name: '오답노트', color: '#FF6B6B' }),
    )
  })

  it('name 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', '/api/v1/folders', { color: '#FF6B6B' })
    expect(res.status).toBe(400)
  })

  it('color 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', '/api/v1/folders', { name: '오답노트' })
    expect(res.status).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/v1/folders/:id', () => {
  it('이름 수정 → 200 + 업데이트된 폴더', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/folders/${FOLDER_ID}`, { name: '새 이름' })
    expect(res.status).toBe(200)
    expect(mockDb.folders.update).toHaveBeenCalledWith(
      FOLDER_ID,
      expect.objectContaining({ name: '새 이름' }),
    )
  })

  it('색상 수정 → 200', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/folders/${FOLDER_ID}`, { color: '#4ECDC4' })
    expect(res.status).toBe(200)
    expect(mockDb.folders.update).toHaveBeenCalledWith(
      FOLDER_ID,
      expect.objectContaining({ color: '#4ECDC4' }),
    )
  })

  it('순서(position) 수정 → 200', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/folders/${FOLDER_ID}`, { position: 2 })
    expect(res.status).toBe(200)
    expect(mockDb.folders.update).toHaveBeenCalledWith(
      FOLDER_ID,
      expect.objectContaining({ position: 2 }),
    )
  })

  it('필드 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/folders/${FOLDER_ID}`, {})
    expect(res.status).toBe(400)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/folders/${FOLDER_ID}`, { name: '수정' }, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 폴더 → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.folders.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', '/api/v1/folders/nonexistent', { name: '수정' })
    expect(res.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/folders/:id', () => {
  it('소유자 → 204', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', `/api/v1/folders/${FOLDER_ID}`)
    expect(res.status).toBe(204)
    expect(mockDb.folders.delete).toHaveBeenCalledWith(FOLDER_ID)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', `/api/v1/folders/${FOLDER_ID}`, undefined, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 폴더 → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.folders.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', '/api/v1/folders/nonexistent')
    expect(res.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/folders/:id/conversations (대화-폴더 다대다)', () => {
  it('유효한 요청 → 204 + addConversation 호출', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/folders/${FOLDER_ID}/conversations`, {
      conversation_id: CONV_ID,
    })
    expect(res.status).toBe(204)
    expect(mockDb.folders.addConversation).toHaveBeenCalledWith(FOLDER_ID, CONV_ID)
  })

  it('conversation_id 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/folders/${FOLDER_ID}/conversations`, {})
    expect(res.status).toBe(400)
  })

  it('폴더 소유권 체크 — 다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed(
      'POST',
      `/api/v1/folders/${FOLDER_ID}/conversations`,
      { conversation_id: CONV_ID },
      OTHER_USER_ID,
    )
    expect(res.status).toBe(403)
  })

  it('대화 소유권 체크 — 다른 유저 대화 → 403', async () => {
    const mockDb = buildMockDb()
    // 폴더는 USER_ID 소유, 대화는 OTHER_USER_ID 소유
    mockDb.conversations.findById.mockResolvedValue({ ...makeConversation(), user_id: OTHER_USER_ID })
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/folders/${FOLDER_ID}/conversations`, {
      conversation_id: CONV_ID,
    })
    expect(res.status).toBe(403)
  })

  it('하나의 대화를 여러 폴더에 추가 가능', async () => {
    const FOLDER_ID_2 = 'folder-uuid-2'
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    // 첫 번째 폴더에 추가
    const res1 = await authed('POST', `/api/v1/folders/${FOLDER_ID}/conversations`, {
      conversation_id: CONV_ID,
    })
    // 두 번째 폴더에 추가 (findById가 다른 폴더 반환하도록 mock 갱신)
    mockDb.folders.findById.mockResolvedValue({ ...makeFolder(), id: FOLDER_ID_2 })
    const res2 = await authed('POST', `/api/v1/folders/${FOLDER_ID_2}/conversations`, {
      conversation_id: CONV_ID,
    })

    expect(res1.status).toBe(204)
    expect(res2.status).toBe(204)
    expect(mockDb.folders.addConversation).toHaveBeenCalledTimes(2)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/folders/:id/conversations/:convId', () => {
  it('소유자 → 204 + removeConversation 호출', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', `/api/v1/folders/${FOLDER_ID}/conversations/${CONV_ID}`)
    expect(res.status).toBe(204)
    expect(mockDb.folders.removeConversation).toHaveBeenCalledWith(FOLDER_ID, CONV_ID)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed(
      'DELETE',
      `/api/v1/folders/${FOLDER_ID}/conversations/${CONV_ID}`,
      undefined,
      OTHER_USER_ID,
    )
    expect(res.status).toBe(403)
  })
})
