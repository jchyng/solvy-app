import type { Bindings } from '../types/env.js'
import type { DbClient } from './db/client.js'

const DAILY_COST_THRESHOLD_USD = 100

export async function checkDailyCostAndAlert(env: Bindings, db: DbClient): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const totalCost = await db.usageEvents.sumCostToday(today)

  if (totalCost >= DAILY_COST_THRESHOLD_USD && env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Solvy 일일 AI 비용 경보: $${totalCost.toFixed(2)} (임계값: $${DAILY_COST_THRESHOLD_USD})`,
      }),
    })
  }
}
