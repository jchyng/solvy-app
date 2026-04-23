import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenRouterAdapter } from '../../../../lib/ai/adapters/openrouter.js'
import { LLMError } from '../../../../lib/ai/types.js'

const baseParams = {
  messages: [{ role: 'user' as const, content: 'Solve x^2 = 4' }],
  model: 'deepseek/deepseek-r1',
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

describe('OpenRouterAdapter', () => {
  const adapter = new OpenRouterAdapter('test-key')

  it('valid response → UnifiedLLMResponse parsed correctly', async () => {
    mockFetch(200, {
      choices: [{ message: { role: 'assistant', content: 'x = ±2' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 120, completion_tokens: 40 },
      model: 'deepseek/deepseek-r1',
    })

    const res = await adapter.generate(baseParams)

    expect(res.content).toBe('x = ±2')
    expect(res.usage.inputTokens).toBe(120)
    expect(res.usage.outputTokens).toBe(40)
    expect(res.cost.provider).toBe('openrouter')
    expect(res.cost.model).toBe('deepseek/deepseek-r1')
    expect(res.metadata.finishReason).toBe('stop')
  })

  it('JSON response body → structuredOutput populated', async () => {
    mockFetch(200, {
      choices: [{ message: { role: 'assistant', content: '{"answer":"x=2"}' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
      model: 'deepseek/deepseek-r1',
    })

    const res = await adapter.generate(baseParams)
    expect(res.structuredOutput).toEqual({ answer: 'x=2' })
  })

  it('systemPrompt is prepended as system role message', async () => {
    const spy = mockFetch(200, {
      choices: [{ message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
      model: 'deepseek/deepseek-r1',
    })

    await adapter.generate(baseParams)

    const [, init] = spy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are a math tutor.' })
  })

  it('finish_reason "length" → finishReason "length"', async () => {
    mockFetch(200, {
      choices: [{ message: { role: 'assistant', content: 'cut off' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 10, completion_tokens: 4096 },
      model: 'deepseek/deepseek-r1',
    })

    const res = await adapter.generate(baseParams)
    expect(res.metadata.finishReason).toBe('length')
  })

  it('401 → LLMError auth', async () => {
    mockFetch(401, { error: { message: 'Invalid API key' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'auth',
      provider: 'openrouter',
      retryable: false,
    })
  })

  it('429 → LLMError rate_limit', async () => {
    mockFetch(429, { error: { message: 'Rate limit exceeded' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'rate_limit',
      retryable: true,
    })
  })

  it('500 → LLMError unknown (retryable)', async () => {
    mockFetch(500, { error: { message: 'Internal error' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'unknown',
      retryable: true,
    })
  })

  it('no choices in response → LLMError invalid_response', async () => {
    mockFetch(200, {
      choices: [],
      usage: { prompt_tokens: 10, completion_tokens: 0 },
      model: 'deepseek/deepseek-r1',
    })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'invalid_response',
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

  it('cost calculation for deepseek-r1', async () => {
    mockFetch(200, {
      choices: [{ message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
      model: 'deepseek/deepseek-r1',
    })

    const res = await adapter.generate(baseParams)
    // $0.55 input + $2.19 output = $2.74 per 1M each
    expect(res.cost.amountUsd).toBeCloseTo(2.74, 5)
  })
})
