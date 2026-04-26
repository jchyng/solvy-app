import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDailyCostAndAlert } from '../../lib/costAlert.js'
import type { DbClient } from '../../lib/db/client.js'
import type { Bindings } from '../../types/env.js'

const WEBHOOK_URL = 'https://hooks.slack.com/test'

function makeDb(cost: number): Pick<DbClient, 'usageEvents'> {
  return {
    usageEvents: {
      sumCostToday: vi.fn().mockResolvedValue(cost),
    },
  }
}

function makeEnv(withWebhook = true): Pick<Bindings, 'SLACK_WEBHOOK_URL'> {
  return { SLACK_WEBHOOK_URL: withWebhook ? WEBHOOK_URL : undefined }
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('checkDailyCostAndAlert', () => {
  it('비용 $100 이상 + webhook 설정 → Slack POST 호출', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    await checkDailyCostAndAlert(makeEnv() as Bindings, makeDb(100) as DbClient)

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      WEBHOOK_URL,
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('비용 $150 → Slack 메시지에 금액 포함', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    await checkDailyCostAndAlert(makeEnv() as Bindings, makeDb(150) as DbClient)

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body) as { text: string }
    expect(body.text).toContain('150.00')
  })

  it('비용 $99.99 → Slack 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkDailyCostAndAlert(makeEnv() as Bindings, makeDb(99.99) as DbClient)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('SLACK_WEBHOOK_URL 없음 → 비용 초과해도 fetch 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkDailyCostAndAlert(makeEnv(false) as Bindings, makeDb(200) as DbClient)

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
