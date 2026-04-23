import type { LLMAdapter, LLMCallParams } from './base.js';
import type { UnifiedLLMResponse } from '../types.js';
import { LLMError } from '../types.js';

// USD per 1M tokens
const COSTS: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25, cacheWrite: 0.30, cacheRead: 0.03 },
};

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  stop_reason: string;
}

export class AnthropicAdapter implements LLMAdapter {
  readonly provider = 'anthropic';

  constructor(private readonly apiKey: string) {}

  async generate(params: LLMCallParams): Promise<UnifiedLLMResponse> {
    const { messages, model, systemPrompt, maxTokens = 4096, enableCaching = false } = params;

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
    if (enableCaching) {
      headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    };

    if (systemPrompt) {
      body.system = enableCaching
        ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
        : systemPrompt;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    const startedAt = Date.now();

    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new LLMError('Anthropic request timed out', 'anthropic', 'timeout', true, e);
      }
      throw new LLMError('Anthropic fetch failed', 'anthropic', 'unknown', true, e);
    }
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startedAt;

    if (res.status === 401 || res.status === 403) {
      throw new LLMError('Anthropic auth failed', 'anthropic', 'auth', false);
    }
    if (res.status === 429) {
      throw new LLMError('Anthropic rate limit', 'anthropic', 'rate_limit', true);
    }
    if (!res.ok) {
      throw new LLMError(`Anthropic error ${res.status}`, 'anthropic', 'unknown', res.status >= 500);
    }

    let data: AnthropicResponse;
    try {
      data = (await res.json()) as AnthropicResponse;
    } catch (e) {
      throw new LLMError('Anthropic invalid JSON response', 'anthropic', 'invalid_response', false, e);
    }

    const textBlock = data.content.find((b) => b.type === 'text');
    if (!textBlock) {
      throw new LLMError('Anthropic: no text content in response', 'anthropic', 'invalid_response', false);
    }

    const u = data.usage;
    const cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
    const cacheReadTokens = u.cache_read_input_tokens ?? 0;
    const costs = COSTS[model] ?? COSTS['claude-sonnet-4-6'];
    const amountUsd =
      (u.input_tokens * costs.input +
        u.output_tokens * costs.output +
        cacheWriteTokens * costs.cacheWrite +
        cacheReadTokens * costs.cacheRead) /
      1_000_000;

    let structuredOutput: unknown;
    try {
      structuredOutput = JSON.parse(textBlock.text);
    } catch {
      // plain text response — leave undefined
    }

    const stopReason = data.stop_reason;
    const finishReason =
      stopReason === 'end_turn' ? 'stop' : stopReason === 'max_tokens' ? 'length' : 'error';

    return {
      content: textBlock.text,
      structuredOutput,
      usage: {
        inputTokens: u.input_tokens,
        outputTokens: u.output_tokens,
        cachedTokens: cacheReadTokens,
      },
      cost: { amountUsd, provider: 'anthropic', model },
      metadata: { latencyMs, finishReason },
    };
  }
}
