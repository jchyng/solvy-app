// Mathpix 손글씨 OCR — Phase 1.5+에서 구현
import type { RouterDeps } from '../router/router.js';

export interface OcrHandwritingInput {
  imageUrl: string;
  userId?: string;
  sessionId?: string;
}

export interface OcrHandwritingResult {
  text: string;
  confidence?: number;
}

export async function ocrHandwritingRole(
  _input: OcrHandwritingInput,
  _deps: RouterDeps,
): Promise<OcrHandwritingResult> {
  throw new Error('ocrHandwriting: not implemented until Phase 1.5');
}
