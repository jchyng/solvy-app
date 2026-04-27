import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'
import { createDbClient } from '../lib/db/client.js'

const waitlist = new Hono<{ Bindings: Bindings }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

waitlist.post('/', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || !EMAIL_RE.test(email)) {
    throw Errors.badRequest('유효한 이메일 주소를 입력해주세요')
  }

  const db = createDbClient(c.env)
  const entry = await db.waitlist.register(email)
  const total = await db.waitlist.count()

  return c.json({ id: entry.id, email: entry.email, position: total }, 201)
})

export { waitlist }
