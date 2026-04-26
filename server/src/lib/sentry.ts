import * as Sentry from '@sentry/cloudflare'
import type { Bindings } from '../types/env.js'

export function withSentryWorker<T extends object>(handler: T): T {
  return Sentry.withSentry(
    (env: Bindings) => ({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    }),
    handler as Parameters<typeof Sentry.withSentry>[1],
  ) as T
}
