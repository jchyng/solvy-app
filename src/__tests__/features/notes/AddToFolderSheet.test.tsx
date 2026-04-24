// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { AddToFolderSheet } from '@/features/notes'
import type { Folder } from '@/types/api'

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'f1',
    user_id: 'u1',
    name: '수학 오답',
    color: '#FF6B6B',
    position: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  }
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
  vi.clearAllMocks()
})

describe('AddToFolderSheet', () => {
  it('폴더 목록 렌더링', async () => {
    const folders = [makeFolder({ id: 'f1', name: '수학 오답' }), makeFolder({ id: 'f2', name: '영어 복습' })]
    await act(async () => {
      root.render(<AddToFolderSheet folders={folders} selectedFolderIds={[]} onToggle={vi.fn()} onCreateNew={vi.fn()} onClose={vi.fn()} />)
    })
    expect(container.textContent).toContain('수학 오답')
    expect(container.textContent).toContain('영어 복습')
  })

  it('selectedFolderIds에 포함된 폴더 체크박스가 checked', async () => {
    const folders = [makeFolder({ id: 'f1' }), makeFolder({ id: 'f2' })]
    await act(async () => {
      root.render(<AddToFolderSheet folders={folders} selectedFolderIds={['f1']} onToggle={vi.fn()} onCreateNew={vi.fn()} onClose={vi.fn()} />)
    })
    const cb1 = container.querySelector('[data-testid="folder-checkbox-f1"]') as HTMLInputElement
    const cb2 = container.querySelector('[data-testid="folder-checkbox-f2"]') as HTMLInputElement
    expect(cb1.checked).toBe(true)
    expect(cb2.checked).toBe(false)
  })

  it('체크박스 클릭 → onToggle(folderId) 호출', async () => {
    const onToggle = vi.fn()
    const folders = [makeFolder({ id: 'f1', name: '물리 오답' })]
    await act(async () => {
      root.render(<AddToFolderSheet folders={folders} selectedFolderIds={[]} onToggle={onToggle} onCreateNew={vi.fn()} onClose={vi.fn()} />)
    })
    const label = container.querySelector('[data-testid="folder-option-f1"]') as HTMLLabelElement
    await act(async () => { label.click() })
    expect(onToggle).toHaveBeenCalledWith('f1')
  })

  it('멀티 선택: 여러 폴더 체크박스 독립적으로 토글', async () => {
    const onToggle = vi.fn()
    const folders = [makeFolder({ id: 'f1' }), makeFolder({ id: 'f2' })]
    await act(async () => {
      root.render(<AddToFolderSheet folders={folders} selectedFolderIds={[]} onToggle={onToggle} onCreateNew={vi.fn()} onClose={vi.fn()} />)
    })
    const label1 = container.querySelector('[data-testid="folder-option-f1"]') as HTMLLabelElement
    const label2 = container.querySelector('[data-testid="folder-option-f2"]') as HTMLLabelElement
    await act(async () => { label1.click() })
    await act(async () => { label2.click() })
    expect(onToggle).toHaveBeenCalledTimes(2)
    expect(onToggle).toHaveBeenNthCalledWith(1, 'f1')
    expect(onToggle).toHaveBeenNthCalledWith(2, 'f2')
  })

  it('폴더 없을 때 "폴더가 없습니다" 메시지 표시', async () => {
    await act(async () => {
      root.render(<AddToFolderSheet folders={[]} selectedFolderIds={[]} onToggle={vi.fn()} onCreateNew={vi.fn()} onClose={vi.fn()} />)
    })
    expect(container.textContent).toContain('폴더가 없습니다')
  })

  it('+ 새 폴더 버튼 클릭 → onCreateNew 호출', async () => {
    const onCreateNew = vi.fn()
    await act(async () => {
      root.render(<AddToFolderSheet folders={[]} selectedFolderIds={[]} onToggle={vi.fn()} onCreateNew={onCreateNew} onClose={vi.fn()} />)
    })
    const btn = container.querySelector('[data-testid="create-new-folder-btn"]') as HTMLButtonElement
    await act(async () => { btn.click() })
    expect(onCreateNew).toHaveBeenCalledOnce()
  })

  it('배경(backdrop) 클릭 → onClose 호출', async () => {
    const onClose = vi.fn()
    await act(async () => {
      root.render(<AddToFolderSheet folders={[]} selectedFolderIds={[]} onToggle={vi.fn()} onCreateNew={vi.fn()} onClose={onClose} />)
    })
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement
    await act(async () => { backdrop.click() })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
