// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { SimilarProblemCard } from '@/features/similar'
import type { SimilarProblemPayload } from '@/types/api'

vi.mock('@/shared/components/MarkdownView', () => ({
  MarkdownView: ({ content }: { content: string }) => <div data-testid="md">{content}</div>,
}))

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

const samplePayload: SimilarProblemPayload = {
  type: 'similar_problem',
  problem: 'x² - 7x + 12 = 0을 풀어라',
  answer: 'x = 3 또는 x = 4',
  solution: '## 풀이\n인수분해: (x-3)(x-4)=0',
  difficulty: 'same',
}

describe('SimilarProblemCard', () => {
  it('문제 텍스트가 렌더링됨', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    expect(container.querySelector('[data-testid="similar-problem-text"]')?.textContent).toContain(
      'x² - 7x + 12 = 0을 풀어라',
    )
  })

  it('난이도 라벨 표시 — same → "같은 난이도"', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    expect(container.textContent).toContain('같은 난이도')
  })

  it('난이도 라벨 — up', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={{ ...samplePayload, difficulty: 'up' }} />)
    })
    expect(container.textContent).toContain('한 단계 위')
  })

  it('난이도 라벨 — down', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={{ ...samplePayload, difficulty: 'down' }} />)
    })
    expect(container.textContent).toContain('한 단계 아래')
  })

  it('초기 상태에서 답·풀이 숨겨짐', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    expect(container.querySelector('[data-testid="answer-section"]')).toBeNull()
    expect(container.querySelector('[data-testid="solution-section"]')).toBeNull()
  })

  it('답 보기 버튼 클릭 → answer-section 표시', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    const btn = container.querySelector('[data-testid="toggle-answer"]') as HTMLButtonElement
    await act(async () => { btn.click() })
    expect(container.querySelector('[data-testid="answer-section"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="answer-section"]')?.textContent).toContain('x = 3 또는 x = 4')
  })

  it('풀이 보기 버튼 클릭 → solution-section 표시', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    const btn = container.querySelector('[data-testid="toggle-solution"]') as HTMLButtonElement
    await act(async () => { btn.click() })
    expect(container.querySelector('[data-testid="solution-section"]')).not.toBeNull()
  })

  it('답 보기 → 다시 클릭하면 "답 숨기기"로 라벨 변경', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    const btn = container.querySelector('[data-testid="toggle-answer"]') as HTMLButtonElement
    expect(btn.textContent).toBe('답 보기')
    await act(async () => { btn.click() })
    expect(btn.textContent).toBe('답 숨기기')
    await act(async () => { btn.click() })
    expect(btn.textContent).toBe('답 보기')
  })

  it('onStartNewChat prop 없으면 버튼 미노출', async () => {
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} />)
    })
    expect(container.querySelector('[data-testid="start-new-chat"]')).toBeNull()
  })

  it('onStartNewChat prop 있으면 버튼 표시', async () => {
    const onStartNewChat = vi.fn()
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} onStartNewChat={onStartNewChat} />)
    })
    expect(container.querySelector('[data-testid="start-new-chat"]')).not.toBeNull()
  })

  it('새 대화로 시작하기 버튼 클릭 → onStartNewChat(problem) 호출', async () => {
    const onStartNewChat = vi.fn()
    await act(async () => {
      root.render(<SimilarProblemCard payload={samplePayload} onStartNewChat={onStartNewChat} />)
    })
    const btn = container.querySelector('[data-testid="start-new-chat"]') as HTMLButtonElement
    await act(async () => { btn.click() })
    expect(onStartNewChat).toHaveBeenCalledWith(samplePayload.problem)
  })
})
