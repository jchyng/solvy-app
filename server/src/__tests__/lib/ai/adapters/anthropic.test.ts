import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AnthropicAdapter } from '../../../../lib/ai/adapters/anthropic.js'
import { LLMError } from '../../../../lib/ai/types.js'

const baseParams = {
  messages: [{ role: 'user' as const, content: 'Solve x^2 = 4' }],
  model: 'claude-sonnet-4-6',
  systemPrompt: 'You are a math tutor.',
}

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

function mockFetchReject(error: Error) {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(error)
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('AnthropicAdapter', () => {
  const adapter = new AnthropicAdapter('test-key')

  it('valid response → UnifiedLLMResponse parsed correctly', async () => {
    mockFetch(200, {
      content: [{ type: 'text', text: 'x = ±2' }],
      usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 20 },
      stop_reason: 'end_turn',
    })

    const res = await adapter.generate(baseParams)

    expect(res.content).toBe('x = ±2')
    expect(res.usage.inputTokens).toBe(100)
    expect(res.usage.outputTokens).toBe(50)
    expect(res.usage.cachedTokens).toBe(20)
    expect(res.cost.provider).toBe('anthropic')
    expect(res.cost.model).toBe('claude-sonnet-4-6')
    expect(res.cost.amountUsd).toBeGreaterThan(0)
    expect(res.metadata.finishReason).toBe('stop')
  })

  it('JSON response body → structuredOutput populated', async () => {
    mockFetch(200, {
      content: [{ type: 'text', text: '{"intent":"test","confidence":0.9}' }],
      usage: { input_tokens: 10, output_tokens: 10 },
      stop_reason: 'end_turn',
    })

    const res = await adapter.generate(baseParams)

    expect(res.structuredOutput).toEqual({ intent: 'test', confidence: 0.9 })
  })

  it('enableCaching=true → anthropic-beta header + cache_control in system', async () => {
    const spy = mockFetch(200, {
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 10, output_tokens: 5 },
      stop_reason: 'end_turn',
    })

    await adapter.generate({ ...baseParams, enableCaching: true })

    const [, init] = spy.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['anthropic-beta']).toBe('prompt-caching-2024-07-31')

    const body = JSON.parse(init?.body as string)
    expect(body.system).toEqual([
      { type: 'text', text: 'You are a math tutor.', cache_control: { type: 'ephemeral' } },
    ])
  })

  it('max_tokens stop_reason → finishReason "length"', async () => {
    mockFetch(200, {
      content: [{ type: 'text', text: 'truncated' }],
      usage: { input_tokens: 10, output_tokens: 4096 },
      stop_reason: 'max_tokens',
    })

    const res = await adapter.generate(baseParams)
    expect(res.metadata.finishReason).toBe('length')
  })

  it('401 → LLMError auth', async () => {
    mockFetch(401, { error: { message: 'Unauthorized' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'auth',
      provider: 'anthropic',
      retryable: false,
    })
  })

  it('429 → LLMError rate_limit (retryable)', async () => {
    mockFetch(429, { error: { message: 'Rate limit' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'rate_limit',
      retryable: true,
    })
  })

  it('500 → LLMError unknown (retryable)', async () => {
    mockFetch(500, { error: { message: 'Server error' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'unknown',
      retryable: true,
    })
  })

  it('network abort → LLMError timeout', async () => {
    const abortError = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    mockFetchReject(abortError)

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'timeout',
      retryable: true,
    })
  })

  it('no text block in content → LLMError invalid_response', async () => {
    mockFetch(200, {
      content: [{ type: 'tool_use', id: 'x' }],
      usage: { input_tokens: 10, output_tokens: 5 },
      stop_reason: 'end_turn',
    })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it('cost calculation is correct for claude-sonnet-4-6', async () => {
    mockFetch(200, {
      content: [{ type: 'text', text: 'ok' }],
      usage: {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      stop_reason: 'end_turn',
    })

    const res = await adapter.generate(baseParams)
    // $3 input + $15 output = $18 per 1M each
    expect(res.cost.amountUsd).toBeCloseTo(18.0, 5)
  })
})
