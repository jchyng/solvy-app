// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/stores/userStore')
vi.mock('@/services/api')
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: vi.fn() }
})

import { useUserStore } from '@/stores/userStore'
import { api } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import SignupPage from '@/pages/SignupPage'

const mockNavigate = vi.fn()
const mockSetUser = vi.fn()
const mockSetToken = vi.fn()

function makeUser() {
  return { id: 'u1', email: 'a@b.com', name: 'A', tier: 'free' as const, is_beta_tester: true }
}

function setupMocks() {
  vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  vi.mocked(useUserStore).mockReturnValue({
    user: null,
    token: null,
    setUser: mockSetUser,
    setToken: mockSetToken,
    logout: vi.fn(),
  } as ReturnType<typeof useUserStore>)
}

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  setupMocks()
})

afterEach(() => {
  container.remove()
  vi.clearAllMocks()
})

function render() {
  act(() => {
    createRoot(container).render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )
  })
}

describe('SignupPage', () => {
  it('폼 요소 렌더링 확인', () => {
    render()
    expect(container.querySelector('[data-testid="signup-email"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="signup-code"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="signup-name"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="signup-submit"]')).toBeTruthy()
  })

  it('성공 시 setUser, setToken 호출 후 /app으로 이동', async () => {
    const user = makeUser()
    vi.mocked(api.auth.redeemInvite).mockResolvedValue(
      new Response(JSON.stringify({ token: 'tok-123', user }), { status: 201 }),
    )
    render()

    act(() => {
      const emailEl = container.querySelector<HTMLInputElement>('[data-testid="signup-email"]')!
      const codeEl = container.querySelector<HTMLInputElement>('[data-testid="signup-code"]')!
      emailEl.value = 'a@b.com'
      emailEl.dispatchEvent(new Event('input', { bubbles: true }))
      codeEl.value = 'BETA-TEST'
      codeEl.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    expect(mockSetToken).toHaveBeenCalledWith('tok-123')
    expect(mockSetUser).toHaveBeenCalledWith(user)
    expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true })
  })

  it('API 오류 시 에러 메시지 표시', async () => {
    vi.mocked(api.auth.redeemInvite).mockResolvedValue(
      new Response(JSON.stringify({ error: '이미 사용된 초대 코드입니다' }), { status: 400 }),
    )
    render()

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    const errorEl = container.querySelector('[data-testid="signup-error"]')
    expect(errorEl).toBeTruthy()
    expect(errorEl!.textContent).toBe('이미 사용된 초대 코드입니다')
  })

  it('네트워크 오류 시 에러 메시지 표시', async () => {
    vi.mocked(api.auth.redeemInvite).mockRejectedValue(new Error('network fail'))
    render()

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }))
    })

    const errorEl = container.querySelector('[data-testid="signup-error"]')
    expect(errorEl).toBeTruthy()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
