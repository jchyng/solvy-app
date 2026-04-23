import type { SupabaseClient } from '@supabase/supabase-js';
import type { UnifiedLLMResponse, LLMError } from '../types.js';

export interface TrackParams {
  userId?: string;
  sessionId?: string;
  role: string;
  provider: string;
  model: string;
  response?: UnifiedLLMResponse;
  error?: LLMError;
  fallbackDepth: number;
}

export class Tracker {
  constructor(private readonly supabase: SupabaseClient) {}

  async record(params: TrackParams): Promise<void> {
    const { userId, sessionId, role, provider, model, response, error, fallbackDepth } = params;

    await this.supabase.from('usage_events').insert({
      user_id: userId ?? null,
      session_id: sessionId ?? null,
      role,
      provider,
      model,
      input_tokens: response?.usage.inputTokens ?? 0,
      output_tokens: response?.usage.outputTokens ?? 0,
      cached_tokens: response?.usage.cachedTokens ?? 0,
      cost_usd: response?.cost.amountUsd ?? 0,
      latency_ms: response?.metadata.latencyMs ?? 0,
      success: error == null,
      error_type: error?.code ?? null,
      fallback_depth: fallbackDepth,
    });
  }
}
