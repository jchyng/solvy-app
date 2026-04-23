import { describe, it, expect, vi } from 'vitest'
import { analyzeRole } from '../../../../lib/ai/roles/analyze.js'
import type { AnalysisResult } from '../../../../lib/ai/roles/analyze.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(structured: unknown): UnifiedLLMResponse {
  return {
    content: JSON.stringify(structured),
    structuredOutput: structured,
    usage: { inputTokens: 100, outputTokens: 200 },
    cost: { amountUsd: 0.005, provider: 'anthropic', model: 'claude-sonnet-4-6' },
    metadata: { latencyMs: 500, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { anthropic: { provider: 'anthropic', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

const validResult: AnalysisResult = {
  intent: '이차방정식의 근 판별 능력을 측정한다.',
  concepts: ['이차방정식', '근의 공식'],
  optimal_solution: {
    steps: [
      { title: '판별식 계산', detail: 'D = b² - 4ac' },
      { title: '근 구하기', detail: 'x = (-b ± √D) / 2a' },
    ],
  },
  exam_tips: ['계수 부호 확인 필수'],
  follow_up_questions: [{ id: 'Q1', label: '다른 풀이 방법도 있나요?' }],
  confidence: 0.95,
}

describe('analyzeRole', () => {
  it('valid response → returns AnalysisResult', async () => {
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(validResult)))

    const result = await analyzeRole(
      { recognizedText: 'x² - 5x + 6 = 0', userId: 'u1', sessionId: 's1' },
      deps,
    )

    expect(result.intent).toBe(validResult.intent)
    expect(result.concepts).toEqual(validResult.concepts)
    expect(result.optimal_solution.steps).toHaveLength(2)
    expect(result.confidence).toBe(0.95)
    expect(result.follow_up_questions).toHaveLength(1)
  })

  it('optional fields missing → defaults to empty arrays', async () => {
    const minimal = {
      intent: '테스트',
      concepts: ['이차방정식'],
      optimal_solution: { steps: [{ title: '풀기', detail: 'x=2' }] },
      confidence: 0.8,
      // exam_tips, follow_up_questions 없음
    }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(minimal)))

    const result = await analyzeRole({ recognizedText: 'x=2' }, deps)

    expect(result.exam_tips).toEqual([])
    expect(result.follow_up_questions).toEqual([])
  })

  it('missing intent → throws LLMError invalid_response', async () => {
    const bad = { concepts: ['A'], optimal_solution: { steps: [] }, confidence: 0.9 }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(bad)))

    await expect(analyzeRole({ recognizedText: 'x=2' }, deps)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'invalid_response',
    })
  })

  it('missing optimal_solution.steps → throws LLMError invalid_response', async () => {
    const bad = { intent: '테스트', concepts: ['A'], optimal_solution: {}, confidence: 0.9 }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(bad)))

    await expect(analyzeRole({ recognizedText: 'x=2' }, deps)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('structuredOutput null → throws LLMError invalid_response', async () => {
    const res: UnifiedLLMResponse = {
      content: 'plain text, not JSON',
      structuredOutput: undefined,
      usage: { inputTokens: 10, outputTokens: 10 },
      cost: { amountUsd: 0.001, provider: 'anthropic', model: 'claude-sonnet-4-6' },
      metadata: { latencyMs: 100, finishReason: 'stop' },
    }
    const deps = makeDeps(vi.fn().mockResolvedValue(res))

    await expect(analyzeRole({ recognizedText: 'x=2' }, deps)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('user message contains recognizedText', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await analyzeRole({ recognizedText: 'x² = 9' }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.messages[0].content).toContain('x² = 9')
  })

  it('enableCaching is true', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await analyzeRole({ recognizedText: 'x=1' }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.enableCaching).toBe(true)
  })
})
