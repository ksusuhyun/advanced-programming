export function createFeedbackPrompt(dailyPlan: string[]): string {
  return `
당신은 학생의 학습 계획을 요약하고, 실현 가능성과 학습 조언을 제시하는 AI입니다.

아래는 학생의 하루별 학습 계획입니다:
${dailyPlan.map(item => `- ${item}`).join('\n')}

요약:
- 위 계획을 2~3문장으로 요약해 주세요. 어떤 과목 위주인지, 계획이 어떻게 구성되었는지 설명하세요.

피드백:
- 학습 전략, 집중력 유지, 휴식 균형 등에 대해 학생에게 조언해 주세요 (2~3문장).
  `.trim();
}
