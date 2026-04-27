import { createClient } from '@supabase/supabase-js';
import type { Bindings } from '../../types/env.js';
import type { ProblemSession, Conversation, Message, Folder, WaitlistEntry, InviteCode, DbUser } from './types.js';

export interface CreateSessionData {
  userId: string
  imageUrl: string | null
  initialStatus?: 'uploading' | 'analyzing'
  initialRecognizedProblem?: { text: string } | null
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

export interface UpdateConversationData {
  title?: string | null
  is_favorite?: boolean
  auto_title?: string | null
  deleted_at?: string | null
}

export interface CreateMessageData {
  conversationId: string
  role: 'system' | 'assistant' | 'user'
  content: string
  structuredPayload?: unknown
  followUpQuestions?: Array<{ id: string; label: string }>
  idempotencyKey?: string
}

export interface CreateFolderData {
  userId: string
  name: string
  color: string
}

export interface UpdateFolderData {
  name?: string
  color?: string
  position?: number
}

export interface DbClient {
  inviteCodes: {
    findByCode(code: string): Promise<InviteCode | null>
    markUsed(id: string): Promise<void>
  }
  users: {
    findByEmail(email: string): Promise<DbUser | null>
    create(data: { email: string; name: string; is_beta_tester: boolean }): Promise<DbUser>
  }
  waitlist: {
    register(email: string): Promise<WaitlistEntry>
    findByEmail(email: string): Promise<WaitlistEntry | null>
    count(): Promise<number>
  }
  usageEvents: {
    sumCostToday(date: string): Promise<number>
    errorRateLast10Min(): Promise<{ total: number; errors: number }>
    topUsersByCallsToday(date: string): Promise<Array<{ userId: string; count: number }>>
  }
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
    update(id: string, data: UpdateConversationData): Promise<Conversation>
    updateLastMessageAt(id: string): Promise<void>
  }
  messages: {
    create(data: CreateMessageData): Promise<Message>
    listByConversation(conversationId: string): Promise<Message[]>
    findByIdempotencyKey(conversationId: string, key: string): Promise<Message | null>
  }
  folders: {
    create(data: CreateFolderData): Promise<Folder>
    list(userId: string): Promise<Folder[]>
    findById(id: string): Promise<Folder | null>
    update(id: string, data: UpdateFolderData): Promise<Folder>
    delete(id: string): Promise<void>
    addConversation(folderId: string, conversationId: string): Promise<void>
    removeConversation(folderId: string, conversationId: string): Promise<void>
    listConversations(folderId: string): Promise<Conversation[]>
  }
}

