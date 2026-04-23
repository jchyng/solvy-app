// Solvy — Chat / Q&A View
function ChatView({ messages = [], isTyping = false, input = '', setInput, onSend, onClose, chips = [] }) {
  const endRef = React.useRef(null);

  React.useEffect(() => {
    if (endRef.current) {
      endRef.current.parentElement.scrollTop = endRef.current.offsetTop;
    }
  }, [messages, isTyping]);

  return (
    <MobileFrame>
      <header style={{
        background: 'var(--bg)', borderBottom: '1px solid var(--line)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink)' }}>Q&amp;A</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}>
          <Icon name="x" size={20} />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>
        {/* Intro message */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-3)', marginBottom: 8 }}>어떻게 생각했나요?</div>
            <p style={{ fontSize: 13, color: 'var(--ink-4)', lineHeight: 1.6 }}>자신의 말로 풀이를 설명하거나<br/>궁금한 점을 질문해보세요.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--ink)' : 'var(--bg-elevated)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '12px 16px', fontSize: 14,
              color: m.role === 'user' ? 'var(--bg)' : 'var(--ink-2)',
              lineHeight: 1.6,
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--line)', borderRadius: 18, padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-3)', display: 'inline-block', animation: `pulse 1.4s ${d}s infinite` }}></span>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      {/* Bottom input */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '10px 16px 20px' }}>
        {chips.length > 0 && messages.length === 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none' }}>
            {chips.map((chip, i) => <Chip key={i} onClick={() => onSend && onSend(chip)}>{chip}</Chip>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="paperclip" size={18} color="var(--ink-3)" />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSend && onSend(input)}
              placeholder="질문하거나, 자신의 말로 설명해보세요..."
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--line)',
                borderRadius: 9999, padding: '13px 52px 13px 20px', fontSize: 14,
                color: 'var(--ink)', fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
            <button
              onClick={() => onSend && onSend(input)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 34, height: 34, borderRadius: '50%',
                background: input.trim() ? 'var(--accent)' : 'var(--ink-3)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              <Icon name="send" size={14} color="white" />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }`}</style>
    </MobileFrame>
  );
}

Object.assign(window, { ChatView });
