import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeminiAdapter } from '../../../../lib/ai/adapters/gemini.js'

const baseParams = {
  messages: [{ role: 'user' as const, content: 'Solve x^2 = 4' }],
  model: 'gemini-1.5-flash',
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

describe('GeminiAdapter', () => {
  const adapter = new GeminiAdapter('test-key')

  it('valid response → UnifiedLLMResponse parsed correctly', async () => {
    mockFetch(200, {
      candidates: [
        { content: { parts: [{ text: 'x = ±2' }] }, finishReason: 'STOP' },
      ],
      usageMetadata: { promptTokenCount: 80, candidatesTokenCount: 30 },
    })

    const res = await adapter.generate(baseParams)

    expect(res.content).toBe('x = ±2')
    expect(res.usage.inputTokens).toBe(80)
    expect(res.usage.outputTokens).toBe(30)
    expect(res.cost.provider).toBe('gemini')
    expect(res.cost.model).toBe('gemini-1.5-flash')
    expect(res.metadata.finishReason).toBe('stop')
  })

  it('JSON response → structuredOutput populated', async () => {
    mockFetch(200, {
      candidates: [
        { content: { parts: [{ text: '{"intent":"test"}' }] }, finishReason: 'STOP' },
      ],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 },
    })

    const res = await adapter.generate(baseParams)
    expect(res.structuredOutput).toEqual({ intent: 'test' })
  })

  it('jsonMode=true → responseMimeType in request body', async () => {
    const spy = mockFetch(200, {
      candidates: [{ content: { parts: [{ text: '{}' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 },
    })

    await adapter.generate({ ...baseParams, jsonMode: true })

    const [, init] = spy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body.generationConfig.responseMimeType).toBe('application/json')
  })

  it('systemPrompt → systemInstruction in request body', async () => {
    const spy = mockFetch(200, {
      candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 },
    })

    await adapter.generate(baseParams)

    const [, init] = spy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are a math tutor.' }] })
  })

  it('assistant message → "model" role in request', async () => {
    const spy = mockFetch(200, {
      candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 },
    })

    await adapter.generate({
      ...baseParams,
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'Solve x^2=4' },
      ],
    })

    const [, init] = spy.mock.calls[0]
    const body = JSON.parse(init?.body as string)
    expect(body.contents[1].role).toBe('model')
  })

  it('MAX_TOKENS finishReason → finishReason "length"', async () => {
    mockFetch(200, {
      candidates: [{ content: { parts: [{ text: 'truncated' }] }, finishReason: 'MAX_TOKENS' }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 4096 },
    })

    const res = await adapter.generate(baseParams)
    expect(res.metadata.finishReason).toBe('length')
  })

  it('429 → LLMError rate_limit', async () => {
    mockFetch(429, { error: { message: 'Quota exceeded' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'rate_limit',
      provider: 'gemini',
    })
  })

  it('403 → LLMError auth', async () => {
    mockFetch(403, { error: { message: 'Forbidden' } })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'auth',
      retryable: false,
    })
  })

  it('no candidates → LLMError invalid_response', async () => {
    mockFetch(200, {
      candidates: [],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 0 },
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

  it('cost calculation for gemini-1.5-flash', async () => {
    mockFetch(200, {
      candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 1_000_000, candidatesTokenCount: 1_000_000 },
    })

    const res = await adapter.generate(baseParams)
    // $0.075 input + $0.30 output = $0.375 per 1M each
    expect(res.cost.amountUsd).toBeCloseTo(0.375, 5)
  })
})
