import type { Context } from 'hono'
import type { Bindings } from '../types/env.js'
import { AppError } from '../lib/errors.js'

export async function errorHandler(
  err: Error,
  c: Context<{ Bindings: Bindings }>,
): Promise<Response> {
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.statusCode as 400 | 401 | 403 | 404 | 429 | 500 | 501)
  }

  console.error('[unhandled]', err)
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
}
