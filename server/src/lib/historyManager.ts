import type { ChatMessage } from './ai/roles/chat.js'

const CHARS_PER_TOKEN = 4
// Phase 1.5에서 요약 압축으로 전환 예정; 현재는 단순 자르기
const DEFAULT_MAX_TOKENS = 8_000

export function trimHistory(messages: ChatMessage[], maxTokens = DEFAULT_MAX_TOKENS): ChatMessage[] {
  const budget = maxTokens * CHARS_PER_TOKEN
  let total = 0
  const result: ChatMessage[] = []

  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messages[i].content.length
    if (total + len > budget && result.length > 0) break
    result.unshift(messages[i])
    total += len
  }

  return result
}
