import { useParams } from 'react-router-dom'

export default function FolderPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <main className="p-4">
      <p style={{ color: 'var(--ink-3)' }}>Folder {id} — Week 5에서 구현 예정</p>
    </main>
  )
}
