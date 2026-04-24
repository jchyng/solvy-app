import { describe, it, expect, vi } from 'vitest'
import { generateSimilarRole } from '../../../../lib/ai/roles/generateSimilar.js'
import type { SimilarProblemResult } from '../../../../lib/ai/roles/generateSimilar.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(structured: unknown): UnifiedLLMResponse {
  return {
    content: JSON.stringify(structured),
    structuredOutput: structured,
    usage: { inputTokens: 1200, outputTokens: 900 },
    cost: { amountUsd: 0.001, provider: 'openrouter', model: 'deepseek/deepseek-chat' },
    metadata: { latencyMs: 800, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { openrouter: { provider: 'openrouter', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

const validResult: SimilarProblemResult = {
  type: 'similar_problem',
  problem: '다음 이차방정식을 풀어라: x² - 7x + 12 = 0',
  answer: 'x = 3 또는 x = 4',
  solution: '## 풀이\n1. 인수분해: (x - 3)(x - 4) = 0\n2. x = 3 또는 x = 4',
  difficulty: 'same',
}

const baseInput = {
  difficulty: 'same' as const,
  problemContext: {
    recognizedProblem: 'x² - 5x + 6 = 0',
    concepts: ['이차방정식', '인수분해'],
    optimalSolutionSummary: '인수분해 사용',
  },
  userId: 'u1',
  sessionId: 's1',
}

describe('generateSimilarRole', () => {
  it('valid response → SimilarProblemResult 반환', async () => {
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(validResult)))

    const result = await generateSimilarRole(baseInput, deps)

    expect(result.type).toBe('similar_problem')
    expect(typeof result.problem).toBe('string')
    expect(typeof result.answer).toBe('string')
    expect(typeof result.solution).toBe('string')
    expect(result.difficulty).toBe('same')
  })

  it('difficulty 3가지 분기 — same / up / down 각각 호출 가능', async () => {
    for (const difficulty of ['same', 'up', 'down'] as const) {
      const generate = vi.fn().mockResolvedValue(makeResponse({ ...validResult, difficulty }))
      const deps = makeDeps(generate)

      const result = await generateSimilarRole({ ...baseInput, difficulty }, deps)
      expect(result.difficulty).toBe(difficulty)
    }
  })

  it('systemPrompt에 원본 문제와 개념이 포함됨', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await generateSimilarRole(baseInput, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.systemPrompt).toContain('x² - 5x + 6 = 0')
    expect(callParams.systemPrompt).toContain('이차방정식')
    expect(callParams.systemPrompt).toContain('인수분해')
  })

  it('난이도별 systemPrompt 지시 차이 확인 — up vs down', async () => {
    const generateUp = vi.fn().mockResolvedValue(makeResponse({ ...validResult, difficulty: 'up' }))
    const generateDown = vi.fn().mockResolvedValue(makeResponse({ ...validResult, difficulty: 'down' }))

    await generateSimilarRole({ ...baseInput, difficulty: 'up' }, makeDeps(generateUp))
    await generateSimilarRole({ ...baseInput, difficulty: 'down' }, makeDeps(generateDown))

    const promptUp = generateUp.mock.calls[0][0].systemPrompt as string
    const promptDown = generateDown.mock.calls[0][0].systemPrompt as string

    expect(promptUp).not.toBe(promptDown)
    expect(promptUp).toContain('한 단계 위')
    expect(promptDown).toContain('한 단계 아래')
  })

  it('problem 필드 없음 → LLMError invalid_response', async () => {
    const bad = { answer: '3', solution: '풀이' }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(bad)))

    await expect(generateSimilarRole(baseInput, deps)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'invalid_response',
    })
  })

  it('answer 필드 없음 → LLMError invalid_response', async () => {
    const bad = { problem: '문제', solution: '풀이' }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(bad)))

    await expect(generateSimilarRole(baseInput, deps)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'invalid_response',
    })
  })

  it('difficulty 응답 없으면 input difficulty를 폴백으로 사용', async () => {
    const nodifficulty = { problem: '문제', answer: '답', solution: '풀이' }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(nodifficulty)))

    const result = await generateSimilarRole({ ...baseInput, difficulty: 'up' }, deps)
    expect(result.difficulty).toBe('up')
  })

  it('jsonMode가 true로 설정됨', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await generateSimilarRole(baseInput, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.jsonMode).toBe(true)
  })

  it('개념 목록이 비어있어도 동작', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    const result = await generateSimilarRole(
      { ...baseInput, problemContext: { ...baseInput.problemContext, concepts: [] } },
      deps,
    )
    expect(result.type).toBe('similar_problem')
  })
})
