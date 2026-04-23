import { useParams } from 'react-router-dom'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <main className="p-4">
      <p style={{ color: 'var(--ink-3)' }}>Chat {id} — Week 3에서 구현 예정</p>
    </main>
  )
}
