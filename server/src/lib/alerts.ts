import type { Bindings } from '../types/env.js'
import type { DbClient } from './db/client.js'

const ERROR_RATE_THRESHOLD = 0.03   // 3%
const MIN_SAMPLE_SIZE = 10          // 최소 샘플 수 미만이면 알림 생략
const ABUSER_SIGMA = 3              // 평균 + 3σ 초과 = 상위 ~0.1%
const MIN_USERS_FOR_STATS = 10      // 통계 형성에 필요한 최소 사용자 수

async function slackAlert(webhookUrl: string, text: string): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

export async function checkErrorRateAndAlert(env: Bindings, db: DbClient): Promise<void> {
  const { total, errors } = await db.usageEvents.errorRateLast10Min()
  if (total < MIN_SAMPLE_SIZE) return
  const rate = errors / total
  if (rate > ERROR_RATE_THRESHOLD && env.SLACK_WEBHOOK_URL) {
    await slackAlert(
      env.SLACK_WEBHOOK_URL,
      `Solvy 에러율 경보: ${(rate * 100).toFixed(1)}% (10분 이동 평균, 임계값: ${ERROR_RATE_THRESHOLD * 100}%)`,
    )
  }
}

export async function checkAbuserAndAlert(env: Bindings, db: DbClient): Promise<void> {
  const date = new Date().toISOString().slice(0, 10)
  const rows = await db.usageEvents.topUsersByCallsToday(date)
  if (rows.length < MIN_USERS_FOR_STATS) return

  const counts = rows.map((r) => r.count)
  const mean = counts.reduce((s, c) => s + c, 0) / counts.length
  const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length
  const threshold = mean + ABUSER_SIGMA * Math.sqrt(variance)

  const abusers = rows.filter((r) => r.count > threshold)
  if (abusers.length > 0 && env.SLACK_WEBHOOK_URL) {
    await slackAlert(
      env.SLACK_WEBHOOK_URL,
      `Solvy 어뷰저 감지: ${abusers.length}명이 일일 상위 0.1% 호출 초과 (임계값: ${threshold.toFixed(0)}회)`,
    )
  }
}
