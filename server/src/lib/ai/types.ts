export type Role =
  | 'ocrPrinted'
  | 'ocrHandwriting'
  | 'classify'
  | 'analyze'
  | 'chat'
  | 'generateSimilar'
  | 'nameNote';

export interface UnifiedLLMResponse {
  content: string;
  structuredOutput?: unknown;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
  cost: {
    amountUsd: number;
    provider: string;
    model: string;
  };
  metadata: {
    latencyMs: number;
    finishReason: 'stop' | 'length' | 'error';
  };
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: 'timeout' | 'rate_limit' | 'invalid_response' | 'auth' | 'unknown',
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
