// Solvy Mobile App — Shared Primitives
// Tokens, icons, layout helpers

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600');
  @font-face {
    font-family: 'Pretendard Variable';
    font-weight: 45 920;
    font-style: normal;
    font-display: swap;
    src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2-variations');
  }
`;

const TOKENS = `
  :root {
    --bg: #F5F2EC; --bg-elevated: #FBF9F4; --bg-sunken: #EEEAE1;
    --ink: #1A1814; --ink-2: #3C3932; --ink-3: #6B675D; --ink-4: #9E998E;
    --line: #E2DDD0; --accent: #3D5C4B; --accent-soft: #E0E8DF; --warn: #A65F2E;
    --font-serif: 'Cormorant Garamond', serif;
    --font-sans: 'Pretendard Variable', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #13120F; --bg-elevated: #1C1B17; --bg-sunken: #0E0D0B;
      --ink: #F0ECE0; --ink-2: #D4D0C3; --ink-3: #95907F; --ink-4: #6B6757;
      --line: #2A2822; --accent: #8FB89F; --accent-soft: #1F2A23; --warn: #D4925E;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-sans); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
`;

// ─── Lucide-style SVG Icons ─────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 2 }) => {
  const paths = {
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    skipBack: <><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    loader: <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
    lightbulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></>,
    paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    sparkles: <><path d="M12 3L13.09 8.26L18 9L13.09 9.74L12 15L10.91 9.74L6 9L10.91 8.26L12 3Z"/><path d="M5 18l.93-2.07L8 15l-2.07-.93L5 12l-.93 2.07L2 15l2.07.93L5 18Z"/></>,
    refreshCcw: <><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── Layout ──────────────────────────────────────────────────────
const MobileFrame = ({ children, style = {} }) => (
  <div style={{
    width: '100%', maxWidth: 420, minHeight: '100%',
    margin: '0 auto', display: 'flex', flexDirection: 'column',
    background: 'var(--bg)', position: 'relative', ...style
  }}>
    {children}
  </div>
);

const Header = ({ onBack, title = 'Solvy', right }) => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(245,242,236,0.85)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--line)', padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 4 }}>
          <Icon name="skipBack" size={20} />
        </button>
      )}
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 16, color: 'var(--ink)' }}>{title}</span>
    </div>
    {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>}
  </header>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', marginBottom: 8 }}>
    {children}
  </div>
);

const Card = ({ children, style = {}, sunken = false }) => (
  <div style={{
    background: sunken ? 'var(--bg-sunken)' : 'var(--bg-elevated)',
    border: '1px solid var(--line)', borderRadius: 22, padding: 20, ...style
  }}>
    {children}
  </div>
);

const Chip = ({ children, accent = false, onClick }) => (
  <button onClick={onClick} style={{
    whiteSpace: 'nowrap', padding: '6px 14px',
    background: accent ? 'var(--accent-soft)' : 'var(--bg-elevated)',
    border: accent ? 'none' : '1px solid var(--line)',
    borderRadius: 9999, fontSize: 13,
    color: accent ? 'var(--accent)' : 'var(--ink-2)',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'background 0.15s',
  }}>
    {children}
  </button>
);

Object.assign(window, { FONTS, TOKENS, Icon, MobileFrame, Header, SectionLabel, Card, Chip });
