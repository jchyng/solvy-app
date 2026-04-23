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

export interface CreateMessageData {
  conversationId: string
  role: 'system' | 'assistant' | 'user'
  content: string
  structuredPayload?: unknown
  followUpQuestions?: Array<{ id: string; label: string }>
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
  }
  messages: {
    create(data: CreateMessageData): Promise<Message>
    listByConversation(conversationId: string): Promise<Message[]>
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
    },
    messages: {
      async create({ conversationId, role, content, structuredPayload, followUpQuestions }) {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role,
            content,
            structured_payload: structuredPayload ?? null,
            follow_up_questions: followUpQuestions ?? [],
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
    },
  };
}
