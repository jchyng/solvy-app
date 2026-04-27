import type { AnalysisResult } from '../ai/roles/analyze.js';

export type { AnalysisResult };

export interface ProblemSession {
  id: string
  user_id: string
  original_image_url: string | null
  status: 'uploading' | 'analyzing' | 'confirming' | 'done' | 'error'
  recognized_problem: { text: string; confidence?: number } | null
  classification: { difficulty: string; concepts: string[] } | null
  analysis_result: AnalysisResult | null
  created_at: string
  completed_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'light' | 'pro'
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string | null
  created_at: string
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

export interface WaitlistEntry {
  id: string
  email: string
  invited_at: string | null
  joined_at: string | null
  created_at: string
}

export interface InviteCode {
  id: string
  code: string
  email: string | null
  used_at: string | null
  expires_at: string
  created_at: string
}

export interface DbUser {
  id: string
  email: string
  name: string
  tier: string
  is_beta_tester: boolean
  created_at: string
}
