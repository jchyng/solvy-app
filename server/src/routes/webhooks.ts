import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

const webhooks = new Hono<{ Bindings: Bindings }>()

webhooks.post('/supabase', (_c) => { throw Errors.notImplemented() })

export { webhooks }
