// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { AnalysisCard } from '@/features/problem/AnalysisCard'
import type { AnalysisResult } from '@/types/api'

const mockResult: AnalysisResult = {
  intent: '이차방정식의 근을 구하는 문제입니다.',
  concepts: ['이차방정식', '인수분해'],
  optimal_solution: {
    steps: [
      { title: '인수분해', detail: '(x+2)(x-3)=0 으로 변환' },
      { title: '근 계산', detail: 'x=-2 또는 x=3' },
    ],
  },
  exam_tips: ['계수 부호 꼭 확인', '근을 대입해 검증'],
  follow_up_questions: [
    { id: 'q1', label: '다른 풀이 방법도 알려줘?' },
    { id: 'q2', label: '근의 공식으로 풀면?' },
  ],
  confidence: 0.95,
}

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
})

describe('AnalysisCard', () => {
  it('출제 의도 텍스트를 렌더링한다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.textContent).toContain('이차방정식의 근을 구하는 문제입니다.')
  })

  it('활용 개념 칩을 렌더링한다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.textContent).toContain('이차방정식')
    expect(container.textContent).toContain('인수분해')
  })

  it('풀이 단계를 렌더링한다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.textContent).toContain('(x+2)(x-3)=0 으로 변환')
    expect(container.textContent).toContain('x=-2 또는 x=3')
  })

  it('실전 팁을 렌더링한다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.textContent).toContain('계수 부호 꼭 확인')
    expect(container.textContent).toContain('근을 대입해 검증')
  })

  it('follow_up_questions가 있으면 chip-area를 렌더링한다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.querySelector('[data-testid="chip-area"]')).not.toBeNull()
    expect(container.textContent).toContain('다른 풀이 방법도 알려줘?')
    expect(container.textContent).toContain('근의 공식으로 풀면?')
  })

  it('follow_up_questions가 빈 배열이면 chip-area를 렌더링하지 않는다', () => {
    const noChips = { ...mockResult, follow_up_questions: [] }
    act(() => { root.render(<AnalysisCard result={noChips} />) })
    expect(container.querySelector('[data-testid="chip-area"]')).toBeNull()
  })

  it('Week 5 placeholder 버튼 3개가 disabled 상태다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    const disabled = container.querySelectorAll('button[disabled]')
    expect(disabled.length).toBeGreaterThanOrEqual(3)
  })
})
