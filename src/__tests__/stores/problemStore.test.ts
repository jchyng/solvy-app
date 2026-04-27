import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useProblemStore } from '@/stores/problemStore'

vi.mock('@/services/api')

import { api } from '@/services/api'

const mockUpload = vi.mocked(api.problems.upload)
const mockStatus = vi.mocked(api.problems.status)
const mockGet = vi.mocked(api.problems.get)
const mockConfirm = vi.mocked(api.problems.confirm)

function makeFile(): File {
  return new File(['x'], 'test.jpg', { type: 'image/jpeg' })
}

function ok(data: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(data) } as unknown as Response
}

function err(status = 500) {
  return { ok: false, status } as unknown as Response
}

beforeEach(() => {
  vi.useFakeTimers()
  useProblemStore.getState().reset()
  vi.clearAllMocks()
})

afterEach(() => {
  useProblemStore.getState()._stopPolling()
  vi.useRealTimers()
})

async function setupPolling(sessionId = 'sess-1') {
  mockUpload.mockResolvedValue(ok({ id: sessionId }))
  mockStatus.mockResolvedValue(ok({ status: 'analyzing' }))
  await useProblemStore.getState().upload(makeFile())
  expect(useProblemStore.getState().phase).toBe('polling')
}

describe('useProblemStore', () => {
  it('초기 상태 검증', () => {
    const s = useProblemStore.getState()
    expect(s.phase).toBe('idle')
    expect(s.sessionId).toBeNull()
    expect(s.recognizedText).toBeNull()
    expect(s.analysisResult).toBeNull()
    expect(s.conversationId).toBeNull()
    expect(s.errorMessage).toBeNull()
  })

  describe('upload()', () => {
    it('성공 시 phase: uploading → polling, sessionId 저장', async () => {
      mockUpload.mockResolvedValue(ok({ id: 'sess-1' }))
      mockStatus.mockResolvedValue(ok({ status: 'analyzing' }))
      await useProblemStore.getState().upload(makeFile())
      const s = useProblemStore.getState()
      expect(s.phase).toBe('polling')
      expect(s.sessionId).toBe('sess-1')
    })

    it('HTTP 오류 시 phase: error, errorMessage 설정', async () => {
      mockUpload.mockResolvedValue(err(413))
      await useProblemStore.getState().upload(makeFile())
      const s = useProblemStore.getState()
      expect(s.phase).toBe('error')
      expect(s.errorMessage).toMatch(/업로드 실패/)
    })

    it('네트워크 오류 시 phase: error', async () => {
      mockUpload.mockRejectedValue(new Error('Network error'))
      await useProblemStore.getState().upload(makeFile())
      expect(useProblemStore.getState().phase).toBe('error')
    })
  })

  describe('polling', () => {
    it('status=done → phase: done, conversationId 저장', async () => {
      await setupPolling()
      mockStatus.mockResolvedValue(ok({ status: 'done', conversationId: 'conv-1' }))
      mockGet.mockResolvedValue(ok({ analysis_result: null }))
      await vi.advanceTimersByTimeAsync(2000)
      const s = useProblemStore.getState()
      expect(s.phase).toBe('done')
      expect(s.conversationId).toBe('conv-1')
    })

    it('status=confirming → phase: confirming, recognizedText 저장', async () => {
      await setupPolling()
      mockStatus.mockResolvedValue(ok({ status: 'confirming' }))
      mockGet.mockResolvedValue(ok({ recognized_problem: { text: '∫ x dx = ?' } }))
      await vi.advanceTimersByTimeAsync(2000)
      const s = useProblemStore.getState()
      expect(s.phase).toBe('confirming')
      expect(s.recognizedText).toBe('∫ x dx = ?')
    })

    it('status=error → phase: error', async () => {
      await setupPolling()
      mockStatus.mockResolvedValue(ok({ status: 'error' }))
      await vi.advanceTimersByTimeAsync(2000)
      expect(useProblemStore.getState().phase).toBe('error')
    })

    it('MAX_POLLS(30) 초과 시 타임아웃 오류', async () => {
      await setupPolling()
      // tick 31에서 pollCount > 30 → 타임아웃 (tick 1~30은 'analyzing' 반환)
      await vi.advanceTimersByTimeAsync(2000 * 31)
      const s = useProblemStore.getState()
      expect(s.phase).toBe('error')
      expect(s.errorMessage).toBe('분석 시간 초과')
    })

    it('개별 poll 네트워크 오류 → 무시하고 polling 유지', async () => {
      await setupPolling()
      mockStatus.mockRejectedValueOnce(new Error('Network error'))
      await vi.advanceTimersByTimeAsync(2000)
      expect(useProblemStore.getState().phase).toBe('polling')
    })

    it('status API ok=false → 무시하고 polling 유지', async () => {
      await setupPolling()
      mockStatus.mockResolvedValue(err(503))
      await vi.advanceTimersByTimeAsync(2000)
      expect(useProblemStore.getState().phase).toBe('polling')
    })
  })

  describe('confirm()', () => {
    it('성공 시 phase: polling으로 전환 및 재폴링 시작', async () => {
      useProblemStore.setState({ sessionId: 'sess-1', phase: 'confirming' })
      mockConfirm.mockResolvedValue({ ok: true } as Response)
      mockStatus.mockResolvedValue(ok({ status: 'analyzing' }))
      await useProblemStore.getState().confirm('edited text')
      expect(useProblemStore.getState().phase).toBe('polling')
      expect(mockConfirm).toHaveBeenCalledWith('sess-1', { text: 'edited text' })
    })

    it('실패 시 phase: error', async () => {
      useProblemStore.setState({ sessionId: 'sess-1', phase: 'confirming' })
      mockConfirm.mockResolvedValue(err(500))
      await useProblemStore.getState().confirm('text')
      expect(useProblemStore.getState().phase).toBe('error')
    })

    it('sessionId 없으면 아무것도 안 함', async () => {
      useProblemStore.setState({ sessionId: null, phase: 'idle' })
      await useProblemStore.getState().confirm('text')
      expect(mockConfirm).not.toHaveBeenCalled()
    })
  })

  describe('reset()', () => {
    it('모든 상태 초기화 및 폴링 정지', async () => {
      await setupPolling()
      useProblemStore.getState().reset()
      const s = useProblemStore.getState()
      expect(s.phase).toBe('idle')
      expect(s.sessionId).toBeNull()
      expect(s.conversationId).toBeNull()
      // reset 후 timer가 정지됐는지 확인 — 추가 poll 없어야 함
      vi.clearAllMocks()
      await vi.advanceTimersByTimeAsync(4000)
      expect(mockStatus).not.toHaveBeenCalled()
    })
  })

  describe('upload() 중복 호출', () => {
    it('두 번째 upload 시 기존 폴링 정지 후 새 폴링 시작 (타이머 누수 없음)', async () => {
      mockUpload.mockResolvedValue(ok({ id: 'sess-1' }))
      mockStatus.mockResolvedValue(ok({ status: 'analyzing' }))
      await useProblemStore.getState().upload(makeFile())
      expect(useProblemStore.getState().sessionId).toBe('sess-1')

      mockUpload.mockResolvedValue(ok({ id: 'sess-2' }))
      await useProblemStore.getState().upload(makeFile())
      expect(useProblemStore.getState().sessionId).toBe('sess-2')

      // clearAllMocks 후 남은 poll 횟수 측정
      vi.clearAllMocks()
      mockStatus.mockResolvedValue(ok({ status: 'analyzing' }))
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockStatus).toHaveBeenCalledTimes(1)
    })
  })
})
