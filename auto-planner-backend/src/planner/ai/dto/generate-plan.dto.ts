// 사용자 입력 DTO 정의
export class AiGeneratePlanDto {
  subject: string;
  startDate: string;
  endDate: string;
  importance: number;
  chapters: {
    chapterTitle: string;
    difficulty: number;
    contentVolume: number;
  }[];
}
// 과목, 시작일, 종료일, 중요도, 챕터(챕터제목, 난이도, 분량)
