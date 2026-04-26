import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../index.js'
import type { Conversation, Message } from '../../lib/db/types.js'

vi.mock('../../lib/db/client.js')
vi.mock('../../lib/ai/index.js')
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn().mockReturnValue({}) }))

import { createDbClient } from '../../lib/db/client.js'
import { createAI } from '../../lib/ai/index.js'

const TEST_SECRET = 'test-jwt-secret'
const USER_ID = 'user-abc'
const OTHER_USER_ID = 'user-xyz'
const CONV_ID = 'conv-uuid-1'
const MSG_ID_1 = 'msg-uuid-1'
const MSG_ID_2 = 'msg-uuid-2'

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

function makeMessage(
  role: Message['role'],
  id: string,
  opts: Partial<Message> = {},
): Message {
  return {
    id,
    conversation_id: CONV_ID,
    role,
    content: `${role} 메시지`,
    structured_payload: null,
    follow_up_questions: [],
    idempotency_key: null,
    created_at: new Date().toISOString(),
    ...opts,
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

function parseSSEText(text: string): Array<Record<string, unknown>> {
  return text
    .split('\n')
    .filter((l) => l.startsWith('data: '))
    .map((l) => {
      try { return JSON.parse(l.slice(6)) as Record<string, unknown> } catch { return {} }
    })
}

function buildMockDb(overrides: Record<string, unknown> = {}) {
  return {
    sessions: {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
    },
    conversations: {
      create: vi.fn().mockResolvedValue(makeConversation()),
      findBySessionId: vi.fn().mockResolvedValue(makeConversation()),
      findById: vi.fn().mockResolvedValue(makeConversation()),
      list: vi.fn().mockResolvedValue([makeConversation()]),
      update: vi.fn().mockImplementation((_id: string, data: Record<string, unknown>) =>
        Promise.resolve({ ...makeConversation(), ...data }),
      ),
      updateLastMessageAt: vi.fn().mockResolvedValue(undefined),
    },
    messages: {
      create: vi.fn(),
      listByConversation: vi.fn().mockResolvedValue([]),
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    },
    folders: {
      create: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      delete: vi.fn(),
      addConversation: vi.fn().mockResolvedValue(undefined),
      removeConversation: vi.fn().mockResolvedValue(undefined),
      listConversations: vi.fn().mockResolvedValue([]),
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
describe('GET /api/v1/conversations', () => {
  it('인증된 요청 → 200 + 목록', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', '/api/v1/conversations')
    expect(res.status).toBe(200)
    const body = await res.json() as { data: unknown[] }
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('인증 없음 → 401', async () => {
    const res = await app.request('/api/v1/conversations', { method: 'GET' }, testEnv as never)
    expect(res.status).toBe(401)
  })

  it('?favorite=true 필터 → list 호출 시 favorite:true 전달', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    await authed('GET', '/api/v1/conversations?favorite=true')
    expect(mockDb.conversations.list).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ favorite: true }),
    )
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/conversations/:id', () => {
  it('소유자 → 200 + conversation + messages', async () => {
    const mockDb = buildMockDb()
    mockDb.messages.listByConversation.mockResolvedValue([makeMessage('assistant', MSG_ID_1)])
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', `/api/v1/conversations/${CONV_ID}`)
    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; messages: unknown[] }
    expect(body.id).toBe(CONV_ID)
    expect(Array.isArray(body.messages)).toBe(true)
    expect(body.messages).toHaveLength(1)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', `/api/v1/conversations/${CONV_ID}`, undefined, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 id → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.conversations.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', '/api/v1/conversations/nonexistent')
    expect(res.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/conversations/:id/messages', () => {
  const mockAiChat = vi.fn().mockResolvedValue({
    answer: '힌트를 드릴게요. 이차방정식 풀이에서 먼저 인수분해를 시도하세요.',
    follow_up_questions: [{ id: 'Q1', label: '인수분해가 안 되면 어떻게 하나요?' }],
  })

  function setupPostMocks() {
    const mockDb = buildMockDb()
    mockDb.messages.create
      .mockResolvedValueOnce(makeMessage('user', 'msg-user-1', { idempotency_key: 'idem-001' }))
      .mockResolvedValueOnce(makeMessage('assistant', 'msg-ass-1', { content: '힌트를 드릴게요. 이차방정식 풀이에서 먼저 인수분해를 시도하세요.', follow_up_questions: [{ id: 'Q1', label: '인수분해가 안 되면 어떻게 하나요?' }] }))
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    vi.mocked(createAI).mockReturnValue({ chat: mockAiChat } as never)
    return mockDb
  }

  it('유효한 메시지 → 200 SSE with token/done events', async () => {
    setupPostMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-001',
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const text = await res.text()
    const events = parseSSEText(text)
    expect(events.some((e) => e['type'] === 'token')).toBe(true)
    expect(events.some((e) => e['type'] === 'done')).toBe(true)
  })

  it('content 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      idempotency_key: 'idem-001',
    })
    expect(res.status).toBe(400)
  })

  it('idempotency_key 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
    })
    expect(res.status).toBe(400)
  })

  it('다른 유저의 대화방 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed(
      'POST',
      `/api/v1/conversations/${CONV_ID}/messages`,
      { content: '힌트 줘', idempotency_key: 'idem-001' },
      OTHER_USER_ID,
    )
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 대화방 → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.conversations.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/conversations/nonexistent/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-001',
    })
    expect(res.status).toBe(404)
  })

  it('메시지 전송 → user + assistant 2개 저장', async () => {
    const mockDb = setupPostMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-001',
    })
    await res.text() // SSE 스트림 완전 소비 → stream 콜백 완료 보장

    // user 메시지 저장 확인
    expect(mockDb.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user', content: '힌트 줘', idempotencyKey: 'idem-001' }),
    )
    // 총 2회 저장 (user + assistant)
    expect(mockDb.messages.create).toHaveBeenCalledTimes(2)
  })

  it('done 이벤트에 follow_up_questions 포함', async () => {
    setupPostMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-001',
    })

    const text = await res.text()
    const events = parseSSEText(text)
    const doneEvent = events.find((e) => e['type'] === 'done')
    expect(doneEvent).toBeDefined()
    expect(Array.isArray(doneEvent?.['follow_up_questions'])).toBe(true)
  })

  it('last_message_at 업데이트', async () => {
    const mockDb = setupPostMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-001',
    })
    await res.text() // SSE 스트림 완전 소비

    expect(mockDb.conversations.updateLastMessageAt).toHaveBeenCalledWith(CONV_ID)
  })

  it('중복 idempotency_key → 새 메시지 저장 없이 캐시된 응답 반환', async () => {
    const existingUserMsg = makeMessage('user', MSG_ID_1, { idempotency_key: 'idem-dup' })
    const cachedAssistantMsg = makeMessage('assistant', MSG_ID_2, {
      content: '캐시된 응답입니다.',
      follow_up_questions: [{ id: 'Q1', label: '더 알려주세요' }],
    })

    const mockDb = buildMockDb()
    mockDb.messages.findByIdempotencyKey.mockResolvedValue(existingUserMsg)
    mockDb.messages.listByConversation.mockResolvedValue([existingUserMsg, cachedAssistantMsg])
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    vi.mocked(createAI).mockReturnValue({ chat: mockAiChat } as never)

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '힌트 줘',
      idempotency_key: 'idem-dup',
    })

    expect(res.status).toBe(200)
    // 새 메시지 저장 없어야 함
    expect(mockDb.messages.create).not.toHaveBeenCalled()
    // AI 호출 없어야 함
    expect(mockAiChat).not.toHaveBeenCalled()

    const text = await res.text()
    const events = parseSSEText(text)
    expect(events.some((e) => e['type'] === 'done')).toBe(true)
  })

  it('5턴 히스토리 누락·중복 없음', async () => {
    const mockDb = buildMockDb()
    const history: Message[] = Array.from({ length: 5 }, (_, i) =>
      makeMessage(
        i % 2 === 0 ? 'user' : 'assistant',
        `msg-turn-${i}`,
        { content: `메시지 ${i}` },
      ),
    )
    mockDb.messages.listByConversation.mockResolvedValue(history)
    mockDb.messages.create
      .mockResolvedValueOnce(makeMessage('user', 'msg-new-user'))
      .mockResolvedValueOnce(makeMessage('assistant', 'msg-new-ass'))
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    vi.mocked(createAI).mockReturnValue({ chat: mockAiChat } as never)

    await authed('POST', `/api/v1/conversations/${CONV_ID}/messages`, {
      content: '6번째 질문',
      idempotency_key: 'idem-turn-6',
    })

    // chatRole에 전달된 history 확인 — 중복 없음
    const chatCallArg = mockAiChat.mock.calls[0][0] as { history: Array<{ content: string }> }
    const contents = chatCallArg.history.map((m) => m.content)
    const uniqueContents = new Set(contents)
    expect(uniqueContents.size).toBe(contents.length) // 중복 없음
  })

  it('인증 없음 → 401', async () => {
    const res = await app.request(
      `/api/v1/conversations/${CONV_ID}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '힌트', idempotency_key: 'k' }),
      },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/v1/conversations/:id', () => {
  it('is_favorite 토글 → 200 + 업데이트된 conversation', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/conversations/${CONV_ID}`, { is_favorite: true })
    expect(res.status).toBe(200)
    expect(mockDb.conversations.update).toHaveBeenCalledWith(
      CONV_ID,
      expect.objectContaining({ is_favorite: true }),
    )
  })

  it('title 수정 → 200 + update 호출', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/conversations/${CONV_ID}`, { title: '내 제목' })
    expect(res.status).toBe(200)
    expect(mockDb.conversations.update).toHaveBeenCalledWith(
      CONV_ID,
      expect.objectContaining({ title: '내 제목' }),
    )
  })

  it('필드 없음 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/conversations/${CONV_ID}`, {})
    expect(res.status).toBe(400)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', `/api/v1/conversations/${CONV_ID}`, { is_favorite: true }, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 id → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.conversations.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('PATCH', '/api/v1/conversations/nonexistent', { is_favorite: true })
    expect(res.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/conversations/:id (소프트 삭제)', () => {
  it('소유자 → 204 + deleted_at 설정', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', `/api/v1/conversations/${CONV_ID}`)
    expect(res.status).toBe(204)
    expect(mockDb.conversations.update).toHaveBeenCalledWith(
      CONV_ID,
      expect.objectContaining({ deleted_at: expect.any(String) }),
    )
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', `/api/v1/conversations/${CONV_ID}`, undefined, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 id → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.conversations.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('DELETE', '/api/v1/conversations/nonexistent')
    expect(res.status).toBe(404)
  })

  it('삭제된 대화는 목록 조회에서 제외 (list의 is null deleted_at 필터 확인)', async () => {
    const mockDb = buildMockDb()
    // list는 deleted_at IS NULL 필터를 DB 레벨에서 적용 — mock은 빈 배열로 시뮬레이션
    mockDb.conversations.list.mockResolvedValue([])
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('GET', '/api/v1/conversations')
    expect(res.status).toBe(200)
    const body = await res.json() as { data: unknown[] }
    expect(body.data).toHaveLength(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/conversations/:id/similar-problem', () => {
  const mockGenerateSimilar = vi.fn().mockResolvedValue({
    type: 'similar_problem',
    problem: 'x² - 7x + 12 = 0을 풀어라',
    answer: 'x = 3 또는 x = 4',
    solution: '## 풀이\n인수분해: (x-3)(x-4)=0',
    difficulty: 'same',
  })

  const analysisPayload = {
    intent: '이차방정식 풀이',
    concepts: ['이차방정식', '인수분해'],
    optimal_solution: { steps: [{ title: '인수분해', detail: '상세' }] },
    exam_tips: [],
    follow_up_questions: [],
    confidence: 0.95,
  }

  function setupSimilarMocks() {
    const mockDb = buildMockDb()
    mockDb.messages.listByConversation.mockResolvedValue([
      makeMessage('assistant', MSG_ID_1, { structured_payload: analysisPayload }),
    ])
    mockDb.messages.create.mockResolvedValue(
      makeMessage('assistant', 'msg-similar-1', {
        content: 'x² - 7x + 12 = 0을 풀어라',
        structured_payload: {
          type: 'similar_problem',
          problem: 'x² - 7x + 12 = 0을 풀어라',
          answer: 'x = 3 또는 x = 4',
          solution: '풀이',
          difficulty: 'same',
        },
      }),
    )
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)
    vi.mocked(createAI).mockReturnValue({ generateSimilar: mockGenerateSimilar } as never)
    return mockDb
  }

  it('유효한 요청 → 201 + assistant 메시지 반환', async () => {
    setupSimilarMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'same',
    })

    expect(res.status).toBe(201)
    const body = await res.json() as { structured_payload: { type: string } }
    expect(body.structured_payload?.type).toBe('similar_problem')
  })

  it('difficulty = up → generateSimilar에 up 전달', async () => {
    const mockDb = setupSimilarMocks()
    vi.mocked(createAI).mockReturnValue({ generateSimilar: mockGenerateSimilar } as never)

    await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'up',
    })

    expect(mockGenerateSimilar).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'up' }),
    )
    expect(mockDb.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant' }),
    )
  })

  it('difficulty = down → generateSimilar에 down 전달', async () => {
    setupSimilarMocks()

    await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'down',
    })

    expect(mockGenerateSimilar).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'down' }),
    )
  })

  it('difficulty 누락 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {})
    expect(res.status).toBe(400)
  })

  it('잘못된 difficulty 값 → 400', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'extreme',
    })
    expect(res.status).toBe(400)
  })

  it('다른 유저 → 403', async () => {
    const mockDb = buildMockDb()
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed(
      'POST',
      `/api/v1/conversations/${CONV_ID}/similar-problem`,
      { difficulty: 'same' },
      OTHER_USER_ID,
    )
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 대화방 → 404', async () => {
    const mockDb = buildMockDb()
    mockDb.conversations.findById.mockResolvedValue(null)
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    const res = await authed('POST', '/api/v1/conversations/nonexistent/similar-problem', {
      difficulty: 'same',
    })
    expect(res.status).toBe(404)
  })

  it('생성 결과를 assistant 메시지로 저장하고 structured_payload 포함', async () => {
    const mockDb = setupSimilarMocks()

    const res = await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'same',
    })
    await res.json()

    expect(mockDb.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        structuredPayload: expect.objectContaining({ type: 'similar_problem' }),
      }),
    )
  })

  it('생성 후 last_message_at 업데이트', async () => {
    const mockDb = setupSimilarMocks()

    await authed('POST', `/api/v1/conversations/${CONV_ID}/similar-problem`, {
      difficulty: 'same',
    })

    expect(mockDb.conversations.updateLastMessageAt).toHaveBeenCalledWith(CONV_ID)
  })

  it('인증 없음 → 401', async () => {
    const res = await app.request(
      `/api/v1/conversations/${CONV_ID}/similar-problem`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 'same' }),
      },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })
})
