import { useState } from 'react'
import type { AnalysisResult, FollowUpQuestion } from '@/types/api'

interface Props {
  result: AnalysisResult
  onFollowUp?: (q: FollowUpQuestion) => void
}

export function AnalysisCard({ result, onFollowUp }: Props) {
  const [solutionOpen, setSolutionOpen] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Week 5 placeholder actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button disabled style={placeholderBtn}>★ 즐겨찾기</button>
        <button disabled style={placeholderBtn}>✎ 이름 변경</button>
        <button disabled style={placeholderBtn}>⎘ 목록에 추가</button>
      </div>

      {/* 출제 의도 */}
      <section>
        <h3 style={sectionTitle}>출제 의도</h3>
        <p style={{ color: 'var(--ink-1)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
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
                <strong style={{ color: 'var(--ink-1)', fontSize: 'var(--text-body)' }}>
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
            background: 'var(--surface-2)',
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
  color: 'var(--ink-1)',
  fontSize: 'var(--text-body)',
  fontWeight: 700,
  marginBottom: '10px',
}

const conceptChip: React.CSSProperties = {
  background: 'var(--surface-2)',
  color: 'var(--ink-1)',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: 'var(--text-small)',
}

const placeholderBtn: React.CSSProperties = {
  background: 'var(--surface-2)',
  color: 'var(--ink-3)',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: 'var(--text-small)',
  cursor: 'not-allowed',
  opacity: 0.6,
}

const chipBtn: React.CSSProperties = {
  background: 'var(--surface-2)',
  color: 'var(--accent)',
  border: '1px solid var(--accent)',
  borderRadius: '20px',
  padding: '8px 16px',
  fontSize: 'var(--text-small)',
  cursor: 'pointer',
}
