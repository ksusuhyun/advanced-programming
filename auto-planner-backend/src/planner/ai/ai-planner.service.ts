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
  difficulty: number;
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
  difficulty: number;
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

  private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
    const diffWeight = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.4, 5: 1.8 };
    const result: EstimatedChapter[] = [];

    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const weight = chapter.contentVolume * (diffWeight[chapter.difficulty] || 1.0);
        const days = Math.ceil(weight / 10);
        result.push({
          subject: subject.subject,
          title: chapter.chapterTitle,
          contentVolume: chapter.contentVolume,
          estimatedDays: days,
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

    if (style === 'focus') {
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

        const daySlices: Record<string, number> = {};
        for (const ch of subjectChapters) {
          const ratio = ch.weight / totalWeight;
          daySlices[ch.title] = Math.max(1, Math.round(ratio * availableDates.length));
        }

        let dateIdx = 0;
        for (const ch of subjectChapters) {
          const sliceDays = daySlices[ch.title];
          const pagesPerDay = Math.ceil(ch.contentVolume / sliceDays);
          let pageStart = 1;
          for (let i = 0; i < sliceDays; i++) {
            if (dateIdx >= availableDates.length) break;
            const date = availableDates[dateIdx++];
            const pageEnd = Math.min(ch.contentVolume, pageStart + pagesPerDay - 1);
            plans.push({ subject: subject.subject, date, content: `${ch.title} (p.${pageStart}-${pageEnd})` });
            pageStart = pageEnd + 1;
          }
        }
      }
    } else {
      const calendar: Record<string, { subject: string; content: string }[]> = {};
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

        const daySlices: Record<string, number> = {};
        for (const ch of subjectChapters) {
          const ratio = ch.weight / totalWeight;
          daySlices[ch.title] = Math.max(1, Math.round(ratio * availableDates.length));
        }

        let dateIdx = 0;
        for (const ch of subjectChapters) {
          const sliceDays = daySlices[ch.title];
          const pagesPerDay = Math.ceil(ch.contentVolume / sliceDays);
          let pageStart = 1;
          for (let i = 0; i < sliceDays; i++) {
            if (dateIdx >= availableDates.length) break;
            const date = availableDates[dateIdx++];
            const pageEnd = Math.min(ch.contentVolume, pageStart + pagesPerDay - 1);
            if (!calendar[date]) calendar[date] = [];
            calendar[date].push({ subject: subject.subject, content: `${ch.title} (p.${pageStart}-${pageEnd})` });
            pageStart = pageEnd + 1;
          }
        }
      }
      for (const [date, items] of Object.entries(calendar)) {
        for (const item of items) plans.push({ ...item, date });
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
          startDate: format(new Date(matched.startDate), 'yyyy-MM-dd'),
          endDate: format(new Date(matched.endDate), 'yyyy-MM-dd'),
          dailyPlan: [],
          databaseId,
        };
      }

      const dailyPlan = groupedBySubject[subjectKey].dailyPlan;
      const date = item.date;
      const fullContent = item.content;
      dailyPlan.push(`${date}: ${fullContent}`);
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
