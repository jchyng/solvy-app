import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';
import { LLMError } from '../types.js';
import { buildChatSystem } from '../prompts/chat.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatInput {
  history: ChatMessage[];
  userMessage: string;
  problemContext: {
    recognizedProblem: string;
    optimalSolutionSummary: string;
  };
  userId?: string;
  sessionId?: string;
}

export interface FollowUpQuestion {
  id: string;
  label: string;
}

export interface ChatResult {
  answer: string;
  follow_up_questions: FollowUpQuestion[];
}

export async function chatRole(input: ChatInput, deps: RouterDeps): Promise<ChatResult> {
  const { history, userMessage, problemContext, userId, sessionId } = input;

  const res = await callWithFallback(
    {
      role: 'chat',
      messages: [...history, { role: 'user', content: userMessage }],
      systemPrompt: buildChatSystem(problemContext),
      jsonMode: true,
      enableCaching: true,
      userId,
      sessionId,
    },
    deps,
  );

  const s = res.structuredOutput as ChatResult | undefined;

  if (!s || typeof s.answer !== 'string') {
    throw new LLMError('chat: invalid response schema', res.cost.provider, 'invalid_response', false);
  }

  return {
    answer: s.answer,
    follow_up_questions: s.follow_up_questions ?? [],
  };
}
