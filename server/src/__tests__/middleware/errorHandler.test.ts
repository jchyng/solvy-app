import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { errorHandler } from '../../middleware/errorHandler.js'
import type { Bindings } from '../../types/env.js'

function makeApp() {
  const app = new Hono<{ Bindings: Bindings }>()
  app.onError(errorHandler)
  return app
}

describe('errorHandler', () => {
  it('AppError → correct JSON body and status code', async () => {
    const app = makeApp()
    app.get('/test', () => { throw new AppError('not found', 404, 'NOT_FOUND') })

    const res = await app.request('/test')
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string; code: string }
    expect(body.error).toBe('not found')
    expect(body.code).toBe('NOT_FOUND')
  })

  it('unhandled Error → 500 INTERNAL_ERROR', async () => {
    const app = makeApp()
    app.get('/test', () => { throw new Error('something went wrong') })

    const res = await app.request('/test')
    expect(res.status).toBe(500)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INTERNAL_ERROR')
  })
})
