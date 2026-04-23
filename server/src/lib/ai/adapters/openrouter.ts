import type { LLMAdapter, LLMCallParams } from './base.js';
import type { UnifiedLLMResponse } from '../types.js';
import { LLMError } from '../types.js';

// USD per 1M tokens
const COSTS: Record<string, { input: number; output: number }> = {
  'deepseek/deepseek-r1': { input: 0.55, output: 2.19 },
  'deepseek/deepseek-chat': { input: 0.27, output: 1.10 },
  'qwen/qwen3-8b': { input: 0.06, output: 0.60 },
};

interface OpenRouterResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
}

export class OpenRouterAdapter implements LLMAdapter {
  readonly provider = 'openrouter';

  constructor(private readonly apiKey: string) {}

  async generate(params: LLMCallParams): Promise<UnifiedLLMResponse> {
    const { messages, model, systemPrompt, maxTokens = 4096 } = params;

    const allMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.filter((m) => m.role !== 'system'),
    ];

    const body = { model, max_tokens: maxTokens, messages: allMessages };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    const startedAt = Date.now();

    let res: Response;
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new LLMError('OpenRouter request timed out', 'openrouter', 'timeout', true, e);
      }
      throw new LLMError('OpenRouter fetch failed', 'openrouter', 'unknown', true, e);
    }
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startedAt;

    if (res.status === 401 || res.status === 403) {
      throw new LLMError('OpenRouter auth failed', 'openrouter', 'auth', false);
    }
    if (res.status === 429) {
      throw new LLMError('OpenRouter rate limit', 'openrouter', 'rate_limit', true);
    }
    if (!res.ok) {
      throw new LLMError(`OpenRouter error ${res.status}`, 'openrouter', 'unknown', res.status >= 500);
    }

    let data: OpenRouterResponse;
    try {
      data = (await res.json()) as OpenRouterResponse;
    } catch (e) {
      throw new LLMError('OpenRouter invalid JSON response', 'openrouter', 'invalid_response', false, e);
    }

    const choice = data.choices?.[0];
    if (!choice) {
      throw new LLMError('OpenRouter: no choices in response', 'openrouter', 'invalid_response', false);
    }

    const text = choice.message.content;
    const u = data.usage;
    const costs = COSTS[model] ?? { input: 1.0, output: 1.0 };
    const amountUsd =
      (u.prompt_tokens * costs.input + u.completion_tokens * costs.output) / 1_000_000;

    let structuredOutput: unknown;
    try {
      structuredOutput = JSON.parse(text);
    } catch {
      // plain text response
    }

    const finishReason =
      choice.finish_reason === 'stop'
        ? 'stop'
        : choice.finish_reason === 'length'
          ? 'length'
          : 'error';

    return {
      content: text,
      structuredOutput,
      usage: {
        inputTokens: u.prompt_tokens,
        outputTokens: u.completion_tokens,
      },
      cost: { amountUsd, provider: 'openrouter', model },
      metadata: { latencyMs, finishReason },
    };
  }
}
