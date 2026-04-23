import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';
import { LLMError } from '../types.js';
import { OCR_PRINTED_SYSTEM } from '../prompts/ocrPrinted.js';

export interface OcrPrintedInput {
  imageUrl: string;
  userId?: string;
  sessionId?: string;
}

export interface OcrPrintedResult {
  text: string;
  confidence?: number;
}

export async function ocrPrintedRole(
  input: OcrPrintedInput,
  deps: RouterDeps,
): Promise<OcrPrintedResult> {
  const { imageUrl, userId, sessionId } = input;

  // TODO(Week 3): replace text-based URL passing with proper Gemini multimodal image input
  const res = await callWithFallback(
    {
      role: 'ocrPrinted',
      messages: [{ role: 'user', content: `이미지 URL: ${imageUrl}\n\n이미지의 수학 문제를 추출해 주세요.` }],
      systemPrompt: OCR_PRINTED_SYSTEM,
      jsonMode: true,
      userId,
      sessionId,
    },
    deps,
  );

  const s = res.structuredOutput as { text?: string; confidence?: number } | undefined;

  if (!s || typeof s.text !== 'string') {
    throw new LLMError('ocrPrinted: invalid response schema', res.cost.provider, 'invalid_response', false);
  }

  return { text: s.text, confidence: s.confidence };
}
