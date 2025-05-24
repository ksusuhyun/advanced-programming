import { Chapter } from '../types/Chapter';

/**
 * fallback 로직: subject별 챕터를 contentVolume 기준으로 순차 분배
 */
export function assignChaptersByRule(
  chapters: Chapter[],
  studyDates: string[],
  sessionsPerDay: number
): { subject: string; date: string; content: string }[] {
  const result: { subject: string; date: string; content: string }[] = [];

  // 총 공부 가능한 슬롯 수
  const totalSlots = studyDates.length * sessionsPerDay;
  const totalVolume = chapters.reduce((sum, c) => sum + c.contentVolume, 0);

  const avgVolumePerSlot = totalVolume / totalSlots;

  let dateIndex = 0;
  let sessionInDay = 0;

  for (const chapter of chapters) {
    let remaining = chapter.contentVolume;
    let pageStart = 1;

    while (remaining > 0) {
      const pagesToday = Math.max(1, Math.round(avgVolumePerSlot));
      const pageEnd = Math.min(pageStart + pagesToday - 1, chapter.contentVolume);

      const date = studyDates[dateIndex];
      result.push({
        subject: chapter.subject,
        date,
        content: `${chapter.chapterTitle} (p.${pageStart}-${pageEnd}, ${pageEnd - pageStart + 1}p)`
      });

      remaining -= (pageEnd - pageStart + 1);
      pageStart = pageEnd + 1;
      sessionInDay++;

      if (sessionInDay >= sessionsPerDay) {
        dateIndex++;
        sessionInDay = 0;
      }

      if (dateIndex >= studyDates.length) {
        console.warn('⚠️ 날짜가 부족해서 일부 챕터가 누락될 수 있음');
        return result;
      }
    }
  }

  return result;
}
