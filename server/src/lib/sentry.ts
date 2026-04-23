import type { Bindings } from '../types/env.js'

// Sentry Cloudflare Workers SDK uses withSentry() wrapper pattern.
// Full integration in Week 7 hardening sprint.
// For now: no-op placeholder so imports don't break.
export function initSentry(_env: Bindings, _ctx: ExecutionContext): void {
  // TODO Week 7: wrap export default with Sentry.withSentry(...)
}
