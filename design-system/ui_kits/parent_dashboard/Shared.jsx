// Solvy Parent Dashboard — Shared primitives
const dashboardTokens = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; font-family: var(--font-sans); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
`;

const DCard = ({ children, style = {}, sunken = false }) => (
  <div style={{
    background: sunken ? 'var(--bg-sunken)' : 'var(--bg-elevated)',
    border: '1px solid var(--line)', borderRadius: 20,
    padding: 20, ...style
  }}>
    {children}
  </div>
);

const DLabel = ({ children, style = {} }) => (
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 500, marginBottom: 6, ...style }}>
    {children}
  </div>
);

const DBadge = ({ children, color = 'accent' }) => {
  const colors = {
    accent: { bg: 'rgba(61,92,75,0.1)', fg: 'var(--accent)' },
    warn:   { bg: 'rgba(166,95,46,0.1)', fg: 'var(--warn)' },
    neutral:{ bg: 'rgba(226,221,208,0.5)', fg: 'var(--ink-3)' },
  };
  const c = colors[color] || colors.neutral;
  return (
    <span style={{ padding: '3px 10px', background: c.bg, color: c.fg, borderRadius: 9999, fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
    </span>
  );
};

// Mini bar chart
const BarChart = ({ data, height = 80 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', background: d.highlight ? 'var(--accent)' : 'var(--line)', borderRadius: '4px 4px 0 0', height: `${(d.value / max) * (height - 20)}px`, transition: 'height 0.3s ease', minHeight: 4 }}></div>
          <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// Depth meter (circle)
const DepthMeter = ({ value = 72, size = 80 }) => {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="var(--ink)" fontSize="14" fontWeight="600" fontFamily="var(--font-mono)">{value}%</text>
    </svg>
  );
};

Object.assign(window, { dashboardTokens, DCard, DLabel, DBadge, BarChart, DepthMeter });
