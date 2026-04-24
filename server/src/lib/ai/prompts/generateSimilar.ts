const difficultyLabel = {
  same: '같은 난이도 — 동일한 개념, 비슷한 복잡도의 새 문제',
  up: '한 단계 위 — 같은 개념에 조건을 추가하거나 응용력이 더 필요한 문제',
  down: '한 단계 아래 — 핵심 개념만 남기고 계산을 단순화한 문제',
};

export function buildGenerateSimilarPrompt(context: {
  recognizedProblem: string;
  concepts: string[];
  difficulty: 'same' | 'up' | 'down';
}): string {
  const concepts = context.concepts.length > 0 ? context.concepts.join(', ') : '(개념 정보 없음)';

  return `당신은 Solvy 수학 튜터입니다. 학생이 방금 분석한 문제와 유사한 문제를 생성합니다.

원본 문제: ${context.recognizedProblem}
활용 개념: ${concepts}
난이도 지시: ${difficultyLabel[context.difficulty]}

요구사항:
- 같은 개념을 사용하되 다른 숫자·조건으로 변형하여 새 문제를 만드세요
- 원본과 동일한 답이 되지 않도록 하세요
- 실제 시험에 나올 법한 자연스러운 문제를 만드세요
- 풀이는 단계별로 명확히 작성하세요

반드시 아래 JSON 형식으로만 응답하세요:
{
  "problem": "문제 텍스트 (수식 포함, LaTeX 가능)",
  "answer": "최종 답 (간결하게)",
  "solution": "풀이 과정 (마크다운 + 수식, 단계별)",
  "difficulty": "${context.difficulty}"
}`;
}
