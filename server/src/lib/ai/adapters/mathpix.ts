import type { LLMAdapter, LLMCallParams } from './base.js';
import type { UnifiedLLMResponse } from '../types.js';
import { LLMError } from '../types.js';

// Mathpix charges per image call, not per token
const COST_PER_IMAGE_USD = 0.004;

interface MathpixResponse {
  text: string;
  confidence: number;
  error?: string;
}

export class MathpixAdapter implements LLMAdapter {
  readonly provider = 'mathpix';

  constructor(
    private readonly appId: string,
    private readonly appKey: string,
  ) {}

  // messages[0].content must be an image URL or base64 data URI
  async generate(params: LLMCallParams): Promise<UnifiedLLMResponse> {
    const { messages, model = 'mathpix-ocr-v3' } = params;
    const imageData = messages[0]?.content;

    if (!imageData) {
      throw new LLMError('Mathpix: no image data in messages[0].content', 'mathpix', 'invalid_response', false);
    }

    const body = {
      src: imageData,
      formats: ['text', 'latex_simplified'],
      ocr: ['math', 'text'],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    const startedAt = Date.now();

    let res: Response;
    try {
      res = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          app_id: this.appId,
          app_key: this.appKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new LLMError('Mathpix request timed out', 'mathpix', 'timeout', true, e);
      }
      throw new LLMError('Mathpix fetch failed', 'mathpix', 'unknown', true, e);
    }
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startedAt;

    if (res.status === 401 || res.status === 403) {
      throw new LLMError('Mathpix auth failed', 'mathpix', 'auth', false);
    }
    if (res.status === 429) {
      throw new LLMError('Mathpix rate limit', 'mathpix', 'rate_limit', true);
    }
    if (!res.ok) {
      throw new LLMError(`Mathpix error ${res.status}`, 'mathpix', 'unknown', res.status >= 500);
    }

    let data: MathpixResponse;
    try {
      data = (await res.json()) as MathpixResponse;
    } catch (e) {
      throw new LLMError('Mathpix invalid JSON response', 'mathpix', 'invalid_response', false, e);
    }

    if (data.error) {
      throw new LLMError(`Mathpix API error: ${data.error}`, 'mathpix', 'invalid_response', false);
    }

    return {
      content: data.text,
      structuredOutput: { text: data.text, confidence: data.confidence },
      usage: { inputTokens: 0, outputTokens: 0 },
      cost: { amountUsd: COST_PER_IMAGE_USD, provider: 'mathpix', model },
      metadata: { latencyMs, finishReason: 'stop' },
    };
  }
}
