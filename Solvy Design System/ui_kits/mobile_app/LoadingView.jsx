// Solvy — Loading View
const LoadingView = ({ subject = '수학Ⅱ', status = 'analyzing' }) => {
  const [dots, setDots] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <MobileFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: '100vh' }}>
        {/* Thumbnail placeholder with spinner */}
        <div style={{
          width: 96, height: 96, background: 'var(--bg-sunken)', borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
          border: '1px solid var(--line)',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg-sunken), var(--bg-elevated))' }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'spin 1s linear infinite' }}>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>Analyzing{'.'.repeat(dots)}</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>
          {status === 'uploading' ? '이미지를 최적화하는 중...' : 'Solvy가 문제를 분석하고 있습니다'}
        </p>

        {/* Progress steps */}
        <div style={{ marginTop: 40, width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: '이미지 인식', done: true },
            { label: '문제 분류', done: status === 'analyzing' },
            { label: '풀이 생성 중', done: false },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: step.done ? 'var(--accent)' : 'var(--bg-sunken)',
                border: step.done ? 'none' : '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize: 13, color: step.done ? 'var(--ink-2)' : 'var(--ink-4)', fontWeight: step.done ? 500 : 400 }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </MobileFrame>
  );
};

Object.assign(window, { LoadingView });
