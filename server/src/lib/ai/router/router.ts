import type { LLMAdapter, LLMCallParams } from '../adapters/base.js';
import type { UnifiedLLMResponse, Role } from '../types.js';
import { LLMError } from '../types.js';
import type { Tracker } from './tracker.js';
import { roleRoutes } from './config.js';

export interface RouterCallParams extends Omit<LLMCallParams, 'model'> {
  role: Role;
  userId?: string;
  sessionId?: string;
}

export interface RouterDeps {
  adapters: Partial<Record<string, LLMAdapter>>;
  tracker: Tracker;
}

export interface RouterOptions {
  maxRetriesPerProvider?: number;
  retryBaseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callWithFallback(
  params: RouterCallParams,
  deps: RouterDeps,
  options: RouterOptions = {},
): Promise<UnifiedLLMResponse> {
  const { maxRetriesPerProvider = 1, retryBaseDelayMs = 500 } = options;
  const config = roleRoutes[params.role];
  const chain = [config.primary, ...config.fallbacks];

  let lastError: unknown;

  for (let depth = 0; depth < chain.length; depth++) {
    const { provider, model } = chain[depth];
    const adapter = deps.adapters[provider];

    if (!adapter) continue;

    let providerError: LLMError | undefined;

    for (let attempt = 0; attempt <= maxRetriesPerProvider; attempt++) {
      if (attempt > 0) {
        await sleep(retryBaseDelayMs * Math.pow(2, attempt - 1));
      }

      try {
        const response = await adapter.generate({ ...params, model });
        // fire-and-forget — tracker failure must not surface to caller
        void deps.tracker
          .record({ userId: params.userId, sessionId: params.sessionId, role: params.role, provider, model, response, fallbackDepth: depth })
          .catch(() => undefined);
        return response;
      } catch (e) {
        lastError = e;
        if (e instanceof LLMError) {
          providerError = e;
          if (!e.retryable) break; // non-retryable: skip remaining retries for this provider
        } else {
          break;
        }
      }
    }

    // record failure for this provider slot, then try next fallback
    if (providerError) {
      void deps.tracker
        .record({ userId: params.userId, sessionId: params.sessionId, role: params.role, provider, model, error: providerError, fallbackDepth: depth })
        .catch(() => undefined);
    }
  }

  if (lastError instanceof LLMError) throw lastError;
  throw new LLMError('All providers exhausted', 'router', 'unknown', false, lastError);
}
