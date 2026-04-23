import { describe, it, expect, vi } from 'vitest'
import { ocrPrintedRole } from '../../../../lib/ai/roles/ocrPrinted.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(structured: unknown): UnifiedLLMResponse {
  return {
    content: JSON.stringify(structured),
    structuredOutput: structured,
    usage: { inputTokens: 50, outputTokens: 80 },
    cost: { amountUsd: 0.00001, provider: 'gemini', model: 'gemini-1.5-flash' },
    metadata: { latencyMs: 200, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { gemini: { provider: 'gemini', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

const IMAGE_URL = 'https://example.com/problem.jpg'

describe('ocrPrintedRole', () => {
  it('valid response → returns OcrPrintedResult', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ text: 'x^2 + 2x + 1 = 0', confidence: 0.97 })),
    )

    const result = await ocrPrintedRole({ imageUrl: IMAGE_URL }, deps)

    expect(result.text).toBe('x^2 + 2x + 1 = 0')
    expect(result.confidence).toBe(0.97)
  })

  it('confidence missing → returned as undefined', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse({ text: '2x = 4' })),
    )

    const result = await ocrPrintedRole({ imageUrl: IMAGE_URL }, deps)
    expect(result.text).toBe('2x = 4')
    expect(result.confidence).toBeUndefined()
  })

  it('imageUrl is included in user message', async () => {
    const generate = vi.fn().mockResolvedValue(
      makeResponse({ text: 'x = 1', confidence: 0.9 }),
    )
    const deps = makeDeps(generate)

    await ocrPrintedRole({ imageUrl: IMAGE_URL }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.messages[0].content).toContain(IMAGE_URL)
  })

  it('text field missing → throws LLMError invalid_response', async () => {
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse({ confidence: 0.5 })))

    await expect(ocrPrintedRole({ imageUrl: IMAGE_URL }, deps)).rejects.toMatchObject({
      name: 'LLMError',
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

    await expect(ocrPrintedRole({ imageUrl: IMAGE_URL }, deps)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })
})
