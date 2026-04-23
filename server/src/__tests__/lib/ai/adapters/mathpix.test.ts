import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MathpixAdapter } from '../../../../lib/ai/adapters/mathpix.js'

const IMAGE_URI = 'data:image/jpeg;base64,/9j/4AAQ...'

const baseParams = {
  messages: [{ role: 'user' as const, content: IMAGE_URI }],
  model: 'mathpix-ocr-v3',
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

describe('MathpixAdapter', () => {
  const adapter = new MathpixAdapter('test-app-id', 'test-app-key')

  it('valid response → UnifiedLLMResponse parsed correctly', async () => {
    mockFetch(200, { text: '\\frac{x^2}{4} = 1', confidence: 0.97 })

    const res = await adapter.generate(baseParams)

    expect(res.content).toBe('\\frac{x^2}{4} = 1')
    expect(res.structuredOutput).toEqual({ text: '\\frac{x^2}{4} = 1', confidence: 0.97 })
    expect(res.usage.inputTokens).toBe(0)
    expect(res.usage.outputTokens).toBe(0)
    expect(res.cost.provider).toBe('mathpix')
    expect(res.cost.amountUsd).toBe(0.004)
    expect(res.metadata.finishReason).toBe('stop')
  })

  it('sends image data in src field with correct headers', async () => {
    const spy = mockFetch(200, { text: 'x = 2', confidence: 0.95 })

    await adapter.generate(baseParams)

    const [url, init] = spy.mock.calls[0]
    expect(url).toBe('https://api.mathpix.com/v3/text')
    const headers = init?.headers as Record<string, string>
    expect(headers['app_id']).toBe('test-app-id')
    expect(headers['app_key']).toBe('test-app-key')

    const body = JSON.parse(init?.body as string)
    expect(body.src).toBe(IMAGE_URI)
    expect(body.formats).toContain('text')
    expect(body.ocr).toContain('math')
  })

  it('no image data in messages → LLMError invalid_response', async () => {
    await expect(
      adapter.generate({ messages: [], model: 'mathpix-ocr-v3' }),
    ).rejects.toMatchObject({
      code: 'invalid_response',
      provider: 'mathpix',
    })
  })

  it('API-level error field in response → LLMError invalid_response', async () => {
    mockFetch(200, { error: 'image_not_supported', text: '', confidence: 0 })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'invalid_response',
      provider: 'mathpix',
    })
  })

  it('401 → LLMError auth', async () => {
    mockFetch(401, { error: 'Invalid credentials' })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'auth',
      retryable: false,
    })
  })

  it('429 → LLMError rate_limit', async () => {
    mockFetch(429, { error: 'Rate limit exceeded' })

    await expect(adapter.generate(baseParams)).rejects.toMatchObject({
      code: 'rate_limit',
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
})
