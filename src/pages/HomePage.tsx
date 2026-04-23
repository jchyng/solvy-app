import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProblemStore } from '@/stores/problemStore'
import { UploadView } from '@/features/problem/UploadView'
import { LoadingView } from '@/features/problem/LoadingView'
import { ConfirmView } from '@/features/problem/ConfirmView'

export default function HomePage() {
  const { phase, conversationId, errorMessage } = useProblemStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (phase === 'done' && conversationId) {
      navigate(`/chat/${conversationId}`)
    }
  }, [phase, conversationId, navigate])

  if (phase === 'idle') return <UploadView />
  if (phase === 'uploading' || phase === 'polling') return <LoadingView phase={phase} />
  if (phase === 'confirming') return <ConfirmView />
  if (phase === 'error') return <LoadingView phase={phase} errorMessage={errorMessage} />

  return null
}
