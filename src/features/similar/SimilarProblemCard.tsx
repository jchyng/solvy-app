import { useState } from 'react'
import { MarkdownView } from '@/shared/components/MarkdownView'
import type { SimilarProblemPayload } from '@/types/api'

const difficultyLabel: Record<string, string> = {
  same: '같은 난이도',
  up: '한 단계 위',
  down: '한 단계 아래',
}

interface Props {
  payload: SimilarProblemPayload
  onStartNewChat?: (problemText: string) => void
}

export function SimilarProblemCard({ payload, onStartNewChat }: Props) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  return (
    <div
      data-testid="similar-problem-card"
      style={{
        border: '1px solid var(--accent, #6366f1)',
        borderRadius: '16px',
        padding: '16px',
        background: 'var(--surface-1, #fff)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 'var(--text-small, 13px)',
            color: 'var(--accent, #6366f1)',
            fontWeight: 600,
          }}
        >
          유사 문제 · {difficultyLabel[payload.difficulty] ?? payload.difficulty}
        </span>
      </div>

      <div data-testid="similar-problem-text">
        <MarkdownView content={payload.problem} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAnswer((v) => !v)}
          data-testid="toggle-answer"
          style={toggleBtn}
        >
          {showAnswer ? '답 숨기기' : '답 보기'}
        </button>
        <button
          onClick={() => setShowSolution((v) => !v)}
          data-testid="toggle-solution"
          style={toggleBtn}
        >
          {showSolution ? '풀이 숨기기' : '풀이 보기'}
        </button>
      </div>

      {showAnswer && (
        <div
          data-testid="answer-section"
          style={{
            background: 'var(--surface-2, #f3f4f6)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: 'var(--text-body, 15px)',
          }}
        >
          <strong>답:</strong> {payload.answer}
        </div>
      )}

      {showSolution && (
        <div
          data-testid="solution-section"
          style={{
            background: 'var(--surface-2, #f3f4f6)',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          <MarkdownView content={payload.solution} />
        </div>
      )}

      {onStartNewChat && (
        <button
          onClick={() => onStartNewChat(payload.problem)}
          data-testid="start-new-chat"
          style={startNewChatBtn}
        >
          이 문제도 새 대화로 시작하기
        </button>
      )}
    </div>
  )
}

const toggleBtn: React.CSSProperties = {
  background: 'none',
  color: 'var(--accent, #6366f1)',
  border: '1px solid var(--accent, #6366f1)',
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: 'var(--text-small, 13px)',
  cursor: 'pointer',
}

const startNewChatBtn: React.CSSProperties = {
  background: 'var(--accent, #6366f1)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '10px 16px',
  fontSize: 'var(--text-body, 15px)',
  cursor: 'pointer',
  fontWeight: 600,
  textAlign: 'center',
}
