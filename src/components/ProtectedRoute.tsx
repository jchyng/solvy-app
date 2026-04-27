import { Navigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user)
  const token = useUserStore((s) => s.token)
  if (!user || !token) return <Navigate to="/" replace />
  return <>{children}</>
}
