import { create } from 'zustand'
import { api } from '@/services/api'
import type { AnalysisResult, ProblemSessionResponse, ProblemStatusResponse } from '@/types/api'

export type UploadPhase = 'idle' | 'uploading' | 'polling' | 'confirming' | 'done' | 'error'

interface ProblemStore {
  phase: UploadPhase
  sessionId: string | null
  recognizedText: string | null
  analysisResult: AnalysisResult | null
  conversationId: string | null
  errorMessage: string | null
  upload(file: File): Promise<void>
  confirm(text: string): Promise<void>
  reset(): void
  _startPolling(): void
  _stopPolling(): void
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollCount = 0
const MAX_POLLS = 30

export const useProblemStore = create<ProblemStore>((set, get) => ({
  phase: 'idle',
  sessionId: null,
  recognizedText: null,
  analysisResult: null,
  conversationId: null,
  errorMessage: null,

  async upload(file) {
    set({ phase: 'uploading', errorMessage: null })
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await api.problems.upload(form)
      if (!res.ok) throw new Error(`업로드 실패 (${res.status})`)
      const data = await res.json() as { id: string }
      set({ sessionId: data.id, phase: 'polling' })
      get()._startPolling()
    } catch (e) {
      set({ phase: 'error', errorMessage: e instanceof Error ? e.message : '업로드 중 오류 발생' })
    }
  },

  async confirm(text) {
    const { sessionId } = get()
    if (!sessionId) return
    set({ phase: 'uploading', errorMessage: null })
    try {
      const res = await api.problems.confirm(sessionId, { text })
      if (!res.ok) throw new Error(`확인 요청 실패 (${res.status})`)
      set({ phase: 'polling' })
      get()._startPolling()
    } catch (e) {
      set({ phase: 'error', errorMessage: e instanceof Error ? e.message : '재분석 요청 중 오류 발생' })
    }
  },

  reset() {
    get()._stopPolling()
    set({
      phase: 'idle',
      sessionId: null,
      recognizedText: null,
      analysisResult: null,
      conversationId: null,
      errorMessage: null,
    })
  },

  _startPolling() {
    get()._stopPolling()
    pollCount = 0
    pollTimer = setInterval(async () => {
      const { sessionId } = get()
      if (!sessionId) { get()._stopPolling(); return }

      pollCount += 1
      if (pollCount > MAX_POLLS) {
        get()._stopPolling()
        set({ phase: 'error', errorMessage: '분석 시간 초과' })
        return
      }

      try {
        const res = await api.problems.status(sessionId)
        if (!res.ok) return
        const data = await res.json() as ProblemStatusResponse

        if (data.status === 'done' && data.conversationId) {
          get()._stopPolling()
          const sessionRes = await api.problems.get(sessionId)
          const session = await sessionRes.json() as ProblemSessionResponse
          set({
            phase: 'done',
            conversationId: data.conversationId,
            analysisResult: session.analysis_result,
          })
        } else if (data.status === 'confirming') {
          get()._stopPolling()
          const sessionRes = await api.problems.get(sessionId)
          const session = await sessionRes.json() as ProblemSessionResponse
          set({
            phase: 'confirming',
            recognizedText: session.recognized_problem?.text ?? '',
          })
        } else if (data.status === 'error') {
          get()._stopPolling()
          set({ phase: 'error', errorMessage: '분석 중 오류가 발생했습니다' })
        }
      } catch {
        // 네트워크 에러는 다음 poll에서 재시도
      }
    }, 2000)
  },

  _stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  },
}))
