import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'
import { problems } from './routes/problems.js'
import { conversations } from './routes/conversations.js'
import { folders } from './routes/folders.js'
import { users } from './routes/users.js'
import { webhooks } from './routes/webhooks.js'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ENVIRONMENT === 'production'
      ? ['https://solvy.kr']
      : ['http://localhost:5173']
    return allowed.includes(origin) ? origin : allowed[0]
  },
  credentials: true,
}))

app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }),
)

const v1 = new Hono<{ Bindings: Bindings; Variables: { userId: string } }>()
v1.use('*', authMiddleware)
v1.use('*', rateLimitMiddleware)
v1.route('/problems', problems)
v1.route('/conversations', conversations)
v1.route('/folders', folders)
v1.route('/users', users)

app.route('/api/v1/webhooks', webhooks)
app.route('/api/v1', v1)

app.onError(errorHandler)

export default app
