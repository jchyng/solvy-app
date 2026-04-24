import type { AI } from './ai/index.js';
import type { DbClient } from './db/client.js';
import type { AnalysisResult } from './db/types.js';

interface PipelineDeps {
  ai: AI
  db: DbClient
}

function buildAnalysisContent(result: AnalysisResult): string {
  const stepsSummary = result.optimal_solution.steps
    .map((s, i) => `${i + 1}. **${s.title}**: ${s.detail}`)
    .join('\n');
  return `**출제 의도**\n${result.intent}\n\n**활용 개념**\n${result.concepts.join(', ')}\n\n**최적 풀이**\n${stepsSummary}`;
}

async function runFromClassify(
  sessionId: string,
  recognizedText: string,
  userId: string,
  deps: PipelineDeps,
): Promise<void> {
  const { ai, db } = deps;

  const classification = await ai.classify({ recognizedText, userId, sessionId });
  await db.sessions.update(sessionId, { classification });

  let analysis = await ai.analyze({ recognizedText, userId, sessionId });
  if (analysis.confidence < 0.8) {
    analysis = await ai.analyze({ recognizedText, userId, sessionId });
  }

  const conversation = await db.conversations.create({ userId, sessionId });

  await db.messages.create({
    conversationId: conversation.id,
    role: 'assistant',
    content: buildAnalysisContent(analysis),
    structuredPayload: analysis,
    followUpQuestions: analysis.follow_up_questions,
  });

  await db.sessions.update(sessionId, {
    analysis_result: analysis,
    status: 'done',
    completed_at: new Date().toISOString(),
  });

  // 자동 제목 생성 — fire and forget, 실패해도 파이프라인 영향 없음
  void Promise.resolve(ai.nameNote({ analysisResult: analysis, userId, sessionId }))
    .then((autoTitle) => db.conversations.update(conversation.id, { auto_title: autoTitle }))
    .catch(() => undefined);
}

export async function runAnalysisPipeline(
  sessionId: string,
  imageUrl: string,
  userId: string,
  deps: PipelineDeps,
): Promise<void> {
  const { ai, db } = deps;

  try {
    await db.sessions.update(sessionId, { status: 'analyzing' });

    const ocr = await ai.ocrPrinted({ imageUrl, userId, sessionId });
    await db.sessions.update(sessionId, {
      recognized_problem: { text: ocr.text, confidence: ocr.confidence },
    });

    if ((ocr.confidence ?? 1) < 0.8) {
      await db.sessions.update(sessionId, { status: 'confirming' });
      return;
    }

    await runFromClassify(sessionId, ocr.text, userId, deps);
  } catch {
    await db.sessions.update(sessionId, { status: 'error' }).catch(() => undefined);
  }
}

export async function runPipelineFromClassify(
  sessionId: string,
  recognizedText: string,
  userId: string,
  deps: PipelineDeps,
): Promise<void> {
  try {
    await db_update_analyzing(deps.db, sessionId);
    await runFromClassify(sessionId, recognizedText, userId, deps);
  } catch {
    await deps.db.sessions.update(sessionId, { status: 'error' }).catch(() => undefined);
  }
}

async function db_update_analyzing(db: DbClient, sessionId: string): Promise<void> {
  await db.sessions.update(sessionId, { status: 'analyzing' });
}
