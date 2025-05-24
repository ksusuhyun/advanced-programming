import { ChapterSlice } from '../utils/chapter-slicer';

export function assignChaptersByRule(
  slices: ChapterSlice[],
  studyDates: string[],
  maxPerDay: number
): { subject: string; date: string; content: string }[] {
  const result: { subject: string; date: string; content: string }[] = [];
  let i = 0;

  for (const date of studyDates) {
    for (let j = 0; j < maxPerDay && i < slices.length; j++, i++) {
      const s = slices[i];
      result.push({
        subject: s.subject,
        date,
        content: `${s.title} ${s.pageRange}`,
      });
    }
    if (i >= slices.length) break;
  }

  return result;
}
