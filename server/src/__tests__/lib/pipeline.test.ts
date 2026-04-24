import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runAnalysisPipeline, runPipelineFromClassify } from '../../lib/pipeline.js'
import type { AI } from '../../lib/ai/index.js'
import type { DbClient } from '../../lib/db/client.js'
import type { AnalysisResult } from '../../lib/db/types.js'

const SESSION_ID = 'sess-1'
const IMAGE_URL = 'https://r2.test/image.jpg'
const USER_ID = 'user-1'

const validAnalysis: AnalysisResult = {
  intent: '이차방정식 근 구하기',
  concepts: ['이차방정식', '인수분해'],
  optimal_solution: { steps: [{ title: '인수분해', detail: '(x+2)(x-3)=0' }] },
  exam_tips: ['부호 확인'],
  follow_up_questions: [{ id: 'q1', label: '다른 풀이?' }],
  confidence: 0.95,
}

function makeAI(overrides: Partial<AI> = {}): AI {
  return {
    ocrPrinted: vi.fn().mockResolvedValue({ text: '문제 텍스트', confidence: 0.9 }),
    classify: vi.fn().mockResolvedValue({ difficulty: 'medium', concepts: ['이차방정식'] }),
    analyze: vi.fn().mockResolvedValue(validAnalysis),
    chat: vi.fn(),
    ocrHandwriting: vi.fn(),
    generateSimilar: vi.fn(),
    nameNote: vi.fn(),
    ...overrides,
  } as unknown as AI
}

function makeDb(): { db: DbClient; mocks: Record<string, ReturnType<typeof vi.fn>> } {
  const updateSession = vi.fn().mockResolvedValue(undefined)
  const createConversation = vi.fn().mockResolvedValue({ id: 'conv-1', problem_session_id: SESSION_ID })
  const updateConversation = vi.fn().mockResolvedValue({ id: 'conv-1' })
  const createMessage = vi.fn().mockResolvedValue({ id: 'msg-1' })

  const db: DbClient = {
    sessions: {
      create: vi.fn(),
      update: updateSession,
      findById: vi.fn(),
    },
    conversations: {
      create: createConversation,
      findBySessionId: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      update: updateConversation,
      updateLastMessageAt: vi.fn(),
    },
    messages: {
      create: createMessage,
      listByConversation: vi.fn(),
      findByIdempotencyKey: vi.fn(),
    },
    folders: {
      create: vi.fn(),
      list: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      addConversation: vi.fn(),
      removeConversation: vi.fn(),
      listConversations: vi.fn(),
    },
  }

  return { db, mocks: { updateSession, createConversation, updateConversation, createMessage } }
}

describe('runAnalysisPipeline', () => {
  beforeEach(() => vi.clearAllMocks())

  it('정상 흐름 → status=done, conversation+message 생성', async () => {
    const ai = makeAI()
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(ai.ocrPrinted).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: IMAGE_URL }))
    expect(ai.classify).toHaveBeenCalledOnce()
    expect(ai.analyze).toHaveBeenCalledOnce()
    expect(mocks.createConversation).toHaveBeenCalledOnce()
    expect(mocks.createMessage).toHaveBeenCalledOnce()

    const lastUpdate = mocks.updateSession.mock.calls.at(-1)?.[1]
    expect(lastUpdate?.status).toBe('done')
    expect(lastUpdate?.analysis_result).toEqual(validAnalysis)
  })

  it('OCR confidence < 0.8 → status=confirming, 파이프라인 중단', async () => {
    const ai = makeAI({
      ocrPrinted: vi.fn().mockResolvedValue({ text: '흐릿한 텍스트', confidence: 0.5 }),
    })
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(ai.classify).not.toHaveBeenCalled()
    expect(ai.analyze).not.toHaveBeenCalled()
    expect(mocks.createConversation).not.toHaveBeenCalled()

    const confirmCall = mocks.updateSession.mock.calls.find(([, d]) => d?.status === 'confirming')
    expect(confirmCall).toBeDefined()
  })

  it('OCR confidence 없음 → 정상 처리 (undefined는 >= 0.8로 간주)', async () => {
    const ai = makeAI({
      ocrPrinted: vi.fn().mockResolvedValue({ text: '텍스트', confidence: undefined }),
    })
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(ai.classify).toHaveBeenCalled()
    expect(mocks.createConversation).toHaveBeenCalled()
  })

  it('analyze confidence < 0.8 → analyze 1회 재호출', async () => {
    const lowAnalysis = { ...validAnalysis, confidence: 0.6 }
    const ai = makeAI({
      analyze: vi.fn()
        .mockResolvedValueOnce(lowAnalysis)
        .mockResolvedValueOnce(validAnalysis),
    })
    const { db } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(ai.analyze).toHaveBeenCalledTimes(2)
  })

  it('analyze 재호출 후에도 낮으면 그 결과로 저장 (무한루프 없음)', async () => {
    const lowAnalysis = { ...validAnalysis, confidence: 0.6 }
    const ai = makeAI({
      analyze: vi.fn().mockResolvedValue(lowAnalysis),
    })
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(ai.analyze).toHaveBeenCalledTimes(2)
    const lastUpdate = mocks.updateSession.mock.calls.at(-1)?.[1]
    expect(lastUpdate?.status).toBe('done')
  })

  it('follow_up_questions 빈 배열 → message 정상 생성', async () => {
    const analysisNoChips = { ...validAnalysis, follow_up_questions: [] }
    const ai = makeAI({ analyze: vi.fn().mockResolvedValue(analysisNoChips) })
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    expect(mocks.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ followUpQuestions: [] }),
    )
  })

  it('AI 실패 → status=error', async () => {
    const ai = makeAI({
      ocrPrinted: vi.fn().mockRejectedValue(new Error('OCR 실패')),
    })
    const { db, mocks } = makeDb()

    await runAnalysisPipeline(SESSION_ID, IMAGE_URL, USER_ID, { ai, db })

    const errorCall = mocks.updateSession.mock.calls.find(([, d]) => d?.status === 'error')
    expect(errorCall).toBeDefined()
  })
})

describe('runPipelineFromClassify', () => {
  beforeEach(() => vi.clearAllMocks())

  it('OCR 호출 없이 classify부터 시작', async () => {
    const ai = makeAI()
    const { db, mocks } = makeDb()

    await runPipelineFromClassify(SESSION_ID, '문제 텍스트', USER_ID, { ai, db })

    expect(ai.ocrPrinted).not.toHaveBeenCalled()
    expect(ai.classify).toHaveBeenCalledWith(
      expect.objectContaining({ recognizedText: '문제 텍스트' }),
    )
    expect(mocks.createConversation).toHaveBeenCalledOnce()
    const lastUpdate = mocks.updateSession.mock.calls.at(-1)?.[1]
    expect(lastUpdate?.status).toBe('done')
  })

  it('classify 실패 → status=error', async () => {
    const ai = makeAI({
      classify: vi.fn().mockRejectedValue(new Error('classify 실패')),
    })
    const { db, mocks } = makeDb()

    await runPipelineFromClassify(SESSION_ID, '텍스트', USER_ID, { ai, db })

    const errorCall = mocks.updateSession.mock.calls.find(([, d]) => d?.status === 'error')
    expect(errorCall).toBeDefined()
  })
})
