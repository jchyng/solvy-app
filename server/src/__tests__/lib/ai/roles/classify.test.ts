import { describe, it, expect, vi } from 'vitest'
import { classifyRole } from '../../../../lib/ai/roles/classify.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(structured: unknown): UnifiedLLMResponse {
  return {
    content: JSON.stringify(structured),
    structuredOutput: structured,
    usage: { inputTokens: 40, outputTokens: 30 },
    cost: { amountUsd: 0.000005, provider: 'gemini', model: 'gemini-1.5-flash' },
    metadata: { latencyMs: 150, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { gemini: { provider: 'gemini', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

describe('classifyRole', () => {
  it('valid response → returns ClassifyResult', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ difficulty: 'medium', concepts: ['이차방정식', '판별식'] })),
    )

    const result = await classifyRole({ recognizedText: 'x² - 5x + 6 = 0' }, deps)

    expect(result.difficulty).toBe('medium')
    expect(result.concepts).toEqual(['이차방정식', '판별식'])
  })

  it.each(['easy', 'medium', 'hard'])('difficulty "%s" → accepted', async (difficulty) => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ difficulty, concepts: ['수학'] })),
    )

    const result = await classifyRole({ recognizedText: 'x=1' }, deps)
    expect(result.difficulty).toBe(difficulty)
  })

  it('invalid difficulty → throws LLMError invalid_response', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ difficulty: 'very_hard', concepts: ['A'] })),
    )

    await expect(classifyRole({ recognizedText: 'x=1' }, deps)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'invalid_response',
    })
  })

  it('concepts not an array → throws LLMError invalid_response', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ difficulty: 'easy', concepts: '이차방정식' })),
    )

    await expect(classifyRole({ recognizedText: 'x=1' }, deps)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('structuredOutput null → throws LLMError invalid_response', async () => {
    const res: UnifiedLLMResponse = {
      content: 'not json',
      structuredOutput: undefined,
      usage: { inputTokens: 10, outputTokens: 10 },
      cost: { amountUsd: 0, provider: 'gemini', model: 'gemini-1.5-flash' },
      metadata: { latencyMs: 100, finishReason: 'stop' },
    }
    const deps = makeDeps(vi.fn().mockResolvedValue(res))

    await expect(classifyRole({ recognizedText: 'x=1' }, deps)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('recognizedText is included in user message', async () => {
    const generate = vi.fn().mockResolvedValue(
      makeResponse({ difficulty: 'hard', concepts: ['적분'] }),
    )
    const deps = makeDeps(generate)

    await classifyRole({ recognizedText: '∫x²dx = x³/3 + C' }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.messages[0].content).toContain('∫x²dx = x³/3 + C')
  })
})
