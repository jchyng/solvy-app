import type { UnifiedLLMResponse } from '../types.js';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMCallParams {
  messages: LLMMessage[];
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
  jsonMode?: boolean;
  enableCaching?: boolean;
}

export interface LLMAdapter {
  readonly provider: string;
  generate(params: LLMCallParams): Promise<UnifiedLLMResponse>;
}
