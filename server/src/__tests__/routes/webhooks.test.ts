import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../../index.js'

vi.mock('../../lib/db/client.js')
vi.mock('../../lib/ai/index.js')
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn().mockReturnValue({}) }))

const mockKV = {
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  list: vi.fn(),
  getWithMetadata: vi.fn(),
}

const testEnv = {
  JWT_SECRET: 'test-secret',
  RATE_LIMIT_KV: mockKV,
  ENVIRONMENT: 'development',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'test',
  GEMINI_API_KEY: 'test',
  OPENROUTER_API_KEY: 'test',
  MATHPIX_APP_ID: 'test',
  MATHPIX_APP_KEY: 'test',
  IMAGES_BUCKET: { put: vi.fn() },
  IMAGES_PUBLIC_URL: 'https://r2.test',
  TOSS_PAYMENTS_SECRET_KEY: 'test-toss-secret',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/webhooks/toss (결제 stub)', () => {
  const samplePayload = {
    eventType: 'PAYMENT_STATUS_CHANGED',
    data: {
      paymentKey: 'pay_1234567890',
      orderId: 'order_abc',
      status: 'DONE',
      totalAmount: 9900,
    },
  }

  it('유효한 payload → 200 + received:true', async () => {
    const res = await app.request(
      '/api/v1/webhooks/toss',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      },
      testEnv as never,
    )

    expect(res.status).toBe(200)
    const body = await res.json() as { received: boolean }
    expect(body.received).toBe(true)
  })

  it('DB 변경 없음 — subscriptions 테이블 건드리지 않음', async () => {
    const { createDbClient } = await import('../../lib/db/client.js')
    const mockDb = {
      sessions: { create: vi.fn(), update: vi.fn(), findById: vi.fn() },
      conversations: { create: vi.fn(), update: vi.fn() },
    }
    vi.mocked(createDbClient).mockReturnValue(mockDb as never)

    await app.request(
      '/api/v1/webhooks/toss',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      },
      testEnv as never,
    )

    // DB 클라이언트가 전혀 호출되지 않음
    expect(createDbClient).not.toHaveBeenCalled()
  })

  it('잘못된 JSON → 400 + received:false', async () => {
    const res = await app.request(
      '/api/v1/webhooks/toss',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json{{{',
      },
      testEnv as never,
    )

    expect(res.status).toBe(400)
    const body = await res.json() as { received: boolean }
    expect(body.received).toBe(false)
  })

  it('다양한 eventType 수신 → 모두 200 반환 (로그만)', async () => {
    const eventTypes = ['PAYMENT_STATUS_CHANGED', 'REFUND_STATUS_CHANGED', 'VIRTUAL_ACCOUNT_DEPOSIT']

    for (const eventType of eventTypes) {
      const res = await app.request(
        '/api/v1/webhooks/toss',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, data: {} }),
        },
        testEnv as never,
      )
      expect(res.status).toBe(200)
    }
  })
})
