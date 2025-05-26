import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { getAllStudyDates } from './utils/date-utils';
import { format } from 'date-fns';

interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: number; // 1~5
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

  async generateStudyPlan(userId: string): Promise<SyncToNotionDto[]> {
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
    let studyDates = getAllStudyDates(mergedSubjects, preference.studyDays);

    const latestEndDate = Math.max(...mergedSubjects.map(s => new Date(s.endDate).getTime()));
    studyDates = studyDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getTime() < latestEndDate;
    });

    const rawPlans = this.assignChaptersSmartMulti(estimates, mergedSubjects, studyDates, preference.sessionsPerDay);
    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);

    for (const result of results) {
      await this.notionService.syncToNotion(result);
    }

    return this.mapResponseForClient(results);
  }

  private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
    const diffWeight = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.2, 5: 1.5 };
    const result: EstimatedChapter[] = [];

    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const factor = diffWeight[chapter.difficulty] || 1.0;
        const days = Math.ceil((chapter.contentVolume * factor) / 10);
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

  private assignChaptersSmartMulti(
    chapters: EstimatedChapter[],
    subjects: Subject[],
    dates: string[],
    maxPerDay: number
  ): { subject: string; date: string; content: string }[] {
    const plans: { subject: string; date: string; content: string }[] = [];
    const finalReviewDates: Record<string, string[]> = {};
    const activeDates: string[] = [];

    for (const subj of subjects) {
      const end = new Date(subj.endDate);
      const d1 = new Date(end);
      const d2 = new Date(end);
      d1.setDate(d1.getDate() - 1);
      d2.setDate(d2.getDate() - 2);
      finalReviewDates[subj.subject] = [format(d2, 'yyyy-MM-dd'), format(d1, 'yyyy-MM-dd')];
    }

    const filteredDates = dates.filter(date =>
      !Object.values(finalReviewDates).flat().includes(date)
    );

    const schedule: Record<string, { slots: number; plans: { subject: string; content: string }[] }> = {};
    for (const date of filteredDates) {
      schedule[date] = { slots: 0, plans: [] };
    }

    const sortedChapters = [...chapters].sort((a, b) => {
      const impA = subjects.find(s => s.subject === a.subject)?.importance ?? 1;
      const impB = subjects.find(s => s.subject === b.subject)?.importance ?? 1;
      return impB - impA || b.contentVolume - a.contentVolume;
    });

    for (const chapter of sortedChapters) {
      let remaining = chapter.contentVolume;
      const pagesPerDay = Math.max(1, Math.ceil(chapter.contentVolume / chapter.estimatedDays));
      let pageStart = 1;

      for (const date of filteredDates) {
        if (remaining <= 0) break;
        const availableSlots = maxPerDay - schedule[date].slots;
        if (availableSlots <= 0) continue;

        for (let s = 0; s < availableSlots && remaining > 0; s++) {
          const pageEnd = Math.min(pageStart + pagesPerDay - 1, chapter.contentVolume);
          const content = `${chapter.title} (p.${pageStart}-${pageEnd})`;
          schedule[date].plans.push({ subject: chapter.subject, content });
          schedule[date].slots += 1;

          remaining -= (pageEnd - pageStart + 1);
          pageStart = pageEnd + 1;
        }
      }

      if (remaining > 0 && remaining <= pagesPerDay) {
        for (const date of filteredDates) {
          const pageEnd = pageStart + remaining - 1;
          const content = `${chapter.title} (p.${pageStart}-${pageEnd})`;
          schedule[date].plans.push({ subject: chapter.subject, content });
          break;
        }
        remaining = 0;
      }
    }

    for (const subject of subjects) {
      for (const date of finalReviewDates[subject.subject]) {
        plans.push({
          subject: subject.subject,
          date,
          content: `복습: 전체 요약 (${subject.subject})`,
        });
      }
    }

    for (const date of filteredDates) {
      for (const item of schedule[date].plans) {
        plans.push({ subject: item.subject, date, content: item.content });
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

      const dailyPlan = groupedBySubject[subjectKey].dailyPlan;
      const date = item.date;
      const fullContent = item.content;
      const chapterTitle = fullContent.split(' (')[0];
      const pageRange = fullContent.match(/\(p\.(\d+)-(\d+)\)/);

      const existingIdx = dailyPlan.findIndex(entry => entry.startsWith(`${date}: ${chapterTitle}`));
      if (existingIdx !== -1 && pageRange) {
        const existing = dailyPlan[existingIdx];
        const existingPage = existing.match(/\(p\.(\d+)-(\d+)\)/);
        if (existingPage) {
          const minPage = Math.min(Number(existingPage[1]), Number(pageRange[1]));
          const maxPage = Math.max(Number(existingPage[2]), Number(pageRange[2]));
          dailyPlan[existingIdx] = `${date}: ${chapterTitle} (p.${minPage}-${maxPage})`;
        }
      } else {
        dailyPlan.push(`${date}: ${fullContent}`);
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
}
