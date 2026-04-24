import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'
import { createDbClient } from '../lib/db/client.js'

type Variables = { userId: string }

const folders = new Hono<{ Bindings: Bindings; Variables: Variables }>()

folders.get('/', async (c) => {
  const userId = c.get('userId')
  const db = createDbClient(c.env)
  const list = await db.folders.list(userId)
  return c.json({ data: list })
})

folders.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ name?: string; color?: string }>()
  if (!body.name?.trim()) throw Errors.badRequest('name 필드가 필요합니다')
  if (!body.color?.trim()) throw Errors.badRequest('color 필드가 필요합니다')

  const db = createDbClient(c.env)
  const folder = await db.folders.create({ userId, name: body.name, color: body.color })
  return c.json(folder, 201)
})

folders.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const body = await c.req.json<{ name?: string; color?: string; position?: number }>()

  if (body.name === undefined && body.color === undefined && body.position === undefined) {
    throw Errors.badRequest('name, color, position 중 하나 이상 필요합니다')
  }

  const db = createDbClient(c.env)
  const folder = await db.folders.findById(id)
  if (!folder) throw Errors.notFound('folder')
  if (folder.user_id !== userId) throw Errors.forbidden()

  const updated = await db.folders.update(id, {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.color !== undefined ? { color: body.color } : {}),
    ...(body.position !== undefined ? { position: body.position } : {}),
  })
  return c.json(updated)
})

folders.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const db = createDbClient(c.env)
  const folder = await db.folders.findById(id)
  if (!folder) throw Errors.notFound('folder')
  if (folder.user_id !== userId) throw Errors.forbidden()

  await db.folders.delete(id)
  return c.body(null, 204)
})

folders.post('/:id/conversations', async (c) => {
  const userId = c.get('userId')
  const { id: folderId } = c.req.param()
  const body = await c.req.json<{ conversation_id?: string }>()
  if (!body.conversation_id) throw Errors.badRequest('conversation_id 필드가 필요합니다')

  const db = createDbClient(c.env)

  const folder = await db.folders.findById(folderId)
  if (!folder) throw Errors.notFound('folder')
  if (folder.user_id !== userId) throw Errors.forbidden()

  const conv = await db.conversations.findById(body.conversation_id)
  if (!conv) throw Errors.notFound('conversation')
  if (conv.user_id !== userId) throw Errors.forbidden()

  await db.folders.addConversation(folderId, body.conversation_id)
  return c.body(null, 204)
})

folders.delete('/:id/conversations/:conversationId', async (c) => {
  const userId = c.get('userId')
  const { id: folderId, conversationId } = c.req.param()

  const db = createDbClient(c.env)

  const folder = await db.folders.findById(folderId)
  if (!folder) throw Errors.notFound('folder')
  if (folder.user_id !== userId) throw Errors.forbidden()

  await db.folders.removeConversation(folderId, conversationId)
  return c.body(null, 204)
})

export { folders }
