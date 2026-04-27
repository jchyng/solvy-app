import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkErrorRateAndAlert, checkAbuserAndAlert } from '../../lib/alerts.js'
import type { DbClient } from '../../lib/db/client.js'
import type { Bindings } from '../../types/env.js'

const WEBHOOK_URL = 'https://hooks.slack.com/test'

function makeEnv(withWebhook = true): Pick<Bindings, 'SLACK_WEBHOOK_URL'> {
  return { SLACK_WEBHOOK_URL: withWebhook ? WEBHOOK_URL : undefined }
}

function makeDbForErrorRate(total: number, errors: number): Pick<DbClient, 'usageEvents'> {
  return {
    usageEvents: {
      sumCostToday: vi.fn(),
      errorRateLast10Min: vi.fn().mockResolvedValue({ total, errors }),
      topUsersByCallsToday: vi.fn(),
    },
  }
}

function makeDbForAbuser(
  rows: Array<{ userId: string; count: number }>,
): Pick<DbClient, 'usageEvents'> {
  return {
    usageEvents: {
      sumCostToday: vi.fn(),
      errorRateLast10Min: vi.fn(),
      topUsersByCallsToday: vi.fn().mockResolvedValue(rows),
    },
  }
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

// ─── 에러율 알림 ───────────────────────────────────────────────────────────────

describe('checkErrorRateAndAlert', () => {
  it('에러율 4% (>3%) + webhook → Slack POST 호출', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv() as Bindings,
      makeDbForErrorRate(100, 4) as DbClient,
    )

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(WEBHOOK_URL, expect.objectContaining({ method: 'POST' }))
  })

  it('에러율 4% → 메시지에 에러율 포함', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv() as Bindings,
      makeDbForErrorRate(100, 4) as DbClient,
    )

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body) as { text: string }
    expect(body.text).toContain('4.0%')
  })

  it('에러율 3% (임계값과 동일) → Slack 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv() as Bindings,
      makeDbForErrorRate(100, 3) as DbClient,
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('에러율 2% (<3%) → Slack 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv() as Bindings,
      makeDbForErrorRate(100, 2) as DbClient,
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('total < 10 → 데이터 부족으로 Slack 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv() as Bindings,
      makeDbForErrorRate(9, 9) as DbClient,  // 100% error rate but only 9 samples
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('SLACK_WEBHOOK_URL 없음 → 에러율 초과해도 fetch 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    await checkErrorRateAndAlert(
      makeEnv(false) as Bindings,
      makeDbForErrorRate(100, 10) as DbClient,
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })
})

// ─── 어뷰저 감지 알림 ─────────────────────────────────────────────────────────

describe('checkAbuserAndAlert', () => {
  it('사용자 < 10명 → 통계 미형성으로 Slack 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const rows = Array.from({ length: 9 }, (_, i) => ({ userId: `u${i}`, count: 100 }))
    await checkAbuserAndAlert(makeEnv() as Bindings, makeDbForAbuser(rows) as DbClient)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('모든 사용자 균등 사용 → 어뷰저 없음', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const rows = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, count: 10 }))
    await checkAbuserAndAlert(makeEnv() as Bindings, makeDbForAbuser(rows) as DbClient)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('한 사용자가 평균+3σ 초과 → Slack 알림', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    // 19명이 10콜, 1명이 1000콜 → 명확한 이상치
    const rows = [
      ...Array.from({ length: 19 }, (_, i) => ({ userId: `u${i}`, count: 10 })),
      { userId: 'abuser', count: 1000 },
    ]
    await checkAbuserAndAlert(makeEnv() as Bindings, makeDbForAbuser(rows) as DbClient)

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(WEBHOOK_URL, expect.objectContaining({ method: 'POST' }))
  })

  it('어뷰저 감지 → Slack 메시지에 감지된 인원 수 포함', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    // 28명 정상(count=1) + 2명 이상치(count=100): f=2/30≈0.067<0.1이므로 둘 다 mean+3σ 초과
    const rows = [
      ...Array.from({ length: 28 }, (_, i) => ({ userId: `u${i}`, count: 1 })),
      { userId: 'abuser1', count: 100 },
      { userId: 'abuser2', count: 100 },
    ]
    await checkAbuserAndAlert(makeEnv() as Bindings, makeDbForAbuser(rows) as DbClient)

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body) as { text: string }
    expect(body.text).toContain('2명')
  })

  it('SLACK_WEBHOOK_URL 없음 → 어뷰저 감지해도 fetch 호출 안 됨', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const rows = [
      ...Array.from({ length: 19 }, (_, i) => ({ userId: `u${i}`, count: 10 })),
      { userId: 'abuser', count: 1000 },
    ]
    await checkAbuserAndAlert(makeEnv(false) as Bindings, makeDbForAbuser(rows) as DbClient)

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
