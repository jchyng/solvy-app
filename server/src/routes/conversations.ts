import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

type Variables = { userId: string }

const conversations = new Hono<{ Bindings: Bindings; Variables: Variables }>()

conversations.get('/', (_c) => { throw Errors.notImplemented() })
conversations.get('/:id', (_c) => { throw Errors.notImplemented() })
conversations.patch('/:id', (_c) => { throw Errors.notImplemented() })
conversations.delete('/:id', (_c) => { throw Errors.notImplemented() })
conversations.get('/:id/messages', (_c) => { throw Errors.notImplemented() })
conversations.post('/:id/messages', (_c) => { throw Errors.notImplemented() })

export { conversations }
