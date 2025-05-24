export interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: string;
}

export interface ChapterSlice {
  subject: string;
  title: string;
  pageRange: string;
}

export function sliceChapter(chapter: Chapter): ChapterSlice[] {
  const pagesPerSlice = 10;
  const slices: ChapterSlice[] = [];

  let pageStart = 1;
  while (pageStart <= chapter.contentVolume) {
    const pageEnd = Math.min(pageStart + pagesPerSlice - 1, chapter.contentVolume);
    slices.push({
      title: chapter.chapterTitle,
      pageRange: `(p.${pageStart}-${pageEnd})`,
      subject: '',
    });
    pageStart = pageEnd + 1;
  }

  return slices;
}
