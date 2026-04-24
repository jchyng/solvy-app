import { describe, it, expect, vi } from 'vitest'
import { nameNoteRole } from '../../../../lib/ai/roles/nameNote.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(content: string): UnifiedLLMResponse {
  return {
    content,
    usage: { inputTokens: 50, outputTokens: 10 },
    cost: { amountUsd: 0.001, provider: 'gemini', model: 'gemini-1.5-flash' },
    metadata: { latencyMs: 200, finishReason: 'stop' },
  }
}

function makeDeps(generate: LLMAdapter['generate']): RouterDeps {
  return {
    adapters: { gemini: { provider: 'gemini', generate } },
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
  }
}

const sampleAnalysis = {
  intent: '이차방정식의 근 판별 능력을 측정한다.',
  concepts: ['이차방정식', '판별식'],
  optimal_solution: { steps: [{ title: '판별식 계산', detail: 'D = b² - 4ac' }] },
  exam_tips: [],
  follow_up_questions: [],
  confidence: 0.95,
}

describe('nameNoteRole', () => {
  it('유효한 JSON 응답 → title 반환', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ title: '이차방정식 판별식' }))),
    )
    const result = await nameNoteRole({ analysisResult: sampleAnalysis }, deps)
    expect(result).toBe('이차방정식 판별식')
  })

  it('auto_title이 저장됨 — nameNote 결과가 문자열', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ title: '근의 공식' }))),
    )
    const result = await nameNoteRole({ analysisResult: sampleAnalysis, userId: 'u1', sessionId: 's1' }, deps)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('JSON 파싱 실패 → content 앞 10자를 fallback으로 반환', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse('이차방정식근의공식내용이길다')),
    )
    const result = await nameNoteRole({ analysisResult: sampleAnalysis }, deps)
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('title 필드 없는 JSON → fallback 반환', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ label: '잘못된 필드' }))),
    )
    const result = await nameNoteRole({ analysisResult: sampleAnalysis }, deps)
    expect(typeof result).toBe('string')
  })

  it('빈 title → fallback 반환', async () => {
    const deps = makeDeps(
      vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ title: '   ' }))),
    )
    const result = await nameNoteRole({ analysisResult: sampleAnalysis }, deps)
    expect(typeof result).toBe('string')
  })

  it('analysisResult를 user 메시지에 포함', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ title: '테스트' })))
    const deps = makeDeps(generate)

    await nameNoteRole({ analysisResult: sampleAnalysis }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.messages[0].content).toContain('이차방정식')
  })

  it('jsonMode: true로 호출', async () => {
    const generate = vi.fn().mockResolvedValue(makeResponse(JSON.stringify({ title: '테스트' })))
    const deps = makeDeps(generate)

    await nameNoteRole({ analysisResult: sampleAnalysis }, deps)

    const [callParams] = generate.mock.calls[0]
    expect(callParams.jsonMode).toBe(true)
  })
})
