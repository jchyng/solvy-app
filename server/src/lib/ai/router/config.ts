import type { Role } from '../types.js';

export interface ProviderRoute {
  provider: 'anthropic' | 'gemini' | 'openrouter' | 'mathpix';
  model: string;
}

export interface RoleConfig {
  primary: ProviderRoute;
  fallbacks: ProviderRoute[];
}

// architecture/ai-providers.md §역할-모델 매핑표 기준
export const roleRoutes: Record<Role, RoleConfig> = {
  ocrPrinted: {
    primary: { provider: 'gemini', model: 'gemini-1.5-flash' },
    fallbacks: [
      { provider: 'openrouter', model: 'google/gemini-flash-1.5' },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
    ],
  },
  ocrHandwriting: {
    primary: { provider: 'mathpix', model: 'mathpix-ocr-v3' },
    fallbacks: [],
  },
  classify: {
    primary: { provider: 'gemini', model: 'gemini-1.5-flash' },
    fallbacks: [{ provider: 'openrouter', model: 'qwen/qwen3-8b' }],
  },
  analyze: {
    primary: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    fallbacks: [
      { provider: 'openrouter', model: 'deepseek/deepseek-r1' },
      { provider: 'gemini', model: 'gemini-1.5-pro' },
    ],
  },
  chat: {
    primary: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    fallbacks: [
      { provider: 'openrouter', model: 'deepseek/deepseek-r1' },
      { provider: 'gemini', model: 'gemini-1.5-pro' },
    ],
  },
  generateSimilar: {
    primary: { provider: 'openrouter', model: 'deepseek/deepseek-chat' },
    fallbacks: [{ provider: 'gemini', model: 'gemini-1.5-flash' }],
  },
  nameNote: {
    primary: { provider: 'gemini', model: 'gemini-1.5-flash' },
    fallbacks: [{ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }],
  },
};
