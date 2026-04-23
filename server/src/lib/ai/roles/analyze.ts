import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';
import { LLMError } from '../types.js';
import { ANALYZE_SYSTEM } from '../prompts/analyze.js';

export interface AnalyzeInput {
  recognizedText: string;
  userId?: string;
  sessionId?: string;
}

export interface FollowUpQuestion {
  id: string;
  label: string;
}

export interface AnalysisResult {
  intent: string;
  concepts: string[];
  optimal_solution: {
    steps: Array<{ title: string; detail: string; visualization_hint?: string }>;
  };
  exam_tips: string[];
  follow_up_questions: FollowUpQuestion[];
  confidence: number;
}

export async function analyzeRole(input: AnalyzeInput, deps: RouterDeps): Promise<AnalysisResult> {
  const { recognizedText, userId, sessionId } = input;

  const res = await callWithFallback(
    {
      role: 'analyze',
      messages: [{ role: 'user', content: `다음 수학 문제를 분석해 주세요:\n\n${recognizedText}` }],
      systemPrompt: ANALYZE_SYSTEM,
      jsonMode: true,
      enableCaching: true,
      userId,
      sessionId,
    },
    deps,
  );

  const s = res.structuredOutput as AnalysisResult | undefined;

  if (
    !s ||
    typeof s.intent !== 'string' ||
    !Array.isArray(s.concepts) ||
    !Array.isArray(s.optimal_solution?.steps) ||
    typeof s.confidence !== 'number'
  ) {
    throw new LLMError('analyze: invalid response schema', res.cost.provider, 'invalid_response', false);
  }

  return {
    intent: s.intent,
    concepts: s.concepts,
    optimal_solution: s.optimal_solution,
    exam_tips: s.exam_tips ?? [],
    follow_up_questions: s.follow_up_questions ?? [],
    confidence: s.confidence,
  };
}
