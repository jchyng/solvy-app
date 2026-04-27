// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'

vi.mock('@/stores/userStore')
import { useUserStore } from '@/stores/userStore'

function mockAuth(user: unknown, token: string | null) {
  vi.mocked(useUserStore).mockImplementation((sel?: (s: unknown) => unknown) => {
    const state = { user, token }
    return sel ? sel(state) : state
  })
}

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
  vi.clearAllMocks()
})

function renderInRouter(initialPath: string) {
  act(() => {
    createRoot(container).render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<div data-testid="landing">landing</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div data-testid="protected">protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
  })
}

describe('ProtectedRoute', () => {
  it('비인증 상태 → 랜딩으로 리다이렉트', () => {
    mockAuth(null, null)
    renderInRouter('/app')
    expect(container.querySelector('[data-testid="landing"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="protected"]')).toBeNull()
  })

  it('user만 있고 token 없음 → 리다이렉트', () => {
    mockAuth({ id: 'u1', email: 'a@b.com', name: 'A', tier: 'free', is_beta_tester: false }, null)
    renderInRouter('/app')
    expect(container.querySelector('[data-testid="landing"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="protected"]')).toBeNull()
  })

  it('인증 상태 → children 렌더', () => {
    mockAuth(
      { id: 'u1', email: 'a@b.com', name: 'A', tier: 'free', is_beta_tester: false },
      'tok-123',
    )
    renderInRouter('/app')
    expect(container.querySelector('[data-testid="protected"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="landing"]')).toBeNull()
  })
})
