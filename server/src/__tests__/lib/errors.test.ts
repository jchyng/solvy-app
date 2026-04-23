import { describe, it, expect } from 'vitest'
import { AppError, Errors } from '../../lib/errors.js'

describe('AppError', () => {
  it('sets name, message, statusCode, code', () => {
    const err = new AppError('test message', 400, 'TEST_CODE')
    expect(err.name).toBe('AppError')
    expect(err.message).toBe('test message')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('TEST_CODE')
    expect(err instanceof Error).toBe(true)
  })
})

describe('Errors factory', () => {
  it('notFound returns 404 NOT_FOUND', () => {
    const err = Errors.notFound('problem')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toContain('problem')
  })

  it('unauthorized returns 401 UNAUTHORIZED', () => {
    const err = Errors.unauthorized()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('forbidden returns 403 FORBIDDEN', () => {
    const err = Errors.forbidden()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('badRequest returns 400 BAD_REQUEST', () => {
    const err = Errors.badRequest('invalid input')
    expect(err.statusCode).toBe(400)
    expect(err.code).toBe('BAD_REQUEST')
    expect(err.message).toBe('invalid input')
  })

  it('tooManyRequests returns 429 RATE_LIMITED', () => {
    const err = Errors.tooManyRequests()
    expect(err.statusCode).toBe(429)
    expect(err.code).toBe('RATE_LIMITED')
  })

  it('notImplemented returns 501 NOT_IMPLEMENTED', () => {
    const err = Errors.notImplemented()
    expect(err.statusCode).toBe(501)
    expect(err.code).toBe('NOT_IMPLEMENTED')
  })

  it('internal returns 500 INTERNAL_ERROR with default message', () => {
    const err = Errors.internal()
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.message).toBe('Internal server error')
  })
})
