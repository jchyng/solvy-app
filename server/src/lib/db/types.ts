import type { AnalysisResult } from '../ai/roles/analyze.js';

export type { AnalysisResult };

export interface ProblemSession {
  id: string
  user_id: string
  original_image_url: string
  status: 'uploading' | 'analyzing' | 'confirming' | 'done' | 'error'
  recognized_problem: { text: string; confidence?: number } | null
  classification: { difficulty: string; concepts: string[] } | null
  analysis_result: AnalysisResult | null
  created_at: string
  completed_at: string | null
}

export interface Conversation {
  id: string
  user_id: string
  problem_session_id: string
  title: string | null
  auto_title: string | null
  is_favorite: boolean
  last_message_at: string
  created_at: string
  deleted_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  role: 'system' | 'assistant' | 'user'
  content: string
  structured_payload: unknown | null
  follow_up_questions: Array<{ id: string; label: string }>
  idempotency_key: string | null
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  position: number
  created_at: string
}

export interface ConversationFolder {
  conversation_id: string
  folder_id: string
}
