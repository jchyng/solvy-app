// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn().mockReturnValue(vi.fn()) }
})

import LandingPage from '@/pages/LandingPage'

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
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function render() {
  act(() => {
    root.render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
  })
}

// native setter를 이용해 React 제어 입력 값을 올바르게 업데이트
async function fillEmail(value: string) {
  await act(async () => {
    const input = container.querySelector<HTMLInputElement>('[data-testid="waitlist-email-input"]')!
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    nativeSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submitForm() {
  await act(async () => {
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }))
  })
  // fetch → json() 비동기 체인 플러시 (각각 한 마이크로태스크)
  await act(async () => { await Promise.resolve() })
  await act(async () => { await Promise.resolve() })
  await act(async () => { await Promise.resolve() })
}

function ok(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  }) as Promise<Response>
}

function fail(status: number, error: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  }) as Promise<Response>
}

describe('LandingPage', () => {
  it('idle 상태: 이메일 입력 + 제출 버튼 렌더링', () => {
    render()
    expect(container.querySelector('[data-testid="waitlist-email-input"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="waitlist-submit"]')).not.toBeNull()
  })

  it('이미 초대 코드가 있으신가요? 링크 → /signup', () => {
    render()
    const link = container.querySelector<HTMLAnchorElement>('a[href="/signup"]')
    expect(link).not.toBeNull()
  })

  it('빈 이메일 제출 → API 미호출', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    render()
    await submitForm()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('성공 → waitlist-success 렌더링 및 순번 표시', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(ok({ position: 42 })))
    render()
    await fillEmail('test@example.com')
    await submitForm()

    const success = container.querySelector('[data-testid="waitlist-success"]')
    expect(success).not.toBeNull()
    expect(success!.textContent).toContain('#42')
  })

  it('API 오류 → waitlist-error 에 서버 메시지 표시', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fail(400, '이미 등록된 이메일입니다')))
    render()
    await fillEmail('dup@example.com')
    await submitForm()

    const error = container.querySelector('[data-testid="waitlist-error"]')
    expect(error).not.toBeNull()
    expect(error!.textContent).toContain('이미 등록된 이메일입니다')
  })

  it('네트워크 오류 → waitlist-error 폴백 메시지 표시', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render()
    await fillEmail('test@example.com')
    await submitForm()

    const error = container.querySelector('[data-testid="waitlist-error"]')
    expect(error).not.toBeNull()
  })
})