export function createDbClient(env: Bindings): DbClient {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  return {
    inviteCodes: {
      async findByCode(code) {
        const { data, error } = await supabase
          .from('invite_codes')
          .select()
          .eq('code', code)
          .maybeSingle()
        if (error) throw new Error(error.message)
        return data as InviteCode | null
      },
      async markUsed(id) {
        const { error } = await supabase
          .from('invite_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw new Error(error.message)
      },
    },
    users: {
      async findByEmail(email) {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('email', email)
          .maybeSingle()
        if (error) throw new Error(error.message)
        return data as DbUser | null
      },
      async create({ email, name, is_beta_tester }) {
        const { data, error } = await supabase
          .from('users')
          .insert({ email, name, tier: 'free', is_beta_tester })
          .select()
          .single()
        if (error) throw new Error(error.message)
        return data as DbUser
      },
    },
    waitlist: {
      async register(email) {
        const { data, error } = await supabase
          .from('waitlist')
          .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
          .select()
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) {
          const { data: existing, error: err2 } = await supabase
            .from('waitlist')
            .select()
            .eq('email', email)
            .single()
          if (err2) throw new Error(err2.message)
          return existing as WaitlistEntry
        }
        return data as WaitlistEntry
      },
      async findByEmail(email) {
        const { data, error } = await supabase
          .from('waitlist')
          .select()
          .eq('email', email)
          .maybeSingle()
        if (error) throw new Error(error.message)
        return data as WaitlistEntry | null
      },
      async count() {
        const { count, error } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
        if (error) throw new Error(error.message)
        return count ?? 0
      },
    },
    usageEvents: {
      async sumCostToday(date) {
        const start = `${date}T00:00:00.000Z`
        const end = `${date}T23:59:59.999Z`
        const { data, error } = await supabase
          .from('usage_events')
          .select('cost_usd')
          .gte('created_at', start)
          .lte('created_at', end)
          .eq('success', true)
        if (error) throw new Error(error.message)
        return (data ?? []).reduce((sum, row) => sum + (Number(row.cost_usd) || 0), 0)
      },
      async errorRateLast10Min() {
        const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const { data, error } = await supabase
          .from('usage_events')
          .select('success')
          .gte('created_at', since)
        if (error) throw new Error(error.message)
        const rows = data ?? []
        return {
          total: rows.length,
          errors: rows.filter((r) => !r.success).length,
        }
      },
      async topUsersByCallsToday(date) {
        const start = `${date}T00:00:00.000Z`
        const end = `${date}T23:59:59.999Z`
        const { data, error } = await supabase
          .from('usage_events')
          .select('user_id')
          .gte('created_at', start)
          .lte('created_at', end)
        if (error) throw new Error(error.message)
        const counts = new Map<string, number>()
        for (const row of (data ?? [])) {
          const uid = row.user_id as string
          counts.set(uid, (counts.get(uid) ?? 0) + 1)
        }
        return Array.from(counts.entries())
          .map(([userId, count]) => ({ userId, count }))
          .sort((a, b) => b.count - a.count)
      },
    },
    sessions: {
      async create({ userId, imageUrl, initialStatus = 'uploading', initialRecognizedProblem = null }) {
        const { data, error } = await supabase
          .from('problem_sessions')
          .insert({
            user_id: userId,
            original_image_url: imageUrl,
            status: initialStatus,
            recognized_problem: initialRecognizedProblem,
          })
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
      async update(id, data) {
        const row: Record<string, unknown> = {};
        if (data.title !== undefined) row['title'] = data.title;
        if (data.is_favorite !== undefined) row['is_favorite'] = data.is_favorite;
        if (data.auto_title !== undefined) row['auto_title'] = data.auto_title;
        if (data.deleted_at !== undefined) row['deleted_at'] = data.deleted_at;
        const { data: updated, error } = await supabase
          .from('conversations')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return updated as Conversation;
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
    folders: {
      async create({ userId, name, color }) {
        const { data: existing } = await supabase
          .from('note_folders')
          .select('position')
          .eq('user_id', userId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextPosition = existing ? (existing as { position: number }).position + 1 : 0;

        const { data, error } = await supabase
          .from('note_folders')
          .insert({ user_id: userId, name, color, position: nextPosition })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Folder;
      },
      async list(userId) {
        const { data, error } = await supabase
          .from('note_folders')
          .select('*, conversation_folders(count)')
          .eq('user_id', userId)
          .order('position', { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []) as unknown as Folder[];
      },
      async findById(id) {
        const { data, error } = await supabase
          .from('note_folders')
          .select()
          .eq('id', id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as Folder | null;
      },
      async update(id, data) {
        const row: Record<string, unknown> = {};
        if (data.name !== undefined) row['name'] = data.name;
        if (data.color !== undefined) row['color'] = data.color;
        if (data.position !== undefined) row['position'] = data.position;
        const { data: updated, error } = await supabase
          .from('note_folders')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return updated as Folder;
      },
      async delete(id) {
        const { error } = await supabase.from('note_folders').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
      async addConversation(folderId, conversationId) {
        const { error } = await supabase
          .from('conversation_folders')
          .upsert({ folder_id: folderId, conversation_id: conversationId });
        if (error) throw new Error(error.message);
      },
      async removeConversation(folderId, conversationId) {
        const { error } = await supabase
          .from('conversation_folders')
          .delete()
          .eq('folder_id', folderId)
          .eq('conversation_id', conversationId);
        if (error) throw new Error(error.message);
      },
      async listConversations(folderId) {
        const { data, error } = await supabase
          .from('conversation_folders')
          .select('conversations(*)')
          .eq('folder_id', folderId);
        if (error) throw new Error(error.message);
        return ((data ?? []) as Array<{ conversations: Conversation }>)
          .map((r) => r.conversations)
          .filter(Boolean);
      },
    },
  };
}
