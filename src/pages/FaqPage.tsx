import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

const faqs: FaqItem[] = [
  {
    q: 'Solvy는 어떤 서비스인가요?',
    a: '수학 문제 사진을 찍어 올리면 AI가 출제 의도, 핵심 개념, 단계별 풀이법, 실전 팁을 설명해주는 학습 도우미입니다. 정답을 알려주는 앱이 아니라, 스스로 이해하도록 돕는 앱입니다.',
  },
  {
    q: '어떤 수학 과목을 지원하나요?',
    a: '중학교·고등학교 수학 전 범위를 지원합니다. 수학I, 수학II, 확률과 통계, 미적분, 기하 등 수능·내신 전 범위가 가능합니다.',
  },
  {
    q: 'AI가 틀린 답을 줄 수도 있나요?',
    a: 'AI는 매우 정확하지만 완벽하지는 않습니다. 풀이 설명이 이상하다고 느껴지면 채팅창에서 "이 부분이 이해가 안 돼요"라고 질문해보세요. 더 자세히 설명해드립니다. 명백한 오류를 발견하면 피드백 버튼으로 알려주시면 빠르게 개선합니다.',
  },
  {
    q: '내 노트와 풀이 기록은 안전한가요?',
    a: '네, 절대적으로 안전합니다. 이용약관에 명문화되어 있듯이, 회사는 이용자의 노트·대화 기록을 AI 학습이나 제3자 제공에 절대 사용하지 않습니다. 베타 중 만든 노트는 정식 출시 후에도 영구 보존됩니다.',
  },
  {
    q: '베타는 무료인가요?',
    a: '베타 기간 동안은 무료로 이용하실 수 있습니다. 정식 출시 후 요금제가 도입되지만, Founding Member 베타 참여자에게는 최소 50% 할인 혜택을 제공합니다.',
  },
  {
    q: 'Founding Member 혜택은 어떻게 받나요?',
    a: '베타 대기열에 등록하고 초대 코드로 가입하면 자동으로 Founding Member 뱃지와 혜택이 부여됩니다. 별도 신청 없이 계정에 자동 적용됩니다.',
  },
  {
    q: '초대 코드를 어떻게 받을 수 있나요?',
    a: '대기열에 이메일을 등록해주세요. 순서대로 초대 코드를 이메일로 발송해드립니다. 빠른 참여를 원하신다면 주변에 Solvy를 소개하고 추천인 코드를 공유하세요 (추천인 기능은 곧 추가 예정).',
  },
  {
    q: '문제 이미지는 어떤 형식을 지원하나요?',
    a: 'JPEG, PNG, WebP 형식을 지원하며 최대 10MB까지 업로드 가능합니다. 사진은 최대한 흔들림 없이 찍어주세요. 인쇄된 문제뿐 아니라 손글씨 문제도 인식합니다.',
  },
  {
    q: '만 14세 미만도 사용 가능한가요?',
    a: '만 14세 미만의 경우 법정대리인(보호자)의 동의가 필요합니다. 가입 시 생년월일 확인 후 동의 절차가 안내됩니다.',
  },
  {
    q: '오류나 버그를 발견했어요. 어디에 신고하나요?',
    a: '앱 내 채팅창에서 "버그 신고"라고 입력하거나, 문의 이메일(solvy.contact@gmail.com)로 알려주세요. 발견하신 오류는 최대한 빠르게 수정합니다.',
  },
]

export default function FaqPage() {
  const navigate = useNavigate()
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)', padding: '0 0 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ padding: '20px 0 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={backBtn} data-testid="back-btn">
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: 'var(--text-h2)', fontWeight: 700 }}>자주 묻는 질문</h1>
        </div>

        <div style={{ paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              data-testid={`faq-item-${i}`}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                data-testid={`faq-toggle-${i}`}
              >
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                  Q. {faq.q}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--ink-3)',
                    flexShrink: 0,
                    transform: openIdx === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {openIdx === i && (
                <div
                  style={{ padding: '0 16px 16px', borderTop: '1px solid var(--line)' }}
                  data-testid={`faq-answer-${i}`}
                >
                  <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', fontSize: 'var(--text-body)', lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', padding: '24px', background: 'var(--bg-sunken)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--ink-2)', fontSize: 'var(--text-body)', margin: '0 0 12px' }}>
            찾는 답이 없으신가요?
          </p>
          <a
            href="mailto:solvy.contact@gmail.com"
            style={{
              color: 'var(--accent)',
              fontSize: 'var(--text-body)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            solvy.contact@gmail.com
          </a>
        </div>
      </div>
    </main>
  )
}

const backBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-2)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
}
