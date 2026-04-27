import { useState } from 'react'
import { Star, Pencil, FolderPlus, AlertTriangle } from 'lucide-react'
import type { AnalysisResult, FollowUpQuestion } from '@/types/api'

interface Props {
  result: AnalysisResult
  onFollowUp?: (q: FollowUpQuestion) => void
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  onRename?: () => void
  onAddToFolder?: () => void
}

export function AnalysisCard({ result, onFollowUp, isFavorite, onFavoriteToggle, onRename, onAddToFolder }: Props) {
  const [solutionOpen, setSolutionOpen] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {result.confidence < 0.8 && (
        <div
          data-testid="low-confidence-warning"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: 'var(--warn-soft, #fff8e1)',
            border: '1px solid var(--warn, #f59e0b)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--warn, #f59e0b)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 'var(--text-small)', color: 'var(--ink-2)', lineHeight: 1.5 }}>
            AI가 이 문제를 완전히 확신하지 못합니다. 풀이 내용을 직접 검토해 주세요.
          </p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          data-testid="action-favorite"
          onClick={onFavoriteToggle}
          disabled={!onFavoriteToggle}
          style={onFavoriteToggle ? activeBtn : placeholderBtn}
        >
          <Star size={14} fill={isFavorite ? 'var(--favorite)' : 'none'} />
          {isFavorite ? '즐겨찾기됨' : '즐겨찾기'}
        </button>
        <button
          data-testid="action-rename"
          onClick={onRename}
          disabled={!onRename}
          style={onRename ? activeBtn : placeholderBtn}
        >
          <Pencil size={14} /> 이름 변경
        </button>
        <button
          data-testid="action-add-to-folder"
          onClick={onAddToFolder}
          disabled={!onAddToFolder}
          style={onAddToFolder ? activeBtn : placeholderBtn}
        >
          <FolderPlus size={14} /> 목록에 추가
        </button>
      </div>

      {/* 출제 의도 */}
      <section>
        <h3 style={sectionTitle}>출제 의도</h3>
        <p style={{ color: 'var(--ink)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
          {result.intent}
        </p>
      </section>

      {/* 활용 개념 */}
      {result.concepts.length > 0 && (
        <section>
          <h3 style={sectionTitle}>활용 개념</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.concepts.map((c) => (
              <span key={c} style={conceptChip}>{c}</span>
            ))}
          </div>
        </section>
      )}

      {/* 단계별 최적 풀이 */}
      <section>
        <button
          onClick={() => setSolutionOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '12px',
          }}
        >
          <h3 style={{ ...sectionTitle, margin: 0 }}>최적 풀이</h3>
          <span style={{ color: 'var(--ink-3)', fontSize: 'var(--text-small)' }}>
            {solutionOpen ? '접기' : '펼치기'}
          </span>
        </button>

        {solutionOpen && (
          <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '20px' }}>
            {result.optimal_solution.steps.map((step, i) => (
              <li key={i}>
                <strong style={{ color: 'var(--ink)', fontSize: 'var(--text-body)' }}>
                  {step.title}
                </strong>
                <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)', marginTop: '4px', lineHeight: 1.6 }}>
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 실전 팁 */}
      {result.exam_tips.length > 0 && (
        <section
          style={{
            background: 'var(--bg-sunken)',
            borderRadius: '12px',
            padding: '16px',
            borderLeft: '4px solid var(--accent)',
          }}
        >
          <h3 style={{ ...sectionTitle, marginBottom: '8px' }}>실전 팁</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px' }}>
            {result.exam_tips.map((tip, i) => (
              <li key={i} style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)' }}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 꼬리 질문 칩 */}
      {result.follow_up_questions.length > 0 && (
        <section data-testid="chip-area">
          <h3 style={sectionTitle}>더 알아보기</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.follow_up_questions.map((q) => (
              <button
                key={q.id}
                onClick={() => onFollowUp?.(q)}
                style={chipBtn}
              >
                {q.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  color: 'var(--ink)',
  fontSize: 'var(--text-body)',
  fontWeight: 700,
  marginBottom: '10px',
}

const conceptChip: React.CSSProperties = {
  background: 'var(--bg-sunken)',
  color: 'var(--ink)',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: 'var(--text-small)',
}

const placeholderBtn: React.CSSProperties = {
  background: 'var(--bg-sunken)',
  color: 'var(--ink-3)',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: 'var(--text-small)',
  cursor: 'not-allowed',
  opacity: 0.6,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
}

const activeBtn: React.CSSProperties = {
  background: 'var(--bg-sunken)',
  color: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: 'var(--text-small)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
}

const chipBtn: React.CSSProperties = {
  background: 'var(--bg-sunken)',
  color: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '20px',
  padding: '8px 16px',
  fontSize: 'var(--text-small)',
  cursor: 'pointer',
}
