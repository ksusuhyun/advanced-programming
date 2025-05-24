// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { UserPreferenceService } from '../../user-preference/user-preference.service';
// import { ExamService } from '../../exam/exam.service';
// import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
// import { NotionService } from '../../notion/notion.service';
// import { getAllStudyDates } from './utils/date-utils';

// interface Chapter {
//   chapterTitle: string;
//   contentVolume: number;
//   difficulty: string; // '상', '중', '하'
// }

// interface Subject {
//   subject: string;
//   startDate: string;
//   endDate: string;
//   importance: number;
//   chapters: Chapter[];
// }

// interface EstimatedChapter {
//   subject: string;
//   title: string;
//   contentVolume: number;
//   estimatedDays: number;
// }

// @Injectable()
// export class AiPlannerService {
//   constructor(
//     private readonly configService: ConfigService,
//     private readonly userPreferenceService: UserPreferenceService,
//     private readonly examService: ExamService,
//     private readonly notionService: NotionService,
//   ) {}

//   async generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]> {
//     const preference = await this.userPreferenceService.findByUserId(userId);
//     const style = await this.userPreferenceService.getStyle(userId);
//     const { exams } = await this.examService.findByUser(userId);

//     if (!preference || !exams || exams.length === 0) {
//       throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
//     }

//     const databaseId = this.configService.get<string>('DATABASE_ID');
//     if (!databaseId) throw new InternalServerErrorException('❌ DATABASE_ID 누락');

//     const mergedSubjects = this.mergeSubjects(exams);
//     const estimates = this.estimateDaysByDifficulty(mergedSubjects);
//     const studyDates = getAllStudyDates(mergedSubjects, preference.studyDays);

//     const rawPlans = this.assignChaptersFallback(estimates, studyDates, preference.sessionsPerDay);
//     const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);

//     for (const result of results) {
//       await this.notionService.syncToNotion(result);
//     }

//     return this.mapResponseForClient(results);
//   }

//   private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
//     const diffWeight = { 상: 1.5, 중: 1.0, 하: 0.7 };
//     const result: EstimatedChapter[] = [];

//     for (const subject of subjects) {
//       for (const chapter of subject.chapters) {
//         const factor = diffWeight[chapter.difficulty] || 1.0;
//         const days = Math.ceil((chapter.contentVolume * factor) / 10);
//         result.push({
//           subject: subject.subject,
//           title: chapter.chapterTitle,
//           contentVolume: chapter.contentVolume,
//           estimatedDays: days,
//         });
//       }
//     }
//     return result;
//   }

//   private assignChaptersFallback(
//     chapters: EstimatedChapter[],
//     dates: string[],
//     maxPerDay: number
//   ): { subject: string; date: string; content: string }[] {
//     const result: any[] = [];
//     let dateIndex = 0;
//     let sessionInDay = 0;

//     for (const chapter of chapters) {
//       const totalPages = chapter.contentVolume;
//       const estimatedDays = Math.max(chapter.estimatedDays, 1);
//       const pagesPerDay = Math.ceil(totalPages / estimatedDays);

//       let pageStart = 1;
//       let remainingPages = totalPages;

//       while (remainingPages > 0) {
//         const pageEnd = Math.min(pageStart + pagesPerDay - 1, totalPages);
//         const date = dates[dateIndex];

//         result.push({
//           subject: chapter.subject,
//           date,
//           content: `${chapter.title} (p.${pageStart}-${pageEnd})`,
//         });

//         const pagesThisSession = pageEnd - pageStart + 1;
//         remainingPages -= pagesThisSession;
//         pageStart = pageEnd + 1;
//         sessionInDay++;

//         if (sessionInDay >= maxPerDay) {
//           sessionInDay = 0;
//           dateIndex++;
//         }

//         if (dateIndex >= dates.length) {
//           console.warn("⚠️ 날짜가 부족하여 계획이 조기에 종료될 수 있습니다.");
//           return result;
//         }
//       }
//     }

//     return result;
//   }


//   private mapResponseForClient(results: SyncToNotionDto[]): any[] {
//     return results.map(({ subject, startDate, endDate, dailyPlan }) => ({
//       subject,
//       startDate,
//       endDate,
//       dailyPlan,
//     }));
//   }

//   private groupDailyPlansBySubject(
//     userId: string,
//     databaseId: string,
//     subjects: Subject[],
//     llmResponse: { subject: string; date: string; content: string }[]
//   ): SyncToNotionDto[] {
//     const groupedBySubject: Record<string, SyncToNotionDto> = {};

