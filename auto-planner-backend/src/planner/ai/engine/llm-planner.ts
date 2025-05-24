import { Chapter } from '../types/Chapter';

export function createPrompt(
  chapters: {
    subject: string;
    chapterTitle: string;
    contentVolume: number;
  }[],
  allowedDates: string[],
  sessionsPerDay: number,
  style: 'focus' | 'multi'
): string {
  const lines: string[] = [];

  // ✅ 명시적 역할 지시
  lines.push(`너는 JSON만 출력하는 AI 학습 계획 생성기야.`);
  lines.push(`주어진 조건을 바탕으로 반드시 JSON 배열만 출력해야 해.`);

  // ✅ 출력 형식 강조 및 예시 제공
  lines.push(`- 출력은 반드시 '['로 시작하고 ']'로 끝나는 JSON 배열이어야 해.`);
  lines.push(`- 각 항목은 다음 형식이어야 해: { "subject": "...", "date": "...", "content": "..." }`);
  lines.push(`- 예시:`);
  lines.push(`[
  { "subject": "수학", "date": "6/1", "content": "Chapter 1 (p.1-10, 10p)" },
  { "subject": "과학", "date": "6/1", "content": "Chapter 3 (p.21-40, 20p)" }
]`);
  lines.push(`- 설명, print문, 리스트 출력, 코드블럭 등은 절대 포함하지 마.`);

  // ✅ 조건 설명
  lines.push(`조건:`);
  lines.push(`- 하루 최대 ${sessionsPerDay}개의 챕터까지만 배정 가능`);
  lines.push(`- 가능한 날짜: ${allowedDates.join(', ')}`);
  if (style === 'focus') {
    lines.push(`- 하루에는 반드시 하나의 과목만 포함되도록 구성해.`);
  } else if (style === 'multi') {
    lines.push(`- 하루에 여러 과목이 포함될 수 있도록 자유롭게 구성해도 좋아.`);
  }
  lines.push(`- content에는 챕터명과 페이지 범위, 그리고 분량(p) 정보 포함.`);

  // ✅ 챕터 목록
  lines.push(`\n챕터 목록:`);
  chapters.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.subject} - ${c.chapterTitle} (분량: ${c.contentVolume}p)`);
  });

  return lines.join('\n');
}
