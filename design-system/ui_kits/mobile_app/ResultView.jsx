// Solvy — Result View (Intent → Solution → Answer → Tip + Chat)

const SAMPLE = {
  subject: '수학Ⅱ', difficulty: 3, source: '2024 수능',
  problem: 'x² + 5x + 6 = 0',
  intent: '이 문제는 이차방정식의 근을 구하는 문제입니다. 인수분해 또는 근의 공식을 이용하여 두 근을 구하세요.',
  steps: [
    { title: '계수 확인', body: '주어진 이차방정식 x² + 5x + 6 = 0에서 계수를 읽습니다.', math: 'a = 1,\\; b = 5,\\; c = 6' },
    { title: '인수분해 시도', body: '두 수의 합이 5이고 곱이 6인 정수 쌍을 찾습니다.', math: '(x + 2)(x + 3) = 0' },
    { title: '근 계산', body: '각 인수를 0으로 놓으면 두 근을 구할 수 있습니다.', math: 'x = -2 \\;\\text{또는}\\; x = -3' },
  ],
  answer: { display: 'x = −2, x = −3', caption: '두 근의 합: −5, 두 근의 곱: 6' },
  tip: '근의 공식보다 인수분해가 계산이 훨씬 빠릅니다. 판별식 D = 25 − 24 = 1 > 0이므로 서로 다른 두 실수 근을 가집니다.',
  hints: [
    '두 수의 합이 5이고 곱이 6인 경우를 생각해보세요.',
    '(x + a)(x + b) = x² + (a+b)x + ab 형태로 전개됩니다.',
    '각 인수를 0으로 놓으면 근을 구할 수 있습니다.',
  ],
  chips: ['판별식이 뭔가요?', '다른 방법이 있나요?', '제가 설명해볼게요', '근의 공식으로도 풀어줘'],
};

const MathDisplay = ({ expr }) => (
  <div style={{
    background: 'var(--bg-elevated)', border: '1px solid var(--line)', borderRadius: 12,
    padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 14,
    color: 'var(--ink-2)', textAlign: 'center', overflowX: 'auto',
  }}>{expr}</div>
);

function ResultView({ onBack, data = SAMPLE }) {
  const [mode, setMode] = React.useState('full');
  const [openedHints, setOpenedHints] = React.useState(1);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setChatOpen(true);
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    setMessages([...next, { role: 'assistant', content: '좋은 시도예요! 그런데 판별식 D = b² − 4ac 에서 b와 c 값을 다시 확인해볼까요?' }]);
    setIsTyping(false);
  };

  if (chatOpen) {
    return <ChatView messages={messages} isTyping={isTyping} input={input} setInput={setInput}
      onSend={sendMessage} onClose={() => setChatOpen(false)} chips={data.chips} />;
  }

  return (
    <MobileFrame>
      <Header onBack={onBack} right={<button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}><Icon name="menu" size={20} /></button>} />

      <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>

        {/* Problem Card */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--line)', borderRadius: 22, padding: 16, display: 'flex', gap: 14 }}>
          <div style={{ width: 72, height: 72, background: 'var(--bg-sunken)', borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={20} color="var(--ink-4)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ padding: '2px 8px', background: 'rgba(61,92,75,0.1)', color: 'var(--accent)', borderRadius: 9999, fontSize: 11, fontWeight: 500 }}>{data.subject}</span>
              <span style={{ padding: '2px 8px', background: 'rgba(226,221,208,0.5)', color: 'var(--ink-3)', borderRadius: 9999, fontSize: 11 }}>{data.difficulty}점</span>
              <span style={{ padding: '2px 8px', background: 'rgba(226,221,208,0.5)', color: 'var(--ink-3)', borderRadius: 9999, fontSize: 11 }}>{data.source}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-2)' }}>{data.problem}</div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', padding: 4, background: 'rgba(226,221,208,0.4)', borderRadius: 9999, width: 'fit-content', margin: '0 auto', gap: 2 }}>
          {['full', 'hint'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 20px', borderRadius: 9999, fontSize: 13, fontWeight: 500,
              background: mode === m ? 'var(--bg)' : 'transparent',
              color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none', cursor: 'pointer',
              boxShadow: mode === m ? '0 1px 3px rgba(26,24,20,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {m === 'full' ? '전체 풀이' : '힌트 모드'}
            </button>
          ))}
        </div>

        {mode === 'full' ? (
          <>
            {/* Intent */}
            <section>
              <SectionLabel>i. Intent</SectionLabel>
              <Card><p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{data.intent}</p></Card>
            </section>

            {/* Solution steps */}
            <section>
              <SectionLabel>ii. Solution</SectionLabel>
              <div style={{ borderLeft: '2px solid var(--line)', paddingLeft: 16, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {data.steps.map((step, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', width: 12, height: 12, background: 'var(--bg)', border: '2px solid var(--line)', borderRadius: '50%', left: -23, top: 3 }}></div>
                    <h4 style={{ fontWeight: 500, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{idx + 1}. {step.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: step.math ? 8 : 0 }}>{step.body}</p>
                    {step.math && <MathDisplay expr={step.math} />}
                  </div>
                ))}
              </div>
            </section>

            {/* Answer */}
            <section>
              <Card style={{ textAlign: 'center', padding: 24 }}>
                <SectionLabel style={{ marginBottom: 10 }}>iii. Final Answer</SectionLabel>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--ink)', marginBottom: 8 }}>{data.answer.display}</div>
                {data.answer.caption && <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{data.answer.caption}</p>}
              </Card>
            </section>

            {/* Tip */}
            {data.tip && (
              <Card sunken style={{ display: 'flex', gap: 14, padding: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="lightbulb" size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 500, marginBottom: 6 }}>Expert Insight</div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>{data.tip}</p>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)', textAlign: 'center' }}>Gentle nudges</p>
            {data.hints.slice(0, openedHints).map((hint, idx) => (
              <Card key={idx}>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Hint {idx + 1}</div>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{hint}</p>
              </Card>
            ))}
            {openedHints < data.hints.length && (
              <button onClick={() => setOpenedHints(h => h + 1)} style={{
                width: '100%', padding: 16, border: '2px dashed var(--line)', borderRadius: 22,
                background: 'transparent', color: 'var(--ink-3)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'var(--font-sans)',
              }}>
                다음 힌트 열기 <Icon name="chevronRight" size={15} color="var(--ink-3)" />
              </button>
            )}
          </>
        )}
      </main>

      {/* Fixed bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'rgba(245,242,236,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--line)', padding: '10px 16px 20px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none' }}>
          {data.chips.map((chip, i) => <Chip key={i} onClick={() => sendMessage(chip)}>{chip}</Chip>)}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-sunken)', border: '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="paperclip" size={18} color="var(--ink-3)" />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="질문하거나, 자신의 말로 설명해보세요..."
              style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid transparent', borderRadius: 9999, padding: '13px 52px 13px 20px', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-sans)', outline: 'none' }} />
            <button onClick={() => sendMessage(input)} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 34, height: 34, borderRadius: '50%', background: input.trim() ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: input.trim() ? 1 : 0.5,
            }}>
              <Icon name="send" size={14} color="var(--bg)" />
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { ResultView, SAMPLE });
