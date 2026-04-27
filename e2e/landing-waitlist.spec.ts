import { test, expect } from '@playwright/test'

test.describe('LandingPage — 대기열 등록', () => {
  test('유효한 이메일 제출 → 성공 메시지 표시', async ({ page }) => {
    await page.route('**/api/v1/waitlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ position: 7 }),
      })
    })

    await page.goto('/')

    await page.getByTestId('waitlist-email-input').fill('test@example.com')
    await page.getByTestId('waitlist-submit').click()

    await expect(page.getByTestId('waitlist-success')).toBeVisible()
    await expect(page.getByTestId('waitlist-success')).toContainText('#7')
  })

  test('API 오류 응답 → 에러 메시지 표시', async ({ page }) => {
    await page.route('**/api/v1/waitlist', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: '이미 등록된 이메일입니다' }),
      })
    })

    await page.goto('/')

    await page.getByTestId('waitlist-email-input').fill('dup@example.com')
    await page.getByTestId('waitlist-submit').click()

    await expect(page.getByTestId('waitlist-error')).toBeVisible()
    await expect(page.getByTestId('waitlist-error')).toContainText('이미 등록된 이메일입니다')
  })
})
