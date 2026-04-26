import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../index.js'
import type { ProblemSession, Conversation } from '../../lib/db/types.js'
import type { AnalysisResult } from '../../lib/db/types.js'

vi.mock('../../lib/db/client.js')
vi.mock('../../lib/r2.js')
vi.mock('../../lib/ai/index.js')
vi.mock('../../lib/pipeline.js')

import { createDbClient } from '../../lib/db/client.js'
import { createR2Uploader } from '../../lib/r2.js'
import { createAI } from '../../lib/ai/index.js'
import { runAnalysisPipeline, runPipelineFromClassify } from '../../lib/pipeline.js'

const TEST_SECRET = 'test-jwt-secret'
const USER_ID = 'user-abc'
const OTHER_USER_ID = 'user-xyz'
const SESSION_ID = 'sess-uuid-1'
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

const validAnalysis: AnalysisResult = {
  intent: '이차방정식',
  concepts: ['이차방정식'],
  optimal_solution: { steps: [{ title: '풀이', detail: '상세' }] },
  exam_tips: [],
  follow_up_questions: [],
  confidence: 0.95,
}

function makeSession(userId: string, status: ProblemSession['status'] = 'analyzing'): ProblemSession {
  return {
    id: SESSION_ID,
    user_id: userId,
    original_image_url: 'https://r2.test/img.jpg',
    status,
    recognized_problem: null,
    classification: null,
    analysis_result: status === 'done' ? validAnalysis : null,
    created_at: new Date().toISOString(),
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }
}

function makeConversation(): Conversation {
  return {
    id: CONV_ID,
    user_id: USER_ID,
    problem_session_id: SESSION_ID,
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

  if (body instanceof FormData) {
    reqBody = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    reqBody = JSON.stringify(body)
  }

  return app.request(path, { method, headers, body: reqBody }, testEnv as never)
}

function setupMocks(sessionOverrides: Partial<ReturnType<typeof makeSession>> = {}) {
  const session = { ...makeSession(USER_ID), ...sessionOverrides }
  const mockDb = {
    sessions: {
      create: vi.fn().mockResolvedValue(session),
      update: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(session),
    },
    conversations: {
      create: vi.fn().mockResolvedValue(makeConversation()),
      findBySessionId: vi.fn().mockResolvedValue(makeConversation()),
    },
    messages: {
      create: vi.fn().mockResolvedValue({ id: 'msg-1' }),
      listByConversation: vi.fn().mockResolvedValue([]),
    },
  }
  vi.mocked(createDbClient).mockReturnValue(mockDb as never)
  vi.mocked(createR2Uploader).mockReturnValue({
    upload: vi.fn().mockResolvedValue('https://r2.test/img.jpg'),
  })
  vi.mocked(createAI).mockReturnValue({} as never)
  vi.mocked(runAnalysisPipeline).mockResolvedValue(undefined)
  vi.mocked(runPipelineFromClassify).mockResolvedValue(undefined)
  return { mockDb }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockKV.get.mockResolvedValue(null)
  mockKV.put.mockResolvedValue(undefined)
})

