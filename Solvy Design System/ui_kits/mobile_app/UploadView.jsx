// Solvy — Upload View
const UploadView = ({ onUpload }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onUpload && onUpload(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <MobileFrame>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', minHeight: '100vh' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 42, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>Solvy</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, fontWeight: 500, marginBottom: 48, textAlign: 'center' }}>찍기만 하면, 완벽한 풀이가 펼쳐집니다.</p>

        {/* Drop zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            width: '100%', maxWidth: 320, aspectRatio: '1/1',
            border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--line)'}`,
            borderRadius: 32, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            background: isDragOver ? 'rgba(61,92,75,0.05)' : 'var(--bg-elevated)',
            transition: 'all 0.15s', marginBottom: 24,
          }}
        >
          <div style={{
            background: 'var(--ink)', color: 'var(--bg)', borderRadius: '50%',
            width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 2px 8px rgba(26,24,20,0.12)',
          }}>
            <Icon name="camera" size={28} color="var(--bg)" />
          </div>
          <p style={{ color: 'var(--ink-2)', fontWeight: 500, fontSize: 15, marginBottom: 6 }}>문제를 촬영하거나 업로드하세요</p>
          <p style={{ color: 'var(--ink-4)', fontSize: 12 }}>터치하여 앨범에서 선택 / 드래그 앤 드롭</p>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        </label>

        {/* Recent problems (placeholder) */}
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-4)' }}>최근 문제</span>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>전체 보기</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['수학Ⅱ', '확률과통계', '미적분'].map((subj, i) => (
              <div key={i} onClick={() => onUpload && onUpload(null, subj)} style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ width: 32, height: 32, background: 'var(--bg-sunken)', borderRadius: 8, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="image" size={14} color="var(--ink-4)" />
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 500 }}>{subj}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileFrame>
  );
};

Object.assign(window, { UploadView });
