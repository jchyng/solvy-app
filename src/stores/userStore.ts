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

// E2E 테스트에서 page.addInitScript()로 window.__E2E_AUTH 를 주입해 인증 상태를 초기화한다.
// 서버 인증은 JWT로 보호되므로 이 클라이언트 상태 노출은 보안 위험이 없다.
const e2eAuth = typeof window !== 'undefined'
  ? (window as Record<string, unknown>).__E2E_AUTH as { user: User; token: string } | undefined
  : undefined

export const useUserStore = create<UserState>((set) => ({
  user: e2eAuth?.user ?? null,
  token: e2eAuth?.token ?? null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}))
