// 노트 자동 제목 생성 — Week 5에서 구현
import type { RouterDeps } from '../router/router.js';

export interface NameNoteInput {
  analysisResult: unknown;
  userId?: string;
  sessionId?: string;
}

export async function nameNoteRole(
  _input: NameNoteInput,
  _deps: RouterDeps,
): Promise<string> {
  throw new Error('nameNote: not implemented until Week 5');
}
