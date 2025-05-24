
import { Chapter } from '../types/Chapter';

export function createPrompt(
  chapters: Chapter[],
  allowedDates: string[],
  sessionsPerDay: number,
  style: 'focus' | 'multi'
): string {
  const lines: string[] = [];

  lines.push(`너는 AI 학습 계획 생성기야.`);
  lines.push(`다음 챕터 목록을 가능한 날짜에 맞춰 적절히 분배해.`);
  lines.push(`조건은 다음과 같아:`);
  lines.push(`- 하루 최대 ${sessionsPerDay}개의 챕터까지만 배정 가능`);
  lines.push(`- 가능한 날짜: ${allowedDates.join(', ')}`);
  if (style === 'focus') {
    lines.push(`- 하루에는 반드시 하나의 과목만 포함되도록 구성해줘.`);
  } else if (style === 'multi') {
    lines.push(`- 하루에 여러 과목이 포함될 수 있도록 자유롭게 구성해도 좋아.`);
  }
  lines.push(`- content에는 챕터명뿐 아니라 각 챕터의 분량도 함께 표기해줘. 예: "Chapter 3 (20p)"`);
  lines.push(`- 출력은 반드시 JSON 배열 형식, 항목은 subject, date, content만 포함해야 해.`);
  lines.push(`- content에는 페이지 정보뿐 아니라 분량(contentVolume)도 포함해줘.`);
  lines.push(`- 설명이나 print문, 코드블럭 포함하지 마.`);

  lines.push(`\n챕터 목록:`);
  chapters.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.subject} - ${c.chapterTitle} (분량: ${c.contentVolume}p)`);
  });

  return lines.join('\n');
}

