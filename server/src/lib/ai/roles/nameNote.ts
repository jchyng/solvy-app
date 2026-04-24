import { callWithFallback } from '../router/router.js';
import type { RouterDeps } from '../router/router.js';

export interface NameNoteInput {
  analysisResult: unknown;
  userId?: string;
  sessionId?: string;
}

const SYSTEM = `당신은 수학 학습 노트의 제목을 짓는 도우미입니다.
주어진 문제 분석 결과를 보고, 학생이 나중에 바로 알아볼 수 있는 짧은 제목을 만드세요.

규칙:
- 10자 이내
- 핵심 개념 또는 문제 유형 위주
- "~풀이", "~문제" 같은 접미사는 붙이지 않음
- JSON {"title": "..."} 형식으로만 응답`;

export async function nameNoteRole(
  input: NameNoteInput,
  deps: RouterDeps,
): Promise<string> {
  const { analysisResult, userId, sessionId } = input;

  const res = await callWithFallback(
    {
      role: 'nameNote',
      messages: [
        {
          role: 'user',
          content: `분석 결과:\n${JSON.stringify(analysisResult, null, 2)}\n\n제목을 JSON으로 응답해 주세요.`,
        },
      ],
      systemPrompt: SYSTEM,
      jsonMode: true,
      maxTokens: 64,
      userId,
      sessionId,
    },
    deps,
  );

  try {
    const parsed = JSON.parse(res.content) as { title?: string };
    if (typeof parsed.title === 'string' && parsed.title.trim()) {
      return parsed.title.trim();
    }
  } catch {
    // fall through
  }

  // fallback: content 앞 10자
  return res.content.slice(0, 10).trim();
}
