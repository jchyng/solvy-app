import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';
import { LLMError } from '../types.js';
import { buildGenerateSimilarPrompt } from '../prompts/generateSimilar.js';

export interface GenerateSimilarInput {
  difficulty: 'same' | 'up' | 'down';
  problemContext: {
    recognizedProblem: string;
    concepts: string[];
    optimalSolutionSummary: string;
  };
  userId?: string;
  sessionId?: string;
}

export interface SimilarProblemResult {
  type: 'similar_problem';
  problem: string;
  answer: string;
  solution: string;
  difficulty: string;
}

export async function generateSimilarRole(
  input: GenerateSimilarInput,
  deps: RouterDeps,
): Promise<SimilarProblemResult> {
  const { difficulty, problemContext, userId, sessionId } = input;

  const res = await callWithFallback(
    {
      role: 'generateSimilar',
      messages: [{ role: 'user', content: `난이도 "${difficulty}"로 유사 문제를 생성해주세요.` }],
      systemPrompt: buildGenerateSimilarPrompt({
        recognizedProblem: problemContext.recognizedProblem,
        concepts: problemContext.concepts,
        difficulty,
      }),
      jsonMode: true,
      enableCaching: false,
      userId,
      sessionId,
    },
    deps,
  );

  const s = res.structuredOutput as Partial<SimilarProblemResult> | undefined;

  if (!s || typeof s.problem !== 'string' || typeof s.answer !== 'string' || typeof s.solution !== 'string') {
    throw new LLMError(
      'generateSimilar: invalid response schema',
      res.cost.provider,
      'invalid_response',
      false,
    );
  }

  return {
    type: 'similar_problem',
    problem: s.problem,
    answer: s.answer,
    solution: s.solution,
    difficulty: typeof s.difficulty === 'string' ? s.difficulty : difficulty,
  };
}
