import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';
import { LLMError } from '../types.js';
import { CLASSIFY_SYSTEM } from '../prompts/classify.js';

export interface ClassifyInput {
  recognizedText: string;
  userId?: string;
  sessionId?: string;
}

export interface ClassifyResult {
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
}

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

export async function classifyRole(
  input: ClassifyInput,
  deps: RouterDeps,
): Promise<ClassifyResult> {
  const { recognizedText, userId, sessionId } = input;

  const res = await callWithFallback(
    {
      role: 'classify',
      messages: [{ role: 'user', content: `다음 수학 문제를 분류해 주세요:\n\n${recognizedText}` }],
      systemPrompt: CLASSIFY_SYSTEM,
      jsonMode: true,
      userId,
      sessionId,
    },
    deps,
  );

  const s = res.structuredOutput as { difficulty?: string; concepts?: string[] } | undefined;

  if (!s || !VALID_DIFFICULTIES.has(s.difficulty ?? '') || !Array.isArray(s.concepts)) {
    throw new LLMError('classify: invalid response schema', res.cost.provider, 'invalid_response', false);
  }

  return {
    difficulty: s.difficulty as 'easy' | 'medium' | 'hard',
    concepts: s.concepts,
  };
}
