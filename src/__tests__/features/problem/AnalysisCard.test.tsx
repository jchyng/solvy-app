// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  it('콜백 없이 렌더링 시 액션 버튼 3개가 disabled', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect((container.querySelector('[data-testid="action-favorite"]') as HTMLButtonElement).disabled).toBe(true)
    expect((container.querySelector('[data-testid="action-rename"]') as HTMLButtonElement).disabled).toBe(true)
    expect((container.querySelector('[data-testid="action-add-to-folder"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('onFavoriteToggle 제공 시 ★ 버튼 활성화 및 클릭 호출', () => {
    const onFavoriteToggle = vi.fn()
    act(() => { root.render(<AnalysisCard result={mockResult} onFavoriteToggle={onFavoriteToggle} />) })
    const btn = container.querySelector('[data-testid="action-favorite"]') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    act(() => { btn.click() })
    expect(onFavoriteToggle).toHaveBeenCalledOnce()
  })

  it('isFavorite=true 이면 "즐겨찾기됨" 표시', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} isFavorite onFavoriteToggle={vi.fn()} />) })
    expect(container.querySelector('[data-testid="action-favorite"]')?.textContent).toContain('즐겨찾기됨')
  })

  it('onRename 제공 시 ✎ 버튼 활성화 및 클릭 호출', () => {
    const onRename = vi.fn()
    act(() => { root.render(<AnalysisCard result={mockResult} onRename={onRename} />) })
    const btn = container.querySelector('[data-testid="action-rename"]') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    act(() => { btn.click() })
    expect(onRename).toHaveBeenCalledOnce()
  })

  it('onAddToFolder 제공 시 ⎘ 버튼 활성화 및 클릭 호출', () => {
    const onAddToFolder = vi.fn()
    act(() => { root.render(<AnalysisCard result={mockResult} onAddToFolder={onAddToFolder} />) })
    const btn = container.querySelector('[data-testid="action-add-to-folder"]') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    act(() => { btn.click() })
    expect(onAddToFolder).toHaveBeenCalledOnce()
  })

  it('confidence >= 0.8 이면 경고 배너를 렌더링하지 않는다', () => {
    act(() => { root.render(<AnalysisCard result={mockResult} />) })
    expect(container.querySelector('[data-testid="low-confidence-warning"]')).toBeNull()
  })

  it('confidence < 0.8 이면 경고 배너를 렌더링한다', () => {
    const lowConf = { ...mockResult, confidence: 0.65 }
    act(() => { root.render(<AnalysisCard result={lowConf} />) })
    const warning = container.querySelector('[data-testid="low-confidence-warning"]')
    expect(warning).not.toBeNull()
    expect(warning?.textContent).toContain('AI가 이 문제를 완전히 확신하지 못합니다')
  })
})