//     // 🔧 병합용 임시 구조
//     const planMap: Record<string, { [date: string]: { title: string; pageStart: number; pageEnd: number } }> = {};

//     for (const item of llmResponse) {
//       const subjectKey = item.subject;
//       if (!groupedBySubject[subjectKey]) {
//         const matched = subjects.find(s => s.subject === subjectKey);
//         if (!matched) throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
//         groupedBySubject[subjectKey] = {
//           userId,
//           subject: subjectKey,
//           startDate: matched.startDate.toString(),
//           endDate: matched.endDate.toString(),
//           dailyPlan: [],
//           databaseId,
//         };
//         planMap[subjectKey] = {};
//       }

//       const match = item.content.match(/(.+?) \(p\.(\d+)-(\d+)\)/);
//       if (!match) {
//         // 형식이 안 맞는 경우 그대로 추가
//         groupedBySubject[subjectKey].dailyPlan.push(`${item.date}: ${item.content}`);
//         continue;
//       }

//       const [_, title, pStartStr, pEndStr] = match;
//       const pStart = parseInt(pStartStr);
//       const pEnd = parseInt(pEndStr);
//       const dateKey = `${item.date}-${title}`;

//       const subjectMap = planMap[subjectKey];
//       if (!subjectMap[dateKey]) {
//         subjectMap[dateKey] = { title, pageStart: pStart, pageEnd: pEnd };
//       } else {
//         subjectMap[dateKey].pageStart = Math.min(subjectMap[dateKey].pageStart, pStart);
//         subjectMap[dateKey].pageEnd = Math.max(subjectMap[dateKey].pageEnd, pEnd);
//       }
//     }

//     // 병합된 결과를 다시 dailyPlan에 넣기
//     for (const subjectKey of Object.keys(groupedBySubject)) {
//       const dto = groupedBySubject[subjectKey];
//       const map = planMap[subjectKey];

//       const sortedKeys = Object.keys(map).sort(); // 날짜 순 정렬

//       for (const key of sortedKeys) {
//         const [date, _title] = key.split(/-(.+)/); // split on first '-'
//         const { title, pageStart, pageEnd } = map[key];
//         dto.dailyPlan.push(`${date}: ${title} (p.${pageStart}-${pageEnd})`);
//       }
//     }

//     return Object.values(groupedBySubject);
//   }


//   private mergeSubjects(exams: any[]): Subject[] {
//     const grouped: Record<string, any> = {};
//     for (const exam of exams) {
//       const key = exam.subject;
//       if (!grouped[key]) {
//         grouped[key] = {
//           subject: exam.subject,
//           startDate: exam.startDate,
//           endDate: exam.endDate,
//           importance: exam.importance,
//           chapters: [...exam.chapters],
//         };
//       } else {
//         grouped[key].startDate = new Date(exam.startDate) < new Date(grouped[key].startDate)
//           ? exam.startDate
//           : grouped[key].startDate;
//         grouped[key].endDate = new Date(exam.endDate) > new Date(grouped[key].endDate)
//           ? exam.endDate
//           : grouped[key].endDate;
//         grouped[key].chapters.push(...exam.chapters);
//       }
//     }
//     return Object.values(grouped);
//   }
// }



import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { getAllStudyDates } from './utils/date-utils';

interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: string; // '상', '중', '하'
}

interface Subject {
  subject: string;
  startDate: string;
  endDate: string;
  importance: number;
  chapters: Chapter[];
}

