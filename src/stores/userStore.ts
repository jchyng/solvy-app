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

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}))
