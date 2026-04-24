// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { FolderBottomSheet } from '@/features/notes'
import type { Folder } from '@/types/api'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
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

describe('FolderBottomSheet', () => {
  it('새 폴더 모드: 제목 "새 폴더" 표시', async () => {
    await act(async () => {
      root.render(<FolderBottomSheet onSave={vi.fn()} onClose={vi.fn()} />)
    })
    expect(container.textContent).toContain('새 폴더')
  })

  it('편집 모드: 기존 이름이 input에 채워짐', async () => {
    const folder: Folder = {
      id: 'f1',
      user_id: 'u1',
      name: '오답노트',
      color: '#FF6B6B',
      position: 0,
      created_at: new Date().toISOString(),
    }
    await act(async () => {
      root.render(<FolderBottomSheet folder={folder} onSave={vi.fn()} onClose={vi.fn()} />)
    })
    const input = container.querySelector('[data-testid="folder-name-input"]') as HTMLInputElement
    expect(input.value).toBe('오답노트')
    expect(container.textContent).toContain('폴더 편집')
  })

  it('색상 팔레트 8개 렌더링', async () => {
    await act(async () => {
      root.render(<FolderBottomSheet onSave={vi.fn()} onClose={vi.fn()} />)
    })
    const colorBtns = container.querySelectorAll('[data-testid^="color-#"]')
    expect(colorBtns.length).toBe(8)
  })

  it('색상 선택 → aria-pressed 변경', async () => {
    await act(async () => {
      root.render(<FolderBottomSheet onSave={vi.fn()} onClose={vi.fn()} />)
    })
    const colorBtn = container.querySelector('[data-testid="color-#4D96FF"]') as HTMLButtonElement
    await act(async () => { colorBtn.click() })
    expect(colorBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('이름 비어있을 때 저장 버튼 비활성화', async () => {
    await act(async () => {
      root.render(<FolderBottomSheet onSave={vi.fn()} onClose={vi.fn()} />)
    })
    const saveBtn = container.querySelector('[data-testid="folder-save-btn"]') as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
  })

  it('이름 입력 후 저장 → onSave 호출', async () => {
    const onSave = vi.fn()
    await act(async () => {
      root.render(<FolderBottomSheet onSave={onSave} onClose={vi.fn()} />)
    })

    const input = container.querySelector('[data-testid="folder-name-input"]') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

    await act(async () => {
      nativeSetter?.call(input, '수학 오답')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const saveBtn = container.querySelector('[data-testid="folder-save-btn"]') as HTMLButtonElement
    await act(async () => { saveBtn.click() })

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: '수학 오답' }))
  })

  it('X 역할 배경 클릭 → onClose 호출', async () => {
    const onClose = vi.fn()
    await act(async () => {
      root.render(<FolderBottomSheet onSave={vi.fn()} onClose={onClose} />)
    })
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement
    await act(async () => { backdrop.click() })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('저장 시 선택된 색상 포함', async () => {
    const onSave = vi.fn()
    await act(async () => {
      root.render(<FolderBottomSheet onSave={onSave} onClose={vi.fn()} />)
    })

    const colorBtn = container.querySelector('[data-testid="color-#4D96FF"]') as HTMLButtonElement
    await act(async () => { colorBtn.click() })

    const input = container.querySelector('[data-testid="folder-name-input"]') as HTMLInputElement
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    await act(async () => {
      nativeSetter?.call(input, '테스트')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const saveBtn = container.querySelector('[data-testid="folder-save-btn"]') as HTMLButtonElement
    await act(async () => { saveBtn.click() })

    expect(onSave).toHaveBeenCalledWith({ name: '테스트', color: '#4D96FF' })
  })
})
