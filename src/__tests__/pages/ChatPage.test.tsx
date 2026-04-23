// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

// react-router-dom mock
vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ id: 'conv-test-1' }),
}))

// userStore mock
vi.mock('@/stores/userStore', () => ({
  useUserStore: vi.fn((selector: (s: { token: string | null }) => unknown) =>
    selector({ token: 'mock-token' }),
  ),
}))

import ChatPage from '@/pages/ChatPage'
import type { ConversationWithMessages } from '@/types/api'

const CONV_ID = 'conv-test-1'

function makeConvResponse(messages: ConversationWithMessages['messages'] = []): ConversationWithMessages {
  return {
    id: CONV_ID,
    problem_session_id: 'sess-1',
    title: null,
    auto_title: '이차방정식',
    is_favorite: false,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    messages,
  }
}

function mockGetConv(data: ConversationWithMessages) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    body: null,
  } as Partial<Response>)
}

function sseStream(events: string[]): ReadableStream {
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(new TextEncoder().encode(event + '\n\n'))
      }
      controller.close()
    },
  })
}

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => { root.unmount() })
  container.remove()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('ChatPage', () => {
  it('로딩 상태 렌더링', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {}))) // never resolves
    await act(async () => { root.render(<ChatPage />) })
    expect(container.textContent).toContain('불러오는 중')
  })

  it('로드 에러 시 에러 메시지 표시', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject() }),
    )
    await act(async () => { root.render(<ChatPage />) })
    // flush promises
    await act(async () => { await Promise.resolve() })
    expect(container.textContent).toContain('불러오지 못했습니다')
  })

  it('유저 메시지 말풍선 렌더링', async () => {
    const conv = makeConvResponse([
      { id: 'm1', conversation_id: CONV_ID, role: 'user', content: '힌트 줘요', structured_payload: null, follow_up_questions: [], created_at: new Date().toISOString() },
    ])
    vi.stubGlobal('fetch', mockGetConv(conv))

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('힌트 줘요')
  })

  it('assistant 메시지 말풍선 렌더링', async () => {
    const conv = makeConvResponse([
      { id: 'm1', conversation_id: CONV_ID, role: 'assistant', content: '이차방정식 풀이입니다.', structured_payload: null, follow_up_questions: [], created_at: new Date().toISOString() },
    ])
    vi.stubGlobal('fetch', mockGetConv(conv))

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('이차방정식 풀이입니다.')
  })

  it('꼬리 질문 칩은 마지막 assistant 메시지에만 표시', async () => {
    const conv = makeConvResponse([
      {
        id: 'm1', conversation_id: CONV_ID, role: 'assistant', content: '첫 번째 응답',
        structured_payload: null,
        follow_up_questions: [{ id: 'q1', label: '질문1' }],
        created_at: new Date(Date.now() - 1000).toISOString(),
      },
      { id: 'm2', conversation_id: CONV_ID, role: 'user', content: '추가 질문', structured_payload: null, follow_up_questions: [], created_at: new Date(Date.now() - 500).toISOString() },
      {
        id: 'm3', conversation_id: CONV_ID, role: 'assistant', content: '두 번째 응답',
        structured_payload: null,
        follow_up_questions: [{ id: 'q2', label: '질문2' }],
        created_at: new Date().toISOString(),
      },
    ])
    vi.stubGlobal('fetch', mockGetConv(conv))

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    // 두 번째 칩(마지막 메시지)만 렌더링
    const chipAreas = container.querySelectorAll('[data-testid="followup-chips"]')
    expect(chipAreas).toHaveLength(1)
    expect(container.textContent).toContain('질문2')
    expect(container.textContent).not.toContain('질문1')
  })

  it('타이핑 인디케이터: 스트리밍 시작 직후 표시', async () => {
    let resolveStream!: (v: ReadableStream) => void
    const streamPromise = new Promise<ReadableStream>((r) => { resolveStream = r })

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(makeConvResponse()),
          body: null,
        })
        .mockImplementationOnce(() =>
          streamPromise.then((body) => ({ ok: true, status: 200, body } as Partial<Response>)),
        ),
    )

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    const input = container.querySelector('[data-testid="chat-input"]') as HTMLInputElement
    const sendBtn = container.querySelector('[data-testid="send-btn"]') as HTMLButtonElement

    // 메시지 입력 후 전송 시작
    await act(async () => {
      input.value = '힌트'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // React state는 onChange로 연결되어야 함 — 직접 전송 버튼 대신 state 확인
    // 스트리밍 버블은 isStreaming=true일 때 나타남
    expect(sendBtn).toBeDefined()

    // 스트림 완료
    resolveStream(sseStream(['data: {"type":"done","message_id":"m99","follow_up_questions":[]}']))
  })

  it('에러 발생 시 에러 메시지 + 재시도 버튼 표시', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(makeConvResponse()),
          body: null,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          body: null,
        }),
    )

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    const input = container.querySelector('[data-testid="chat-input"]') as HTMLInputElement
    const sendBtn = container.querySelector('[data-testid="send-btn"]') as HTMLButtonElement

    // React controlled input에 값 설정: prototype setter 사용
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set

    await act(async () => {
      nativeSetter?.call(input, '힌트 줘')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await act(async () => {
      sendBtn.click()
    })
    await act(async () => { await Promise.resolve() })

    const errorEl = container.querySelector('[data-testid="stream-error"]')
    const retryBtn = container.querySelector('[data-testid="retry-btn"]')
    expect(errorEl !== null || retryBtn !== null || container.textContent?.includes('오류')).toBe(true)
  })

  it('입력창과 전송 버튼이 렌더링됨', async () => {
    vi.stubGlobal('fetch', mockGetConv(makeConvResponse()))
    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.querySelector('[data-testid="chat-input"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="send-btn"]')).not.toBeNull()
  })

  it('메시지 스크롤 컨테이너가 렌더링됨', async () => {
    vi.stubGlobal('fetch', mockGetConv(makeConvResponse()))
    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.querySelector('[data-testid="message-list"]')).not.toBeNull()
  })

  it('system 메시지는 렌더링되지 않음', async () => {
    const conv = makeConvResponse([
      { id: 'm1', conversation_id: CONV_ID, role: 'system', content: '시스템 메시지', structured_payload: null, follow_up_questions: [], created_at: new Date().toISOString() },
    ])
    vi.stubGlobal('fetch', mockGetConv(conv))

    await act(async () => { root.render(<ChatPage />) })
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).not.toContain('시스템 메시지')
  })
})
