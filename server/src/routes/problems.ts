import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

type Variables = { userId: string }

const problems = new Hono<{ Bindings: Bindings; Variables: Variables }>()

problems.post('/', (_c) => { throw Errors.notImplemented() })
problems.get('/:id', (_c) => { throw Errors.notImplemented() })
problems.get('/:id/status', (_c) => { throw Errors.notImplemented() })

export { problems }
