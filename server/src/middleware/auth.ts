import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

type Variables = { userId: string; userTier: string }

export const authMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const header = c.req.header('Authorization')
    if (!header?.startsWith('Bearer ')) throw Errors.unauthorized()

    const token = header.slice(7)
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256').catch(() => {
      throw Errors.unauthorized()
    })

    if (typeof payload.sub !== 'string') throw Errors.unauthorized()
    c.set('userId', payload.sub)
    c.set('userTier', typeof payload.tier === 'string' ? payload.tier : 'free')
    await next()
  },
)