describe('POST /api/v1/problems', () => {
  it('유효한 이미지 → 202 + sessionId 반환', async () => {
    setupMocks()
    const form = new FormData()
    form.append('image', new File(['data'], 'test.jpg', { type: 'image/jpeg' }))
    const res = await authed('POST', '/api/v1/problems', form)

    expect(res.status).toBe(202)
    const body = await res.json() as { id: string; status: string }
    expect(body.id).toBe(SESSION_ID)
    expect(body.status).toBe('analyzing')
  })

  it('image 필드 없음 → 400', async () => {
    setupMocks()
    const form = new FormData()
    const res = await authed('POST', '/api/v1/problems', form)
    expect(res.status).toBe(400)
  })

  it('허용되지 않는 MIME(image/gif) → 400', async () => {
    setupMocks()
    const form = new FormData()
    form.append('image', new File(['data'], 'test.gif', { type: 'image/gif' }))
    const res = await authed('POST', '/api/v1/problems', form)
    expect(res.status).toBe(400)
  })

  it('10MB 초과 → 400', async () => {
    setupMocks()
    const form = new FormData()
    const bigBuffer = new Uint8Array(10 * 1024 * 1024 + 1)
    form.append('image', new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' }))
    const res = await authed('POST', '/api/v1/problems', form)
    expect(res.status).toBe(400)
  })

  it('정확히 10MB(경계값) → 202', async () => {
    setupMocks()
    const form = new FormData()
    const boundaryBuffer = new Uint8Array(10 * 1024 * 1024)
    form.append('image', new File([boundaryBuffer], 'boundary.jpg', { type: 'image/jpeg' }))
    const res = await authed('POST', '/api/v1/problems', form)
    expect(res.status).toBe(202)
  })

  it('image/webp → 202', async () => {
    setupMocks()
    const form = new FormData()
    form.append('image', new File(['data'], 'test.webp', { type: 'image/webp' }))
    const res = await authed('POST', '/api/v1/problems', form)
    expect(res.status).toBe(202)
  })

  it('인증 없음 → 401', async () => {
    setupMocks()
    const form = new FormData()
    form.append('image', new File(['data'], 'test.jpg', { type: 'image/jpeg' }))
    const res = await app.request('/api/v1/problems', {
      method: 'POST',
      body: form,
    }, testEnv as never)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/v1/problems/:id', () => {
  it('소유자 → 200 + session + conversation_id', async () => {
    setupMocks()
    const res = await authed('GET', `/api/v1/problems/${SESSION_ID}`)

    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; conversation_id: string }
    expect(body.id).toBe(SESSION_ID)
    expect(body.conversation_id).toBe(CONV_ID)
  })

  it('다른 유저 → 403', async () => {
    setupMocks()
    const res = await authed('GET', `/api/v1/problems/${SESSION_ID}`, undefined, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })

  it('존재하지 않는 id → 404', async () => {
    const { mockDb } = setupMocks()
    mockDb.sessions.findById.mockResolvedValue(null)
    const res = await authed('GET', '/api/v1/problems/nonexistent')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/problems/:id/status', () => {
  it('analyzing 상태 → status만 반환', async () => {
    setupMocks({ status: 'analyzing' })
    const res = await authed('GET', `/api/v1/problems/${SESSION_ID}/status`)

    expect(res.status).toBe(200)
    const body = await res.json() as { status: string; conversationId?: string }
    expect(body.status).toBe('analyzing')
    expect(body.conversationId).toBeUndefined()
  })

  it('done 상태 → conversationId 포함', async () => {
    setupMocks({ status: 'done', analysis_result: validAnalysis, completed_at: new Date().toISOString() })
    const res = await authed('GET', `/api/v1/problems/${SESSION_ID}/status`)

    expect(res.status).toBe(200)
    const body = await res.json() as { status: string; conversationId?: string }
    expect(body.status).toBe('done')
    expect(body.conversationId).toBe(CONV_ID)
  })

  it('다른 유저 → 403', async () => {
    setupMocks()
    const res = await authed('GET', `/api/v1/problems/${SESSION_ID}/status`, undefined, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/problems/:id/confirm', () => {
  it('confirming 상태 + 텍스트 → 202', async () => {
    setupMocks({ status: 'confirming' })
    const res = await authed('POST', `/api/v1/problems/${SESSION_ID}/confirm`, { text: '수정된 텍스트' })

    expect(res.status).toBe(202)
    expect(runPipelineFromClassify).toHaveBeenCalledOnce()
  })

  it('done 상태 → 400', async () => {
    setupMocks({ status: 'done', analysis_result: validAnalysis, completed_at: new Date().toISOString() })
    const res = await authed('POST', `/api/v1/problems/${SESSION_ID}/confirm`, { text: '텍스트' })
    expect(res.status).toBe(400)
  })

  it('text 빈 문자열 → 400', async () => {
    setupMocks({ status: 'confirming' })
    const res = await authed('POST', `/api/v1/problems/${SESSION_ID}/confirm`, { text: '' })
    expect(res.status).toBe(400)
  })

  it('다른 유저 → 403', async () => {
    setupMocks({ status: 'confirming' })
    const res = await authed('POST', `/api/v1/problems/${SESSION_ID}/confirm`, { text: '텍스트' }, OTHER_USER_ID)
    expect(res.status).toBe(403)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/problems/from-text', () => {
  it('유효한 텍스트 → 202 + sessionId 반환', async () => {
    const { mockDb } = setupMocks()
    mockDb.sessions.create.mockResolvedValue({
      ...makeSession(USER_ID, 'analyzing'),
      original_image_url: null,
    })

    const res = await authed('POST', '/api/v1/problems/from-text', {
      text: 'x² - 5x + 6 = 0을 풀어라',
    })

    expect(res.status).toBe(202)
    const body = await res.json() as { id: string; status: string }
    expect(body.id).toBe(SESSION_ID)
    expect(body.status).toBe('analyzing')
  })

  it('original_image_url = null로 세션 생성됨', async () => {
    const { mockDb } = setupMocks()
    mockDb.sessions.create.mockResolvedValue({
      ...makeSession(USER_ID, 'analyzing'),
      original_image_url: null,
    })

    await authed('POST', '/api/v1/problems/from-text', {
      text: '유사 문제 텍스트',
    })

    expect(mockDb.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: null,
        initialStatus: 'analyzing',
      }),
    )
  })

  it('recognised_problem이 텍스트로 초기화됨', async () => {
    const { mockDb } = setupMocks()
    const text = '이차방정식 문제'

    await authed('POST', '/api/v1/problems/from-text', { text })

    expect(mockDb.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRecognizedProblem: { text },
      }),
    )
  })

  it('파이프라인 시작됨 (runPipelineFromClassify 호출)', async () => {
    setupMocks()

    await authed('POST', '/api/v1/problems/from-text', {
      text: '유사 문제입니다',
    })

    expect(runPipelineFromClassify).toHaveBeenCalledOnce()
  })

  it('text 필드 없음 → 400', async () => {
    setupMocks()
    const res = await authed('POST', '/api/v1/problems/from-text', {})
    expect(res.status).toBe(400)
  })

  it('text 빈 문자열 → 400', async () => {
    setupMocks()
    const res = await authed('POST', '/api/v1/problems/from-text', { text: '   ' })
    expect(res.status).toBe(400)
  })

  it('인증 없음 → 401', async () => {
    setupMocks()
    const res = await app.request(
      '/api/v1/problems/from-text',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '문제' }),
      },
      testEnv as never,
    )
    expect(res.status).toBe(401)
  })
})
