import { createClient } from '@supabase/supabase-js';
import type { Bindings } from '../../types/env.js';
import type { ProblemSession, Conversation, Message } from './types.js';

export interface CreateSessionData {
  userId: string
  imageUrl: string
}

export interface CreateConversationData {
  userId: string
  sessionId: string
  autoTitle?: string
}

export interface ConversationListOptions {
  page?: number
  limit?: number
  favorite?: boolean
}

export interface CreateMessageData {
  conversationId: string
  role: 'system' | 'assistant' | 'user'
  content: string
  structuredPayload?: unknown
  followUpQuestions?: Array<{ id: string; label: string }>
  idempotencyKey?: string
}

export interface DbClient {
  sessions: {
    create(data: CreateSessionData): Promise<ProblemSession>
    update(id: string, data: Partial<ProblemSession>): Promise<void>
    findById(id: string): Promise<ProblemSession | null>
  }
  conversations: {
    create(data: CreateConversationData): Promise<Conversation>
    findBySessionId(sessionId: string): Promise<Conversation | null>
    findById(id: string): Promise<Conversation | null>
    list(userId: string, options?: ConversationListOptions): Promise<Conversation[]>
    updateLastMessageAt(id: string): Promise<void>
  }
  messages: {
    create(data: CreateMessageData): Promise<Message>
    listByConversation(conversationId: string): Promise<Message[]>
    findByIdempotencyKey(conversationId: string, key: string): Promise<Message | null>
  }
}

export function createDbClient(env: Bindings): DbClient {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  return {
    sessions: {
      async create({ userId, imageUrl }) {
        const { data, error } = await supabase
          .from('problem_sessions')
          .insert({ user_id: userId, original_image_url: imageUrl, status: 'uploading' })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as ProblemSession;
      },
      async update(id, data) {
        const row: Record<string, unknown> = {};
        if (data.status !== undefined) row['status'] = data.status;
        if (data.recognized_problem !== undefined) row['recognized_problem'] = data.recognized_problem;
        if (data.classification !== undefined) row['classification'] = data.classification;
        if (data.analysis_result !== undefined) row['analysis_result'] = data.analysis_result;
        if (data.completed_at !== undefined) row['completed_at'] = data.completed_at;
        const { error } = await supabase.from('problem_sessions').update(row).eq('id', id);
        if (error) throw new Error(error.message);
      },
      async findById(id) {
        const { data, error } = await supabase
          .from('problem_sessions')
          .select()
          .eq('id', id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as ProblemSession | null;
      },
    },
    conversations: {
      async create({ userId, sessionId, autoTitle }) {
        const { data, error } = await supabase
          .from('conversations')
          .insert({ user_id: userId, problem_session_id: sessionId, auto_title: autoTitle ?? null })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Conversation;
      },
      async findBySessionId(sessionId) {
        const { data, error } = await supabase
          .from('conversations')
          .select()
          .eq('problem_session_id', sessionId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as Conversation | null;
      },
      async findById(id) {
        const { data, error } = await supabase
          .from('conversations')
          .select()
          .eq('id', id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as Conversation | null;
      },
      async list(userId, options = {}) {
        const { page = 0, limit = 20, favorite } = options;
        let query = supabase
          .from('conversations')
          .select()
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('last_message_at', { ascending: false })
          .range(page * limit, (page + 1) * limit - 1);
        if (favorite === true) query = query.eq('is_favorite', true);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data ?? []) as Conversation[];
      },
      async updateLastMessageAt(id) {
        const { error } = await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw new Error(error.message);
      },
    },
    messages: {
      async create({ conversationId, role, content, structuredPayload, followUpQuestions, idempotencyKey }) {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role,
            content,
            structured_payload: structuredPayload ?? null,
            follow_up_questions: followUpQuestions ?? [],
            idempotency_key: idempotencyKey ?? null,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Message;
      },
      async listByConversation(conversationId) {
        const { data, error } = await supabase
          .from('messages')
          .select()
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []) as Message[];
      },
      async findByIdempotencyKey(conversationId, key) {
        const { data, error } = await supabase
          .from('messages')
          .select()
          .eq('conversation_id', conversationId)
          .eq('idempotency_key', key)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as Message | null;
      },
    },
  };
}
