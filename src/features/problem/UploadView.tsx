import { useRef, useState } from 'react'
import { useProblemStore } from '@/stores/problemStore'

export function UploadView() {
  const upload = useProblemStore((s) => s.upload)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File | null | undefined) {
    if (!file) return
    upload(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const cameraRef = useRef<HTMLInputElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh p-6 gap-6">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-brand)', color: 'var(--accent)' }}>
        Solvy
      </h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--ink-3)'}`,
          borderRadius: '16px',
          padding: '40px 24px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '360px',
          transition: 'border-color 0.15s',
        }}
      >
        <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)', marginBottom: '20px' }}>
          수학 문제 사진을 올려주세요
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: 'var(--text-body)',
              cursor: 'pointer',
            }}
          >
            📷 카메라
          </button>
          <button
            onClick={() => albumRef.current?.click()}
            style={{
              background: 'var(--surface-2)',
              color: 'var(--ink-1)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: 'var(--text-body)',
              cursor: 'pointer',
            }}
          >
            🖼 앨범
          </button>
        </div>

        <p style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)', marginTop: '16px' }}>
          또는 파일을 여기에 드래그
        </p>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </main>
  )
}
