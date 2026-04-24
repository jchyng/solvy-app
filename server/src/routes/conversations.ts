import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { createClient } from '@supabase/supabase-js'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'
import { createDbClient } from '../lib/db/client.js'
import { createAI } from '../lib/ai/index.js'
import { trimHistory } from '../lib/historyManager.js'

type Variables = { userId: string }

const conversations = new Hono<{ Bindings: Bindings; Variables: Variables }>()

conversations.get('/', async (c) => {
  const userId = c.get('userId')
  const db = createDbClient(c.env)

  const page = Number(c.req.query('page') ?? 0)
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const favorite = c.req.query('favorite') === 'true' ? true : undefined

  const list = await db.conversations.list(userId, { page, limit, favorite })
  return c.json({ data: list, page, limit })
})

conversations.get('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const conv = await db.conversations.findById(id)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  const messages = await db.messages.listByConversation(id)
  return c.json({ ...conv, messages })
})

conversations.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const body = await c.req.json<{ title?: string | null; is_favorite?: boolean }>()
  if (body.title === undefined && body.is_favorite === undefined) {
    throw Errors.badRequest('title 또는 is_favorite 필드가 필요합니다')
  }

  const db = createDbClient(c.env)
  const conv = await db.conversations.findById(id)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  const updated = await db.conversations.update(id, {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.is_favorite !== undefined ? { is_favorite: body.is_favorite } : {}),
  })
  return c.json(updated)
})

conversations.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const conv = await db.conversations.findById(id)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  await db.conversations.update(id, { deleted_at: new Date().toISOString() })
  return c.body(null, 204)
})

conversations.get('/:id/messages', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const conv = await db.conversations.findById(id)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  const messages = await db.messages.listByConversation(id)
  return c.json(messages)
})

conversations.post('/:id/messages', async (c) => {
  const userId = c.get('userId')
  const { id: convId } = c.req.param()

  const body = await c.req.json<{ content?: string; idempotency_key?: string }>()
  if (!body.content?.trim()) throw Errors.badRequest('content 필드가 필요합니다')
  if (!body.idempotency_key) throw Errors.badRequest('idempotency_key 필드가 필요합니다')

  const db = createDbClient(c.env)

  // 중복 전송 방지: 동일 idempotency_key 존재 시 캐시된 응답 재스트리밍
  const existing = await db.messages.findByIdempotencyKey(convId, body.idempotency_key)
  if (existing) {
    const allMsgs = await db.messages.listByConversation(convId)
    const existingIdx = allMsgs.findIndex((m) => m.id === existing.id)
    const cached = existingIdx >= 0 ? allMsgs[existingIdx + 1] : null

    return streamSSE(c, async (stream) => {
      if (cached && cached.role === 'assistant') {
        await stream.writeSSE({ data: JSON.stringify({ type: 'token', content: cached.content }) })
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'done',
            message_id: cached.id,
            follow_up_questions: cached.follow_up_questions,
          }),
        })
      }
    })
  }

  // 소유권 확인
  const conv = await db.conversations.findById(convId)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  // 히스토리 구성
  const allMessages = await db.messages.listByConversation(convId)
  const chatHistory = allMessages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  const trimmedHistory = trimHistory(chatHistory)

  // 문제 컨텍스트 추출 (첫 assistant 메시지의 structured_payload 활용)
  const firstAssistant = allMessages.find((m) => m.role === 'assistant')
  const payload = firstAssistant?.structured_payload as Record<string, unknown> | null | undefined
  const problemContext = {
    recognizedProblem: typeof payload?.['intent'] === 'string' ? payload['intent'] : '(알 수 없는 문제)',
    optimalSolutionSummary: Array.isArray(payload?.['optimal_solution']
      ? (payload['optimal_solution'] as Record<string, unknown>)['steps']
      : null)
      ? ((payload!['optimal_solution'] as Record<string, unknown>)['steps'] as Array<{ title: string }>)
          .map((s) => s.title)
          .join(', ')
      : '',
  }

  // 유저 메시지 저장 (스트리밍 전에 완료)
  await db.messages.create({
    conversationId: convId,
    role: 'user',
    content: body.content,
    idempotencyKey: body.idempotency_key,
  })

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const ai = createAI(c.env, supabase)

  return streamSSE(c, async (stream) => {
    try {
      const result = await ai.chat({
        history: trimmedHistory,
        userMessage: body.content!,
        problemContext,
        userId,
        sessionId: convId,
      })

      // 단어 단위로 스트리밍 (Phase 1: 완성된 응답을 청크로 분할)
      const tokens = result.answer.match(/\S+|\s+/g) ?? [result.answer]
      for (const token of tokens) {
        await stream.writeSSE({ data: JSON.stringify({ type: 'token', content: token }) })
      }

      const assistantMsg = await db.messages.create({
        conversationId: convId,
        role: 'assistant',
        content: result.answer,
        followUpQuestions: result.follow_up_questions,
      })

      await db.conversations.updateLastMessageAt(convId)

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'done',
          message_id: assistantMsg.id,
          follow_up_questions: result.follow_up_questions,
        }),
      })
    } catch {
      await stream.writeSSE({ data: JSON.stringify({ type: 'error', message: 'AI 응답 오류' }) })
    }
  })
})

// POST /:id/similar-problem
// 구현 방식: 기존 대화의 분석 컨텍스트를 기반으로 AI가 유사 문제를 생성하고
// 결과를 현재 대화의 assistant 메시지로 저장. SSE 불필요(단일 원자 응답).
conversations.post('/:id/similar-problem', async (c) => {
  const userId = c.get('userId')
  const { id: convId } = c.req.param()

  const body = await c.req.json<{ difficulty?: string }>()
  const { difficulty } = body
  if (!difficulty || !['same', 'up', 'down'].includes(difficulty)) {
    throw Errors.badRequest('difficulty 필드는 same | up | down 중 하나여야 합니다')
  }

  const db = createDbClient(c.env)
  const conv = await db.conversations.findById(convId)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  const allMessages = await db.messages.listByConversation(convId)
  const firstAssistant = allMessages.find((m) => m.role === 'assistant')
  const payload = firstAssistant?.structured_payload as Record<string, unknown> | null | undefined

  const problemContext = {
    recognizedProblem:
      typeof payload?.['intent'] === 'string' ? payload['intent'] : '(알 수 없는 문제)',
    concepts: Array.isArray(payload?.['concepts']) ? (payload['concepts'] as string[]) : [],
    optimalSolutionSummary: Array.isArray(
      (payload?.['optimal_solution'] as Record<string, unknown> | undefined)?.['steps'],
    )
      ? (
          (payload!['optimal_solution'] as Record<string, unknown>)[
            'steps'
          ] as Array<{ title: string }>
        )
          .map((s) => s.title)
          .join(', ')
      : '',
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const ai = createAI(c.env, supabase)

  const result = await ai.generateSimilar({
    difficulty: difficulty as 'same' | 'up' | 'down',
    problemContext,
    userId,
    sessionId: convId,
  })

  const message = await db.messages.create({
    conversationId: convId,
    role: 'assistant',
    content: result.problem,
    structuredPayload: result,
  })

  await db.conversations.updateLastMessageAt(convId)

  return c.json(message, 201)
})

export { conversations }
