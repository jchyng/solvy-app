import type { SupabaseClient } from '@supabase/supabase-js';
import type { Bindings } from '../../types/env.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { MathpixAdapter } from './adapters/mathpix.js';
import { Tracker } from './router/tracker.js';
import type { RouterDeps } from './router/router.js';
import { analyzeRole } from './roles/analyze.js';
import type { AnalyzeInput } from './roles/analyze.js';
import { chatRole } from './roles/chat.js';
import type { ChatInput } from './roles/chat.js';
import { ocrPrintedRole } from './roles/ocrPrinted.js';
import type { OcrPrintedInput } from './roles/ocrPrinted.js';
import { classifyRole } from './roles/classify.js';
import type { ClassifyInput } from './roles/classify.js';
import { ocrHandwritingRole } from './roles/ocrHandwriting.js';
import type { OcrHandwritingInput } from './roles/ocrHandwriting.js';
import { generateSimilarRole } from './roles/generateSimilar.js';
import type { GenerateSimilarInput } from './roles/generateSimilar.js';
import { nameNoteRole } from './roles/nameNote.js';
import type { NameNoteInput } from './roles/nameNote.js';

export function createAI(env: Bindings, supabase: SupabaseClient) {
  const deps: RouterDeps = {
    adapters: {
      anthropic: new AnthropicAdapter(env.ANTHROPIC_API_KEY),
      gemini: new GeminiAdapter(env.GEMINI_API_KEY),
      openrouter: new OpenRouterAdapter(env.OPENROUTER_API_KEY),
      mathpix: new MathpixAdapter(env.MATHPIX_APP_ID, env.MATHPIX_APP_KEY),
    },
    tracker: new Tracker(supabase),
  };

  return {
    analyze: (input: AnalyzeInput) => analyzeRole(input, deps),
    chat: (input: ChatInput) => chatRole(input, deps),
    ocrPrinted: (input: OcrPrintedInput) => ocrPrintedRole(input, deps),
    classify: (input: ClassifyInput) => classifyRole(input, deps),
    ocrHandwriting: (input: OcrHandwritingInput) => ocrHandwritingRole(input, deps),
    generateSimilar: (input: GenerateSimilarInput) => generateSimilarRole(input, deps),
    nameNote: (input: NameNoteInput) => nameNoteRole(input, deps),
  };
}

export type AI = ReturnType<typeof createAI>;
