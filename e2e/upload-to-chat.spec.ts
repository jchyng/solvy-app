import { test, expect } from '@playwright/test'

const E2E_USER = {
  id: 'e2e-user',
  email: 'e2e@solvy.kr',
  name: 'E2E',
  tier: 'free' as const,
  is_beta_tester: true,
}

const CONV_FIXTURE = {
  id: 'conv-1',
  problem_session_id: 'sess-1',
  title: null,
  auto_title: '이차방정식',
  is_favorite: false,
  last_message_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  messages: [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      role: 'system',
      content: '분석 완료',
      structured_payload: {
        intent: '이차방정식의 판별식을 이해하고 활용하는 능력을 평가',
        concepts: ['판별식', '이차방정식'],
        optimal_solution: {
          steps: [{ title: '풀이 단계', detail: 'x^2 - 5x + 6 = 0을 인수분해한다' }],
        },
        exam_tips: ['수능에 자주 출제되는 유형'],
        follow_up_questions: [{ id: 'q1', label: '판별식이 뭔가요?' }],
        confidence: 0.95,
      },
      follow_up_questions: [{ id: 'q1', label: '판별식이 뭔가요?' }],
      created_at: new Date().toISOString(),
    },
  ],
}

test.describe('업로드 → 채팅 골든패스', () => {
  test.beforeEach(async ({ page }) => {
    // E2E 인증 상태 주입 — 페이지 JS 실행 전에 window.__E2E_AUTH 설정
    await page.addInitScript((user) => {
      ;(window as Record<string, unknown>).__E2E_AUTH = { user, token: 'e2e-fake-token' }
    }, E2E_USER)

    // API 라우트 모킹
    await page.route('**/api/v1/problems', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'sess-1' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.route('**/api/v1/problems/sess-1/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'done', conversationId: 'conv-1' }),
      })
    })

    await page.route('**/api/v1/problems/sess-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ analysis_result: null }),
      })
    })

    await page.route('**/api/v1/conversations/conv-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CONV_FIXTURE),
      })
    })
  })

  test('/app 진입 시 UploadView 렌더링', async ({ page }) => {
    await page.goto('/app')
    await expect(page.locator('text=수학 문제 사진을 올려주세요')).toBeVisible()
  })

  test('파일 업로드 → 폴링 → /chat/conv-1 이동', async ({ page }) => {
    await page.goto('/app')

    // 앨범 파일 입력 (capture 속성 없는 두 번째 file input)
    const fileInput = page.locator('input[type="file"]:not([capture])')
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('FAKE_IMAGE_DATA'),
    })

    // 폴링이 완료되면 chat 페이지로 이동 (최대 10초 대기)
    await page.waitForURL('**/chat/conv-1', { timeout: 10000 })
    expect(page.url()).toContain('/chat/conv-1')
  })

  test('채팅 페이지에서 분석 카드 렌더링', async ({ page }) => {
    await page.goto('/app')

    const fileInput = page.locator('input[type="file"]:not([capture])')
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('FAKE_IMAGE_DATA'),
    })

    await page.waitForURL('**/chat/conv-1', { timeout: 10000 })

    // ChatPage가 렌더링됐는지 확인 (AnalysisCard 또는 대화 내용)
    await expect(page.locator('[data-testid="analysis-card"]').or(
      page.locator('text=판별식이 뭔가요?')
    )).toBeVisible({ timeout: 5000 })
  })
})
