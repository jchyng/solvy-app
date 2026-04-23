// Source: server/src/lib/db/types.ts (keep in sync manually)

export interface FollowUpQuestion {
  id: string
  label: string
}

export interface AnalysisResult {
  intent: string
  concepts: string[]
  optimal_solution: {
    steps: Array<{ title: string; detail: string; visualization_hint?: string }>
  }
  exam_tips: string[]
  follow_up_questions: FollowUpQuestion[]
  confidence: number
}

export interface ProblemSessionResponse {
  id: string
  user_id: string
  original_image_url: string
  status: 'uploading' | 'analyzing' | 'confirming' | 'done' | 'error'
  recognized_problem: { text: string; confidence?: number } | null
  classification: { difficulty: string; concepts: string[] } | null
  analysis_result: AnalysisResult | null
  conversation_id: string | null
  created_at: string
  completed_at: string | null
}

export interface ProblemStatusResponse {
  status: string
  conversationId?: string
}

export interface MessageResponse {
  id: string
  conversation_id: string
  role: 'system' | 'assistant' | 'user'
  content: string
  structured_payload: AnalysisResult | null
  follow_up_questions: FollowUpQuestion[]
  created_at: string
}