interface EstimatedChapter {
  subject: string;
  title: string;
  contentVolume: number;
  estimatedDays: number;
}

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly notionService: NotionService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const style = await this.userPreferenceService.getStyle(userId);
    const { exams } = await this.examService.findByUser(userId);

    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!databaseId) throw new InternalServerErrorException('❌ DATABASE_ID 누락');

    const mergedSubjects = this.mergeSubjects(exams);
    const estimates = this.estimateDaysByDifficulty(mergedSubjects);
    const studyDates = getAllStudyDates(mergedSubjects, preference.studyDays);

    const rawPlans = this.assignChaptersFallback(estimates, studyDates, preference.sessionsPerDay, style);

    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);
    for (const result of results) {
      await this.notionService.syncToNotion(result);
    }

    return results;
  }

  private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
    const diffWeight = { '상': 1.5, '중': 1.0, '하': 0.7 };
    const result: EstimatedChapter[] = [];

    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const factor = diffWeight[chapter.difficulty] || 1.0;
        const days = Math.ceil((chapter.contentVolume * factor) / 10);  // 10p/day 기준
        result.push({
          subject: subject.subject,
          title: chapter.chapterTitle,
          contentVolume: chapter.contentVolume,
          estimatedDays: days,
        });
      }
    }
    return result;
  }

  private assignChaptersFallback(
    chapters: EstimatedChapter[],
    dates: string[],
    maxPerDay: number,
    style: 'focus' | 'multi'
  ): { subject: string; date: string; content: string }[] {
    const result: any[] = [];
    let dateIndex = 0;
    let sessionInDay = 0;

    if (style === 'focus') {
      const grouped = chapters.reduce((acc, c) => {
        if (!acc[c.subject]) acc[c.subject] = [];
        acc[c.subject].push(c);
        return acc;
      }, {} as Record<string, EstimatedChapter[]>);

      for (const subject of Object.keys(grouped)) {
        const subjectChapters = grouped[subject];
        for (const chapter of subjectChapters) {
          let remaining = chapter.contentVolume;
          const pagesPerDay = Math.ceil(chapter.contentVolume / chapter.estimatedDays);
          let pageStart = 1;

          while (remaining > 0 && dateIndex < dates.length) {
            const pageEnd = Math.min(pageStart + pagesPerDay - 1, chapter.contentVolume);

            result.push({
              subject: chapter.subject,
              date: dates[dateIndex],
              content: `${chapter.title} (p.${pageStart}-${pageEnd})`,
            });

            const pagesThisSession = pageEnd - pageStart + 1;
            remaining -= pagesThisSession;
            pageStart = pageEnd + 1;
            dateIndex++; // 하루에 한 세션만, 한 과목만
          }
        }
      }
    } else {
      // multi 스타일
      for (const chapter of chapters) {
        let remaining = chapter.contentVolume;
        const pagesPerDay = Math.ceil(chapter.contentVolume / chapter.estimatedDays);
        let pageStart = 1;

        while (remaining > 0) {
          const pageEnd = Math.min(pageStart + pagesPerDay - 1, chapter.contentVolume);
          const date = dates[dateIndex];

          result.push({
            subject: chapter.subject,
            date,
            content: `${chapter.title} (p.${pageStart}-${pageEnd})`,
          });

          const pagesThisSession = pageEnd - pageStart + 1;
          remaining -= pagesThisSession;
          pageStart = pageEnd + 1;
          sessionInDay++;

          if (sessionInDay >= maxPerDay) {
            dateIndex++;
            sessionInDay = 0;
          }

          if (dateIndex >= dates.length) {
            console.warn('⚠️ 날짜 부족');
            return result;
          }
        }
      }
    }
    return result;
  }

  private mergeSubjects(exams: any[]): Subject[] {
    const grouped: Record<string, any> = {};
    for (const exam of exams) {
      const key = exam.subject;
      if (!grouped[key]) {
        grouped[key] = {
          subject: exam.subject,
          startDate: exam.startDate,
          endDate: exam.endDate,
          importance: exam.importance,
          chapters: [...exam.chapters],
        };
      } else {
        grouped[key].startDate = new Date(exam.startDate) < new Date(grouped[key].startDate)
          ? exam.startDate
          : grouped[key].startDate;
        grouped[key].endDate = new Date(exam.endDate) > new Date(grouped[key].endDate)
          ? exam.endDate
          : grouped[key].endDate;
        grouped[key].chapters.push(...exam.chapters);
      }
    }
    return Object.values(grouped);
  }

  private groupDailyPlansBySubject(
    userId: string,
    databaseId: string,
    subjects: Subject[],
    rawPlans: { subject: string; date: string; content: string }[],
  ): SyncToNotionDto[] {
    const groupedBySubject: Record<string, SyncToNotionDto> = {};

    for (const item of rawPlans) {
      const subjectKey = item.subject;
      if (!groupedBySubject[subjectKey]) {
        const matched = subjects.find(s => s.subject === subjectKey);
        if (!matched) throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
        groupedBySubject[subjectKey] = {
          userId,
          subject: subjectKey,
          startDate: matched.startDate.toString(),
          endDate: matched.endDate.toString(),
          dailyPlan: [],
          databaseId,
        };
      }
      groupedBySubject[subjectKey].dailyPlan.push(`${item.date}: ${item.content}`);
    }

    return Object.values(groupedBySubject);
  }
}
