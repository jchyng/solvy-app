// 유사 문제 생성 — Week 6에서 구현
import type { RouterDeps } from '../router/router.js';

export interface GenerateSimilarInput {
  analysisResult: unknown;
  userId?: string;
  sessionId?: string;
}

export interface GenerateSimilarResult {
  problem: string;
  solution: string;
  difficulty: string;
}

export async function generateSimilarRole(
  _input: GenerateSimilarInput,
  _deps: RouterDeps,
): Promise<GenerateSimilarResult> {
  throw new Error('generateSimilar: not implemented until Week 6');
}
