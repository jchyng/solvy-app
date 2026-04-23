export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  notFound: (resource: string) => new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  unauthorized: () => new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => new AppError('Forbidden', 403, 'FORBIDDEN'),
  badRequest: (msg: string) => new AppError(msg, 400, 'BAD_REQUEST'),
  tooManyRequests: () => new AppError('Rate limit exceeded', 429, 'RATE_LIMITED'),
  notImplemented: () => new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'),
  internal: (msg = 'Internal server error') => new AppError(msg, 500, 'INTERNAL_ERROR'),
}
