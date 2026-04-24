import { Hono } from 'hono'
import type { Bindings } from '../types/env.js'
import { Errors } from '../lib/errors.js'

const webhooks = new Hono<{ Bindings: Bindings }>()

webhooks.post('/supabase', (_c) => { throw Errors.notImplemented() })

// Toss Payments 웹훅 stub — 베타 중 결제 로직 비활성
// 웹훅 수신 후 로그만 기록하고 DB는 변경하지 않음
webhooks.post('/toss', async (c) => {
  let payload: unknown
  try {
    payload = await c.req.json()
  } catch {
    return c.json({ received: false, error: 'invalid JSON' }, 400)
  }

  // 로그 기록 (베타 후 실제 처리로 교체 예정)
  console.log('[Toss webhook] received', JSON.stringify(payload))

  return c.json({ received: true }, 200)
})

export { webhooks }
