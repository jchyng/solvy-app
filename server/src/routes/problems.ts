import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'
import { createDbClient } from '../lib/db/client.js'
import { createR2Uploader } from '../lib/r2.js'
import { createAI } from '../lib/ai/index.js'
import { runAnalysisPipeline, runPipelineFromClassify } from '../lib/pipeline.js'

type Variables = { userId: string }

const problems = new Hono<{ Bindings: Bindings; Variables: Variables }>()

problems.post('/', async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.parseBody()
  const file = formData['image']
  if (!(file instanceof File)) throw Errors.badRequest('image 필드가 없거나 파일이 아닙니다')

  const r2 = createR2Uploader(c.env.IMAGES_BUCKET, c.env.IMAGES_PUBLIC_URL)
  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `${userId}/${crypto.randomUUID()}.${ext}`
  const imageUrl = await r2.upload(key, await file.arrayBuffer(), file.type || 'image/jpeg')

  const db = createDbClient(c.env)
  const session = await db.sessions.create({ userId, imageUrl })

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const ai = createAI(c.env, supabase)
  const pipeline = runAnalysisPipeline(session.id, imageUrl, userId, { ai, db })
  try { c.executionCtx.waitUntil(pipeline) } catch { void pipeline }

  return c.json({ id: session.id, status: 'analyzing' }, 202)
})

problems.get('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const session = await db.sessions.findById(id)
  if (!session) throw Errors.notFound('problem')
  if (session.user_id !== userId) throw Errors.forbidden()

  const conversation = await db.conversations.findBySessionId(id)

  return c.json({ ...session, conversation_id: conversation?.id ?? null })
})

problems.get('/:id/status', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const session = await db.sessions.findById(id)
  if (!session) throw Errors.notFound('problem')
  if (session.user_id !== userId) throw Errors.forbidden()

  const result: { status: string; conversationId?: string } = { status: session.status }

  if (session.status === 'done') {
    const conversation = await db.conversations.findBySessionId(id)
    result.conversationId = conversation?.id
  }

  return c.json(result)
})

problems.post('/:id/confirm', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const body = await c.req.json<{ text?: string }>()
  if (typeof body.text !== 'string' || !body.text.trim()) {
    throw Errors.badRequest('text 필드가 필요합니다')
  }

  const db = createDbClient(c.env)
  const session = await db.sessions.findById(id)
  if (!session) throw Errors.notFound('problem')
  if (session.user_id !== userId) throw Errors.forbidden()
  if (session.status !== 'confirming') {
    throw Errors.badRequest(`상태가 confirming이 아닙니다 (현재: ${session.status})`)
  }

  await db.sessions.update(id, {
    recognized_problem: { text: body.text },
    status: 'analyzing',
  })

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const ai = createAI(c.env, supabase)
  const pipeline = runPipelineFromClassify(id, body.text, userId, { ai, db })
  try { c.executionCtx.waitUntil(pipeline) } catch { void pipeline }

  return c.json({ id, status: 'analyzing' }, 202)
})

export { problems }
