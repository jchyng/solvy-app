// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
}))

import { useNavigate } from 'react-router-dom'
import FaqPage from '@/pages/FaqPage'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => { root.render(<FaqPage />) })
})

afterEach(() => {
  act(() => { root.unmount() })
  container.remove()
  vi.clearAllMocks()
})

function click(testId: string) {
  act(() => {
    ;(container.querySelector(`[data-testid="${testId}"]`) as HTMLElement).click()
  })
}

describe('FaqPage', () => {
  it('10개 FAQ 항목 렌더링', () => {
    const items = container.querySelectorAll('[data-testid^="faq-item-"]')
    expect(items.length).toBe(10)
  })

  it('초기 상태: 모든 답변 숨김', () => {
    const answers = container.querySelectorAll('[data-testid^="faq-answer-"]')
    expect(answers.length).toBe(0)
  })

  it('토글 클릭 → 답변 표시', () => {
    click('faq-toggle-0')
    expect(container.querySelector('[data-testid="faq-answer-0"]')).not.toBeNull()
  })

  it('열린 항목 재클릭 → 답변 닫힘', () => {
    click('faq-toggle-0')
    click('faq-toggle-0')
    expect(container.querySelector('[data-testid="faq-answer-0"]')).toBeNull()
  })

  it('한 번에 하나만 열림 — 다른 항목 클릭 시 이전 항목 닫힘', () => {
    click('faq-toggle-0')
    expect(container.querySelector('[data-testid="faq-answer-0"]')).not.toBeNull()
    click('faq-toggle-1')
    expect(container.querySelector('[data-testid="faq-answer-0"]')).toBeNull()
    expect(container.querySelector('[data-testid="faq-answer-1"]')).not.toBeNull()
  })

  it('뒤로 버튼 클릭 → navigate(-1) 호출', () => {
    const mockNav = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(mockNav)
    act(() => { root.render(<FaqPage />) })
    click('back-btn')
    expect(mockNav).toHaveBeenCalledWith(-1)
  })
})
