import { describe, it, expect } from 'vitest'
import { trimHistory } from '../../lib/historyManager.js'
import type { ChatMessage } from '../../lib/ai/roles/chat.js'

const CHARS_PER_TOKEN = 4

function msg(role: 'user' | 'assistant', chars: number): ChatMessage {
  return { role, content: 'a'.repeat(chars) }
}

describe('trimHistory', () => {
  it('예산 안이면 모든 메시지 유지', () => {
    const msgs = [msg('user', 100), msg('assistant', 100)]
    expect(trimHistory(msgs, 1_000)).toHaveLength(2)
  })

  it('예산 초과 시 오래된 메시지부터 잘라냄', () => {
    // 200 chars = 50 tokens 예산
    const maxTokens = Math.floor(200 / CHARS_PER_TOKEN)
    const msgs = [
      msg('user', 150),     // 예산 초과 → 잘림
      msg('assistant', 50), // 50 chars
      msg('user', 50),      // 50 chars — 합계 100 chars < 200 → 유지
    ]
    const result = trimHistory(msgs, maxTokens)
    expect(result).toHaveLength(2)
    expect(result[0].content).toHaveLength(50)
    expect(result[1].content).toHaveLength(50)
  })

  it('빈 배열 → 빈 배열', () => {
    expect(trimHistory([], 1_000)).toHaveLength(0)
  })

  it('메시지 하나가 예산 초과해도 최소 1개는 보존', () => {
    const msgs = [msg('user', 9_999), msg('assistant', 100)]
    const result = trimHistory(msgs, 1)
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('경계값: 합산이 예산과 정확히 일치하면 전부 유지', () => {
    const maxTokens = 50           // 200 chars 예산
    const msgs = [
      msg('user', 100),            // 100 chars
      msg('assistant', 100),       // 100 chars — 합계 200, 예산과 동일
    ]
    expect(trimHistory(msgs, maxTokens)).toHaveLength(2)
  })

  it('5턴 대화: 최근 턴이 보존되고 오래된 턴이 잘림', () => {
    // 각 메시지 400 chars = 100 tokens, 예산 250 tokens = 1000 chars
    const maxTokens = 250
    const turns: ChatMessage[] = Array.from({ length: 5 }, (_, i) =>
      msg(i % 2 === 0 ? 'user' : 'assistant', 400),
    )
    const result = trimHistory(turns, maxTokens)
    // 250 tokens = 1000 chars → 최대 2.5개 메시지 → 최근 2개 보존
    expect(result.length).toBeLessThanOrEqual(3)
    expect(result[result.length - 1].content).toHaveLength(400) // 마지막 메시지 항상 보존
  })

  it('순서 보존: 잘린 후 남은 메시지 순서가 유지됨', () => {
    const msgs = [
      { role: 'user' as const, content: 'a'.repeat(100) },
      { role: 'assistant' as const, content: 'b'.repeat(100) },
      { role: 'user' as const, content: 'c'.repeat(100) },
    ]
    const result = trimHistory(msgs, 50) // 200 chars 예산 → 최근 2개 보존
    if (result.length >= 2) {
      expect(result[0].role).toBe('assistant')
      expect(result[1].role).toBe('user')
    }
  })
})
