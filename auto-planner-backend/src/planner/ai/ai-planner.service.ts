import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { eachDayOfInterval, format, subDays } from 'date-fns';

interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: '쉬움' | '보통' | '어려움';
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
  difficulty: '쉬움' | '보통' | '어려움';
  weight: number;
}

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly notionService: NotionService,
  ) {}

  async generateStudyPlan(userId: string): Promise<SyncToNotionDto[]> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const { exams } = await this.examService.findByUser(userId);
    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!preference || !exams || !databaseId) {
      throw new InternalServerErrorException('❌ 아직 필요한 데이터 남아있음');
    }
    const mergedSubjects = this.mergeSubjects(exams);
    const estimates = this.estimateDaysByDifficulty(mergedSubjects);
    const subjectDateMap = this.getStudyDatesBySubject(mergedSubjects, preference.studyDays);
    const rawPlans = this.assignChaptersSmart(estimates, mergedSubjects, subjectDateMap, preference.sessionsPerDay, preference.style as 'focus' | 'multi');
    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);

    for (const result of results) {
      const end = new Date(result.endDate);
      const review1 = format(subDays(end, 2), 'yyyy-MM-dd');
      const review2 = format(subDays(end, 1), 'yyyy-MM-dd');
      const formattedEndDate = format(end, 'yyyy-MM-dd');

      result.dailyPlan.push(`${review1}: 복습: 전체 챕터 복습`);
      result.dailyPlan.push(`${review2}: 복습: 전체 챕터 복습`);
      result.dailyPlan.push(`${formattedEndDate}: 📝 시험일: ${result.subject}`);

      await this.notionService.syncToNotion(result);
    }

    return this.mapResponseForClient(results);
  }

  private getStudyDatesBySubject(subjects: Subject[], studyDays: string[]): Record<string, string[]> {
    const dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
    const allowedDays = studyDays.map(day => dayMap[day]);
    const subjectDateMap: Record<string, string[]> = {};

    for (const subj of subjects) {
      const interval = eachDayOfInterval({
        start: new Date(subj.startDate),
        end: new Date(subj.endDate),
      });

      const validDates = interval
        .filter(d => allowedDays.includes(d.getDay()))
        .map(d => format(d, 'yyyy-MM-dd'));

      subjectDateMap[subj.subject] = validDates;
    }
    return subjectDateMap;
  }
  // 클래스 내부 메서드로 선언
  private mergePageRanges(ranges: number[][]): number[][] {
    const sorted = ranges.sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];

    for (const [start, end] of sorted) {
      if (merged.length === 0 || merged[merged.length - 1][1] < start - 1) {
        merged.push([start, end]);
      } else {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
      }
    }

    return merged;
  }

  private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
    const diffWeight: Record<string, number> = {
      '쉬움': 0.7,
      '보통': 1.0,
      '어려움': 1.5,
    };

    const result: EstimatedChapter[] = [];

    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const baseWeight = chapter.contentVolume * (diffWeight[chapter.difficulty] || 1.0);
        const importanceFactor = 1 + subject.importance * 0.05;
        const weight = baseWeight * importanceFactor;

        result.push({
          subject: subject.subject,
          title: chapter.chapterTitle,
          contentVolume: chapter.contentVolume,
          estimatedDays: 0,
          difficulty: chapter.difficulty,
          weight,
        });
      }
    }
    return result;
  }



  private assignChaptersSmart(
    chapters: EstimatedChapter[],
    subjects: Subject[],
    subjectDateMap: Record<string, string[]>,
    sessionsPerDay: number,
    style: 'focus' | 'multi'
  ): { subject: string; date: string; content: string }[] {
    const plans: { subject: string; date: string; content: string }[] = [];
    const calendar: Record<string, string> = {};

    for (const subject of subjects) {
      const dates = subjectDateMap[subject.subject];
      const endDate = dates[dates.length - 1];
      const reservedDates = new Set([
        format(subDays(new Date(endDate), 1), 'yyyy-MM-dd'),
        format(subDays(new Date(endDate), 2), 'yyyy-MM-dd'),
        endDate,
      ]);
      const availableDates = dates.filter(d => !reservedDates.has(d));

      const subjectChapters = chapters.filter(c => c.subject === subject.subject);
      const totalWeight = subjectChapters.reduce((sum, ch) => sum + ch.weight, 0);
      const totalSessions = availableDates.length * sessionsPerDay;
      const weightPerSession = totalWeight / totalSessions;

      const sessionPlan: Record<string, number> = {}; // date → 현재 세션 수
      let dateIdx = 0;

      for (const ch of subjectChapters) {
        let remainingPages = ch.contentVolume;
        let currentPage = 1;

        while (remainingPages > 0 && dateIdx < availableDates.length) {
          const date = availableDates[dateIdx];

          if (style === 'focus' && calendar[date] && calendar[date] !== subject.subject) {
            dateIdx++;
            continue;
          }

          const usedSessions = sessionPlan[date] || 0;
          if (usedSessions >= sessionsPerDay) {
            dateIdx++;
            continue;
          }

          const pagePerSession = Math.min(remainingPages, Math.ceil((ch.weight / totalWeight) * totalSessions));
          const pageEnd = Math.min(currentPage + pagePerSession - 1, ch.contentVolume);

          plans.push({
            subject: subject.subject,
            date,
            content: `${ch.title} (p.${currentPage}-${pageEnd})`,
          });

          calendar[date] = subject.subject;
          sessionPlan[date] = usedSessions + 1;

          const pagesThisSession = pageEnd - currentPage + 1;
          currentPage = pageEnd + 1;
          remainingPages -= pagesThisSession;

          if (remainingPages <= 0) break;
        }

      }

      // 복습용 일정 추가
      const assignedDates = new Set(plans.filter(p => p.subject === subject.subject).map(p => p.date));
      const remainingDates = availableDates.filter(d => !assignedDates.has(d));
      const difficultyOrder = { '쉬움': 1, '보통': 2, '어려움': 3 };
      const sortedChapters = [...subjectChapters].sort(
        (a, b) => difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]
      );
      let ri = 0;
      for (const date of remainingDates) {
        const ch = sortedChapters[ri % sortedChapters.length];
        plans.push({ subject: subject.subject, date, content: `복습: ${ch.title}` });
        ri++;
      }
    }

    plans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return plans;
  }



  private mapResponseForClient(results: SyncToNotionDto[]): any[] {
    return results.map(({ subject, startDate, endDate, dailyPlan, userId, databaseId }) => ({
      subject,
      startDate,
      endDate,
      dailyPlan,
      userId,
      databaseId,
    }));
  }

  private groupDailyPlansBySubject(
    userId: string,
    databaseId: string,
    subjects: Subject[],
    rawPlans: { subject: string; date: string; content: string }[],
  ): SyncToNotionDto[] {
    const groupedBySubject: Record<string, SyncToNotionDto> = {};

    // 중복 챕터 범위 통합을 위한 임시 구조: {subject -> date -> chapterTitle -> [pageRange]}
    const pageMap: Record<string, Record<string, Record<string, number[][]>>> = {};

    for (const item of rawPlans) {
      const subjectKey = item.subject;
      const date = item.date;

      // 챕터 제목과 페이지 추출
      const match = item.content.match(/^(.*) \(p\.(\d+)-(\d+)\)$/);
      if (!match) continue; // 복습일 경우 등은 통합 X
      const [_, chapterTitle, start, end] = match;
      const pStart = parseInt(start, 10);
      const pEnd = parseInt(end, 10);

      // init
      pageMap[subjectKey] ??= {};
      pageMap[subjectKey][date] ??= {};
      pageMap[subjectKey][date][chapterTitle] ??= [];
      pageMap[subjectKey][date][chapterTitle].push([pStart, pEnd]);
    }

    // 통합된 content 구성
    for (const subjectKey of Object.keys(pageMap)) {
      const matched = subjects.find(s => s.subject === subjectKey);
      if (!matched) throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
      groupedBySubject[subjectKey] = {
        userId,
        subject: subjectKey,
        startDate: format(new Date(matched.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(matched.endDate), 'yyyy-MM-dd'),
        dailyPlan: [],
        databaseId,
      };

      const dateMap = pageMap[subjectKey];
      for (const date of Object.keys(dateMap).sort()) {
        const chapterContents: string[] = [];

        for (const chapterTitle of Object.keys(dateMap[date])) {
          const ranges = dateMap[date][chapterTitle];
          const merged = this.mergePageRanges(ranges);
          for (const [s, e] of merged) {
            chapterContents.push(`${chapterTitle} (p.${s}-${e})`);
          }
        }

        if (chapterContents.length > 0) {
          groupedBySubject[subjectKey].dailyPlan.push(`${date}: ${chapterContents.join(', ')}`);
        }
      }
    }

    return Object.values(groupedBySubject);
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
          ? exam.startDate : grouped[key].startDate;
        grouped[key].endDate = new Date(exam.endDate) > new Date(grouped[key].endDate)
          ? exam.endDate : grouped[key].endDate;
        grouped[key].chapters.push(...exam.chapters);
      }
    }
    return Object.values(grouped);
  }
}

