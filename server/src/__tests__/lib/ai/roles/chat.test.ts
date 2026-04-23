import { describe, it, expect, vi } from 'vitest'
import { chatRole } from '../../../../lib/ai/roles/chat.js'
import type { ChatResult } from '../../../../lib/ai/roles/chat.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(structured: unknown): UnifiedLLMResponse {
  return {
    content: JSON.stringify(structured),
    structuredOutput: structured,
    usage: { inputTokens: 200, outputTokens: 300 },
    cost: { amountUsd: 0.007, provider: 'anthropic', model: 'claude-sonnet-4-6' },
    metadata: { latencyMs: 600, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { anthropic: { provider: 'anthropic', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

const validResult: ChatResult = {
  answer: '힌트를 드릴게요. 먼저 판별식을 계산해보세요.',
  follow_up_questions: [{ id: 'Q1', label: '판별식이 뭔가요?' }],
}

const baseInput = {
  history: [
    { role: 'user' as const, content: '이 문제 어떻게 풀어?' },
    { role: 'assistant' as const, content: '판별식을 먼저 구해요.' },
  ],
  userMessage: '힌트만 줘',
  problemContext: {
    recognizedProblem: 'x² - 5x + 6 = 0',
    optimalSolutionSummary: '근의 공식 사용, x = 2 또는 3',
  },
  userId: 'u1',
  sessionId: 's1',
}

describe('chatRole', () => {
  it('valid response → returns ChatResult', async () => {
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(validResult)))

    const result = await chatRole(baseInput, deps)

    expect(result.answer).toBe(validResult.answer)
    expect(result.follow_up_questions).toHaveLength(1)
  })

  it('follow_up_questions missing → defaults to []', async () => {
    const minimal = { answer: '네, 이렇게 하면 됩니다.' }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(minimal)))

    const result = await chatRole(baseInput, deps)
    expect(result.follow_up_questions).toEqual([])
  })

  it('history is prepended to messages before userMessage', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await chatRole(baseInput, deps)

    const [callParams] = generate.mock.calls[0]
    const messages = callParams.messages
    expect(messages).toHaveLength(3) // 2 history + 1 new
    expect(messages[0].content).toBe('이 문제 어떻게 풀어?')
    expect(messages[2].content).toBe('힌트만 줘')
  })

  it('problemContext is embedded in system prompt', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await chatRole(baseInput, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.systemPrompt).toContain('x² - 5x + 6 = 0')
    expect(callParams.systemPrompt).toContain('근의 공식 사용, x = 2 또는 3')
  })

  it('enableCaching is true', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await chatRole(baseInput, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.enableCaching).toBe(true)
  })

  it('missing answer → throws LLMError invalid_response', async () => {
    const bad = { follow_up_questions: [] }
    const deps = makeDeps(vi.fn().mockResolvedValue(makeResponse(bad)))

    await expect(chatRole(baseInput, deps)).rejects.toMatchObject({
      name: 'LLMError',
      code: 'invalid_response',
    })
  })

  it('empty history → sends only userMessage', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(validResult))
    const deps = makeDeps(generate)

    await chatRole({ ...baseInput, history: [] }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.messages).toHaveLength(1)
    expect(callParams.messages[0].content).toBe('힌트만 줘')
  })
})
