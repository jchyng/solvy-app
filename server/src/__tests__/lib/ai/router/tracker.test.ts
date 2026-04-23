import { describe, it, expect, vi } from 'vitest'
import { Tracker } from '../../../../lib/ai/router/tracker.js'
import type { UnifiedLLMResponse, LLMError } from '../../../../lib/ai/types.js'

function makeResponse(overrides: Partial<UnifiedLLMResponse> = {}): UnifiedLLMResponse {
  return {
    content: 'ok',
    usage: { inputTokens: 100, outputTokens: 50, cachedTokens: 20 },
    cost: { amountUsd: 0.001, provider: 'anthropic', model: 'claude-sonnet-4-6' },
    metadata: { latencyMs: 300, finishReason: 'stop' },
    ...overrides,
  };
}

function makeMockSupabase() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ insert });
  return { supabase: { from } as never, insert, from };
}

describe('Tracker', () => {
  it('success → inserts correct fields into usage_events', async () => {
    const { supabase, from, insert } = makeMockSupabase();
    const tracker = new Tracker(supabase);

    await tracker.record({
      userId: 'user-1',
      sessionId: 'session-1',
      role: 'analyze',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      response: makeResponse(),
      fallbackDepth: 0,
    });

    expect(from).toHaveBeenCalledWith('usage_events');
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      session_id: 'session-1',
      role: 'analyze',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      input_tokens: 100,
      output_tokens: 50,
      cached_tokens: 20,
      cost_usd: 0.001,
      latency_ms: 300,
      success: true,
      error_type: null,
      fallback_depth: 0,
    });
  });

  it('error → success=false, error_type set, cost/tokens zeroed', async () => {
    const { supabase, insert } = makeMockSupabase();
    const tracker = new Tracker(supabase);
    const err = { code: 'rate_limit' } as LLMError;

    await tracker.record({
      userId: 'user-1',
      sessionId: 'session-1',
      role: 'chat',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      error: err,
      fallbackDepth: 0,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error_type: 'rate_limit',
        cost_usd: 0,
        input_tokens: 0,
        output_tokens: 0,
      }),
    );
  });

  it('cached_tokens populated in usage_events', async () => {
    const { supabase, insert } = makeMockSupabase();
    const tracker = new Tracker(supabase);

    await tracker.record({
      role: 'chat',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      response: makeResponse({ usage: { inputTokens: 200, outputTokens: 100, cachedTokens: 150 } }),
      fallbackDepth: 0,
    });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ cached_tokens: 150 }));
  });

  it('fallback_depth is recorded correctly', async () => {
    const { supabase, insert } = makeMockSupabase();
    const tracker = new Tracker(supabase);

    await tracker.record({
      role: 'analyze',
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1',
      response: makeResponse(),
      fallbackDepth: 1,
    });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ fallback_depth: 1 }));
  });

  it('null userId/sessionId → user_id/session_id null (not undefined)', async () => {
    const { supabase, insert } = makeMockSupabase();
    const tracker = new Tracker(supabase);

    await tracker.record({
      role: 'classify',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      response: makeResponse(),
      fallbackDepth: 0,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null, session_id: null }),
    );
  });
});
