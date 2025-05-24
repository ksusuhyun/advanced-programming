// src/planner/ai/engine/llm-summary.ts

export function createSummaryPrompt(dailyPlan: string[]): string {
  return `
당신은 사용자의 학습 일정을 요약하는 AI입니다.

다음은 사용자의 학습 계획입니다:
${dailyPlan.map(item => `- ${item}`).join('\n')}

이 계획을 간결하게 요약해 주세요. 하루에 어떤 과목을 얼마나 공부하는지, 어떤 챕터가 중요한지 등을 중심으로 작성해 주세요.
  `.trim();
}
