// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import PricingPage from '@/pages/PricingPage'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => { root.unmount() })
  container.remove()
  vi.clearAllMocks()
})

describe('PricingPage', () => {
  it('Free 플랜 렌더링', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-free"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="plan-free"]')?.textContent).toContain('Free')
  })

  it('Light 플랜 렌더링', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-light"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="plan-light"]')?.textContent).toContain('Light')
  })

  it('Pro 플랜 렌더링', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-pro"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="plan-pro"]')?.textContent).toContain('Pro')
  })

  it('3개 플랜 모두 존재', async () => {
    await act(async () => { root.render(<PricingPage />) })
    const planList = container.querySelector('[data-testid="plan-list"]')
    expect(planList?.children.length).toBe(3)
  })

  it('"베타 기간 무료" 뱃지 표시', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="beta-badge"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="beta-badge"]')?.textContent).toContain('베타 기간 무료')
  })

  it('Free 플랜 가격 플레이스홀더 표시', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-free"]')?.textContent).toContain('0원')
  })

  it('Light 플랜 가격 플레이스홀더 표시', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-light"]')?.textContent).toContain('4,900원')
  })

  it('Pro 플랜 가격 플레이스홀더 표시', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-pro"]')?.textContent).toContain('9,900원')
  })

  it('Founding Member 링크 존재', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="founding-member-link"]')).not.toBeNull()
  })

  it('각 플랜에 CTA 버튼 존재', async () => {
    await act(async () => { root.render(<PricingPage />) })
    expect(container.querySelector('[data-testid="plan-cta-free"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="plan-cta-light"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="plan-cta-pro"]')).not.toBeNull()
  })
})
