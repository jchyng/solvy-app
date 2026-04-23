import { describe, it, expect, vi } from 'vitest'
import { callWithFallback } from '../../../../lib/ai/router/router.js'
import type { RouterDeps } from '../../../../lib/ai/router/router.js'
import { LLMError } from '../../../../lib/ai/types.js'
import type { UnifiedLLMResponse } from '../../../../lib/ai/types.js'
import type { LLMAdapter } from '../../../../lib/ai/adapters/base.js'

function makeResponse(provider = 'anthropic', model = 'claude-sonnet-4-6'): UnifiedLLMResponse {
  return {
    content: 'ok',
    usage: { inputTokens: 100, outputTokens: 50 },
    cost: { amountUsd: 0.001, provider, model },
    metadata: { latencyMs: 200, finishReason: 'stop' },
  };
}

function makeAdapter(generate: LLMAdapter['generate']): LLMAdapter {
  return { provider: 'mock', generate };
}

function makeDeps(overrides: Partial<RouterDeps> = {}): RouterDeps {
  return {
    adapters: {},
    tracker: { record: vi.fn().mockResolvedValue(undefined) } as never,
    ...overrides,
  };
}

const baseParams = {
  role: 'analyze' as const,
  messages: [{ role: 'user' as const, content: 'Solve x^2=4' }],
  systemPrompt: 'You are a math tutor.',
  userId: 'user-1',
  sessionId: 'session-1',
};

// Disable retry delays in tests
const NO_DELAY = { maxRetriesPerProvider: 0, retryBaseDelayMs: 0 };

describe('callWithFallback', () => {

  it('primary provider succeeds → returns response', async () => {
    const response = makeResponse();
    const deps = makeDeps({
      adapters: { anthropic: makeAdapter(vi.fn().mockResolvedValue(response)) },
    });

    const result = await callWithFallback(baseParams, deps, NO_DELAY);
    expect(result).toBe(response);
  });

  it('primary succeeds → tracker called with fallback_depth=0', async () => {
    const response = makeResponse();
    const deps = makeDeps({
      adapters: { anthropic: makeAdapter(vi.fn().mockResolvedValue(response)) },
    });

    await callWithFallback(baseParams, deps, NO_DELAY);

    const call = (deps.tracker.record as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.fallbackDepth).toBe(0);
    expect(call.provider).toBe('anthropic');
    expect(call.response).toBe(response);
    expect(call.error).toBeUndefined();
  });

  it('primary retryable failure → retries up to maxRetriesPerProvider', async () => {
    const generate = vi.fn()
      .mockRejectedValueOnce(new LLMError('timeout', 'anthropic', 'timeout', true))
      .mockResolvedValue(makeResponse());

    const deps = makeDeps({
      adapters: { anthropic: makeAdapter(generate) },
    });

    // retryBaseDelayMs: 1 so sleep() is called, but with real timers it resolves immediately
    await callWithFallback(baseParams, deps, { maxRetriesPerProvider: 1, retryBaseDelayMs: 1 });
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('primary non-retryable → skips retries, moves to fallback immediately', async () => {
    const primaryGenerate = vi.fn().mockRejectedValue(
      new LLMError('auth failed', 'anthropic', 'auth', false),
    );
    const fallbackResponse = makeResponse('openrouter', 'deepseek/deepseek-r1');
    const fallbackGenerate = vi.fn().mockResolvedValue(fallbackResponse);

    const deps = makeDeps({
      adapters: {
        anthropic: makeAdapter(primaryGenerate),
        openrouter: makeAdapter(fallbackGenerate),
      },
    });

    const result = await callWithFallback(
      baseParams,
      deps,
      { maxRetriesPerProvider: 3, retryBaseDelayMs: 0 },
    );

    expect(primaryGenerate).toHaveBeenCalledTimes(1); // no retries
    expect(result).toBe(fallbackResponse);
  });

  it('Anthropic 장애 주입 → DeepSeek R1 자동 폴백', async () => {
    const anthropicGenerate = vi.fn().mockRejectedValue(
      new LLMError('Anthropic down', 'anthropic', 'timeout', true),
    );
    const deepseekResponse = makeResponse('openrouter', 'deepseek/deepseek-r1');
    const openrouterGenerate = vi.fn().mockResolvedValue(deepseekResponse);

    const deps = makeDeps({
      adapters: {
        anthropic: makeAdapter(anthropicGenerate),
        openrouter: makeAdapter(openrouterGenerate),
      },
    });

    const result = await callWithFallback(baseParams, deps, NO_DELAY);

    expect(result).toBe(deepseekResponse);
    expect(result.cost.provider).toBe('openrouter');
    expect(result.cost.model).toBe('deepseek/deepseek-r1');
  });

  it('fallback succeeds → tracker called with fallback_depth=1', async () => {
    const anthropicGenerate = vi.fn().mockRejectedValue(
      new LLMError('timeout', 'anthropic', 'timeout', true),
    );
    const deepseekResponse = makeResponse('openrouter', 'deepseek/deepseek-r1');

    const deps = makeDeps({
      adapters: {
        anthropic: makeAdapter(anthropicGenerate),
        openrouter: makeAdapter(() => Promise.resolve(deepseekResponse)),
      },
    });

    await callWithFallback(baseParams, deps, NO_DELAY);

    const calls = (deps.tracker.record as ReturnType<typeof vi.fn>).mock.calls;
    const successCall = calls.find((c) => c[0].response != null);
    expect(successCall?.[0].fallbackDepth).toBe(1);
    expect(successCall?.[0].provider).toBe('openrouter');
  });

  it('all providers fail → throws last LLMError', async () => {
    const lastError = new LLMError('OpenRouter down', 'openrouter', 'timeout', true);

    const deps = makeDeps({
      adapters: {
        anthropic: makeAdapter(vi.fn().mockRejectedValue(
          new LLMError('Anthropic down', 'anthropic', 'timeout', true),
        )),
        openrouter: makeAdapter(vi.fn().mockRejectedValue(lastError)),
        gemini: makeAdapter(vi.fn().mockRejectedValue(
          new LLMError('Gemini down', 'gemini', 'timeout', true),
        )),
      },
    });

    // analyze chain: anthropic → openrouter → gemini; last error comes from gemini
    await expect(callWithFallback(baseParams, deps, NO_DELAY)).rejects.toMatchObject({
      name: 'LLMError',
      provider: 'gemini',
    });
  });

  it('adapter not registered for a provider → skips silently', async () => {
    const response = makeResponse('openrouter', 'deepseek/deepseek-r1');
    const deps = makeDeps({
      adapters: {
        // anthropic missing — router should skip to openrouter
        openrouter: makeAdapter(vi.fn().mockResolvedValue(response)),
      },
    });

    const result = await callWithFallback(baseParams, deps, NO_DELAY);
    expect(result).toBe(response);
  });

  it('tracker failure does not propagate to caller', async () => {
    const response = makeResponse();
    const deps = makeDeps({
      adapters: { anthropic: makeAdapter(vi.fn().mockResolvedValue(response)) },
      tracker: { record: vi.fn().mockRejectedValue(new Error('DB down')) } as never,
    });

    // Should not throw despite tracker failure
    await expect(callWithFallback(baseParams, deps, NO_DELAY)).resolves.toBe(response);
  });
});
