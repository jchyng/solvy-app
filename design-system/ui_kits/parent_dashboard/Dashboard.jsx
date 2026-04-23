// Solvy Parent Dashboard — Main Dashboard View

const STUDENT = {
  name: '김지수',
  grade: '고등학교 2학년',
  avatar: '지',
  streak: 12,
  weekProblems: 28,
  avgDepth: 72,
  improvement: '+8%',
};

const WEEKLY_DATA = [
  { label: '월', value: 4 },
  { label: '화', value: 7 },
  { label: '수', value: 3 },
  { label: '목', value: 6 },
  { label: '금', value: 5 },
  { label: '토', value: 2 },
  { label: '일', value: 1, highlight: true },
];

const RECENT_PROBLEMS = [
  { subject: '수학Ⅱ', topic: '이차방정식', depth: 88, time: '오늘 오후 3:12', difficulty: '보통' },
  { subject: '미적분', topic: '넓이 적분', depth: 64, time: '어제 오후 8:40', difficulty: '어려움' },
  { subject: '확률통계', topic: '조합론', depth: 91, time: '2일 전', difficulty: '쉬움' },
  { subject: '수학Ⅱ', topic: '함수의 극한', depth: 55, time: '3일 전', difficulty: '어려움' },
];

const SUBJECTS = [
  { name: '수학Ⅱ', problems: 14, depth: 78 },
  { name: '미적분', problems: 8, depth: 61 },
  { name: '확률통계', problems: 6, depth: 85 },
];

function Dashboard() {
  const [tab, setTab] = React.useState('overview');

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Top nav */}
      <header style={{ borderBottom: '1px solid var(--line)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)' }}>Solvy</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DBadge color="neutral">학부모 뷰</DBadge>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>부</div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Student header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-sunken)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: 'var(--ink-2)' }}>
            {STUDENT.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--ink)', marginBottom: 2 }}>{STUDENT.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{STUDENT.grade}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <DBadge color="accent">🔥 {STUDENT.streak}일 연속</DBadge>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(226,221,208,0.4)', borderRadius: 12, marginBottom: 24, width: 'fit-content' }}>
          {['overview', 'problems', 'subjects'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500,
              background: tab === t ? 'var(--bg)' : 'transparent',
              color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none', cursor: 'pointer',
              boxShadow: tab === t ? '0 1px 3px rgba(26,24,20,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {{ overview: '개요', problems: '문제 내역', subjects: '과목별' }[t]}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>

            {/* Depth score */}
            <DCard style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <DepthMeter value={STUDENT.avgDepth} size={80} />
              <div>
                <DLabel>이해 깊이 점수</DLabel>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{STUDENT.avgDepth}점</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{STUDENT.improvement} 지난주 대비</div>
              </div>
            </DCard>

            {/* Weekly problems */}
            <DCard>
              <DLabel>이번 주 풀이</DLabel>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{STUDENT.weekProblems}<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>문제</span></div>
              <BarChart data={WEEKLY_DATA} height={72} />
            </DCard>

            {/* Subject breakdown */}
            <DCard>
              <DLabel>과목별 현황</DLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {SUBJECTS.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{s.depth}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.depth}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </DCard>

            {/* Weekly report */}
            <DCard sunken style={{ gridColumn: 'span 1' }}>
              <DLabel>주간 리포트</DLabel>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65 }}>
                지수는 이번 주 <strong>28문제</strong>를 풀었으며, 이중 <strong>82%</strong>에서 자신의 말로 설명을 완성했습니다. 미적분 단원에서 개념 이해도가 낮아 추가 학습이 권장됩니다.
              </p>
              <button style={{ marginTop: 12, padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--line)', borderRadius: 9999, fontSize: 12, color: 'var(--ink-2)', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                전체 리포트 보기
              </button>
            </DCard>

          </div>
        )}

        {tab === 'problems' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RECENT_PROBLEMS.map((p, i) => (
              <DCard key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                <div style={{ width: 44, height: 44, background: 'var(--bg-sunken)', borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <DBadge color="accent">{p.subject}</DBadge>
                    <DBadge color="neutral">{p.difficulty}</DBadge>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>{p.topic}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{p.time}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 3 }}>이해도</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: p.depth >= 80 ? 'var(--accent)' : p.depth >= 60 ? 'var(--ink)' : 'var(--warn)', fontFamily: 'var(--font-mono)' }}>{p.depth}%</div>
                </div>
              </DCard>
            ))}
          </div>
        )}

        {tab === 'subjects' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {SUBJECTS.map((s, i) => (
              <DCard key={i}>
                <DLabel>{s.name}</DLabel>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{s.depth}<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 400 }}>%</span></div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>이해 깊이</div>
                  </div>
                  <DepthMeter value={s.depth} size={64} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{s.problems}문제 풀이 완료</div>
              </DCard>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
