import type { LLMAdapter, LLMCallParams } from './base.js';
import type { UnifiedLLMResponse } from '../types.js';
import { LLMError } from '../types.js';

// USD per 1M tokens
const COSTS: Record<string, { input: number; output: number }> = {
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 3.50, output: 10.50 },
};

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
}

export class GeminiAdapter implements LLMAdapter {
  readonly provider = 'gemini';

  constructor(private readonly apiKey: string) {}

  async generate(params: LLMCallParams): Promise<UnifiedLLMResponse> {
    const { messages, model, systemPrompt, maxTokens = 4096, jsonMode = false } = params;

    // Gemini uses "model" role instead of "assistant"
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    const startedAt = Date.now();

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new LLMError('Gemini request timed out', 'gemini', 'timeout', true, e);
      }
      throw new LLMError('Gemini fetch failed', 'gemini', 'unknown', true, e);
    }
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startedAt;

    if (res.status === 400 || res.status === 403) {
      throw new LLMError(`Gemini auth/bad request ${res.status}`, 'gemini', 'auth', false);
    }
    if (res.status === 429) {
      throw new LLMError('Gemini rate limit', 'gemini', 'rate_limit', true);
    }
    if (!res.ok) {
      throw new LLMError(`Gemini error ${res.status}`, 'gemini', 'unknown', res.status >= 500);
    }

    let data: GeminiResponse;
    try {
      data = (await res.json()) as GeminiResponse;
    } catch (e) {
      throw new LLMError('Gemini invalid JSON response', 'gemini', 'invalid_response', false, e);
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new LLMError('Gemini: no candidates in response', 'gemini', 'invalid_response', false);
    }

    const text = candidate.content.parts.map((p) => p.text).join('');
    const u = data.usageMetadata;
    const costs = COSTS[model] ?? COSTS['gemini-1.5-flash'];
    const amountUsd =
      (u.promptTokenCount * costs.input + u.candidatesTokenCount * costs.output) / 1_000_000;

    let structuredOutput: unknown;
    try {
      structuredOutput = JSON.parse(text);
    } catch {
      // plain text response
    }

    const finishReason =
      candidate.finishReason === 'STOP'
        ? 'stop'
        : candidate.finishReason === 'MAX_TOKENS'
          ? 'length'
          : 'error';

    return {
      content: text,
      structuredOutput,
      usage: {
        inputTokens: u.promptTokenCount,
        outputTokens: u.candidatesTokenCount,
      },
      cost: { amountUsd, provider: 'gemini', model },
      metadata: { latencyMs, finishReason },
    };
  }
}
