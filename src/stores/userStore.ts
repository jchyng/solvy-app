import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'light' | 'pro'
  is_beta_tester: boolean
}

interface UserState {
  user: User | null
  token: string | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  logout: () => void
}

const STORAGE_KEY = 'solvy_auth'

function saveAuth(user: User | null, token: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (user && token) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

function loadAuth(): { user: User; token: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { user: User; token: string }) : null
  } catch {
    return null
  }
}

// E2E 테스트에서 page.addInitScript()로 window.__E2E_AUTH 를 주입해 인증 상태를 초기화한다.
// 서버 인증은 JWT로 보호되므로 이 클라이언트 상태 노출은 보안 위험이 없다.
const e2eAuth = typeof window !== 'undefined'
  ? (window as Record<string, unknown>).__E2E_AUTH as { user: User; token: string } | undefined
  : undefined

// dev 환경에서 인프라 없이 앱 화면을 둘러볼 수 있도록 가짜 사용자 주입
const devAuth = import.meta.env?.DEV
  ? { user: { id: 'dev-user-1', email: 'dev@solvy.kr', name: '테스트 유저', tier: 'pro' as const, is_beta_tester: true }, token: 'dev-fake-token' }
  : undefined

const savedAuth = !e2eAuth && !devAuth ? loadAuth() : null

export const useUserStore = create<UserState>((set, get) => ({
  user: e2eAuth?.user ?? devAuth?.user ?? savedAuth?.user ?? null,
  token: e2eAuth?.token ?? devAuth?.token ?? savedAuth?.token ?? null,
  setToken: (token) => {
    set({ token })
    saveAuth(get().user, token)
  },
  setUser: (user) => {
    set((s) => {
      saveAuth(user, s.token)
      return { user }
    })
  },
  logout: () => {
    saveAuth(null, null)
    set({ user: null, token: null })
  },
}))
