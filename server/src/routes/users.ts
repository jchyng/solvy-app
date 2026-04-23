import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

type Variables = { userId: string }

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>()

users.get('/me', (_c) => { throw Errors.notImplemented() })
users.patch('/me', (_c) => { throw Errors.notImplemented() })

export { users }
