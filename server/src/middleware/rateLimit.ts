import { createMiddleware } from 'hono/factory'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

const LIMITS: Record<string, number> = { free: 30, light: 60, pro: 120 }
const WINDOW_SECONDS = 60

type Variables = { userId: string; userTier: string }

export const rateLimitMiddleware = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const userId = c.get('userId')
    const tier = c.get('userTier') ?? 'free'
    const limit = LIMITS[tier] ?? LIMITS.free
    const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000))
    const key = `rl:${userId}:${window}`

    const raw = await c.env.RATE_LIMIT_KV.get(key)
    const count = raw ? parseInt(raw, 10) : 0

    if (count >= limit) {
      c.header('Retry-After', String(WINDOW_SECONDS - (Date.now() / 1000 % WINDOW_SECONDS)))
      throw Errors.tooManyRequests()
    }

    await c.env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS * 2 })
    await next()
  },
)
