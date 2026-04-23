import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

type Variables = { userId: string }

const folders = new Hono<{ Bindings: Bindings; Variables: Variables }>()

folders.get('/', (_c) => { throw Errors.notImplemented() })
folders.post('/', (_c) => { throw Errors.notImplemented() })
folders.patch('/:id', (_c) => { throw Errors.notImplemented() })
folders.delete('/:id', (_c) => { throw Errors.notImplemented() })
folders.post('/:id/conversations', (_c) => { throw Errors.notImplemented() })
folders.delete('/:id/conversations/:conversationId', (_c) => { throw Errors.notImplemented() })

export { folders }
